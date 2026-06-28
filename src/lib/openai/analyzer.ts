import { qualitativeJsonSchema, qualitativeSummarySchema } from "@/lib/openai/schema";
import type { AnalysisSource, QualitativeSummary, ReadmeSignals, Scores } from "@/types/analysis";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

export async function generateQualitativeSummary(input: {
  repoName: string;
  sources: AnalysisSource[];
  readmeSignals: ReadmeSignals;
  scores: Scores;
}): Promise<QualitativeSummary> {
  if (!process.env.OPENAI_API_KEY) {
    return heuristicSummary(input, "OpenAI API 키가 없어 규칙 기반 해설을 사용했습니다.");
  }

  try {
    const sourceIds = new Set(input.sources.map((source) => source.id));
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "너는 한국어 데이터 분석 리포터다. 사실을 만들지 말고 제공된 sourceId만 근거로 사용한다. 점수는 이미 계산되었으므로 바꾸지 않는다."
          },
          {
            role: "user",
            content: JSON.stringify({
              repoName: input.repoName,
              scores: {
                hype: input.scores.hype.value,
                reality: input.scores.reality.value,
                risk: input.scores.risk.value,
                confidence: input.scores.confidence
              },
              readmeSignals: input.readmeSignals,
              sources: input.sources.slice(0, 35).map((source) => ({
                sourceId: source.id,
                sourceType: source.sourceType,
                title: source.title,
                summary: source.summary,
                sentiment: source.sentiment,
                category: source.category
              }))
            })
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ai_hype_radar_qualitative_summary",
            strict: true,
            schema: qualitativeJsonSchema
          }
        }
      })
    });

    if (!response.ok) {
      return heuristicSummary(input, "AI 해설 생성에 실패했습니다. 정량 분석 결과를 유지합니다.");
    }

    const payload = (await response.json()) as OpenAIChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return heuristicSummary(input, "AI 해설 응답이 비어 있어 규칙 기반 해설을 사용했습니다.");
    }

    const parsed = qualitativeSummarySchema.parse(JSON.parse(content));
    return {
      ...filterInvalidSourceIds(parsed, sourceIds),
      aiGenerated: true
    };
  } catch {
    return heuristicSummary(input, "AI 해설 생성에 실패했습니다. 정량 분석 결과를 유지합니다.");
  }
}

function heuristicSummary(
  input: {
    repoName: string;
    sources: AnalysisSource[];
    readmeSignals: ReadmeSignals;
    scores: Scores;
  },
  error: string
): QualitativeSummary {
  const negativeSources = input.sources.filter((source) => source.sentiment === "negative").slice(0, 5);
  const positiveSources = input.sources.filter((source) => source.sentiment === "positive").slice(0, 5);
  const grouped = new Map<string, AnalysisSource[]>();

  for (const source of negativeSources) {
    grouped.set(source.category, [...(grouped.get(source.category) ?? []), source]);
  }

  const recurringProblems = Array.from(grouped.entries()).map(([category, sources]) => ({
    category: category as QualitativeSummary["recurringProblems"][number]["category"],
    summary: `${category} 관련 부정 신호가 ${sources.length}개 발견되었습니다.`,
    frequency: sources.length,
    sourceIds: sources.map((source) => source.id)
  }));

  const officialClaims = input.readmeSignals.claims.map((claim) => ({
    claim,
    sourceIds: ["readme-1"]
  }));

  const firstNegative = negativeSources[0];
  const claimRealityGaps =
    officialClaims.length > 0 && firstNegative
      ? [
          {
            claim: officialClaims[0].claim,
            userExperience: firstNegative.summary,
            gapLevel: "medium" as const,
            sourceIds: ["readme-1", firstNegative.id]
          }
        ]
      : [];

  return {
    positivePoints: positiveSources.map((source) => ({
      summary: source.summary,
      sourceIds: [source.id]
    })),
    negativePoints: negativeSources.map((source) => ({
      summary: source.summary,
      sourceIds: [source.id]
    })),
    recurringProblems,
    officialClaims,
    claimRealityGaps,
    hypeReason:
      input.scores.hype.value >= 70
        ? "스타, 최근 활동, Reddit 언급량을 기준으로 화제성이 높은 편입니다."
        : "수집된 활동 지표만으로는 폭발적인 화제성을 단정하기 어렵습니다.",
    oneLineVerdict: `${input.repoName}은 Hype ${input.scores.hype.value}, Reality ${input.scores.reality.value}, Risk ${input.scores.risk.value}로 분석되었습니다. 신뢰도는 ${input.scores.confidence}입니다.`,
    aiGenerated: false,
    error
  };
}

function filterInvalidSourceIds<T extends Omit<QualitativeSummary, "aiGenerated" | "error">>(
  summary: T,
  sourceIds: Set<string>
): T {
  const filterIds = (ids: string[]) => ids.filter((id) => sourceIds.has(id));

  return {
    ...summary,
    positivePoints: summary.positivePoints.map((point) => ({ ...point, sourceIds: filterIds(point.sourceIds) })),
    negativePoints: summary.negativePoints.map((point) => ({ ...point, sourceIds: filterIds(point.sourceIds) })),
    recurringProblems: summary.recurringProblems.map((problem) => ({ ...problem, sourceIds: filterIds(problem.sourceIds) })),
    officialClaims: summary.officialClaims.map((claim) => ({ ...claim, sourceIds: filterIds(claim.sourceIds) })),
    claimRealityGaps: summary.claimRealityGaps.map((gap) => ({ ...gap, sourceIds: filterIds(gap.sourceIds) }))
  };
}
