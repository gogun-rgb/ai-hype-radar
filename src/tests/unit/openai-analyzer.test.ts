import { afterEach, describe, expect, it, vi } from "vitest";
import { generateQualitativeSummary } from "@/lib/openai/analyzer";
import type { AnalysisSource, ReadmeSignals, Scores } from "@/types/analysis";

const originalEnv = { ...process.env };

const readmeSignals: ReadmeSignals = {
  completenessScore: 80,
  sections: {
    installation: true,
    usage: true,
    requirements: true,
    license: true,
    examples: false,
    troubleshooting: false
  },
  claims: ["Fast AI workflow"],
  hasDemoSignals: true,
  wordCount: 450
};

const scores: Scores = {
  hype: score(60),
  reality: score(70),
  risk: score(20),
  confidence: "Medium",
  confidenceReasons: ["test"],
  dataCoverage: {
    overall: 75,
    scoreImpact: "partial",
    sources: [],
    missingCriticalSignals: []
  }
};

describe("generateQualitativeSummary", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = originalEnv;
  });

  it("uses rule-based fallback when OpenAI is not configured", async () => {
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: ""
    };
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateQualitativeSummary({
      repoName: "acme/demo",
      sources: [],
      readmeSignals,
      scores
    });

    expect(result.aiGenerated).toBe(false);
    expect(result.error).toContain("OpenAI");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("parses valid OpenAI JSON and filters unknown source ids", async () => {
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: "test-key"
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  positivePoints: [{ summary: "Works well.", sourceIds: ["github-issue-1", "unknown"] }],
                  negativePoints: [],
                  recurringProblems: [],
                  officialClaims: [],
                  claimRealityGaps: [],
                  hypeReason: "Activity is visible.",
                  oneLineVerdict: "Promising but verify before use."
                })
              }
            }
          ]
        })
      )
    );

    const result = await generateQualitativeSummary({
      repoName: "acme/demo",
      sources: [source],
      readmeSignals,
      scores
    });

    expect(result.aiGenerated).toBe(true);
    expect(result.positivePoints[0].sourceIds).toEqual(["github-issue-1"]);
  });

  it("falls back when OpenAI returns a non-success status", async () => {
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: "test-key"
    };
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "rate_limited" }, 429)));

    const result = await generateQualitativeSummary({
      repoName: "acme/demo",
      sources: [source],
      readmeSignals,
      scores
    });

    expect(result.aiGenerated).toBe(false);
    expect(result.error).toContain("AI");
  });
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function score(value: number): Scores["hype"] {
  return {
    value,
    provisional: false,
    breakdown: [],
    availableWeight: 1,
    missingSignals: [],
    dataLimited: false
  };
}

const source: AnalysisSource = {
  id: "github-issue-1",
  sourceType: "github_issue",
  title: "Install works",
  summary: "Install works on Windows.",
  url: "https://github.com/acme/demo/issues/1",
  sentiment: "positive",
  category: "installation",
  publishedAt: "2024-01-01T00:00:00.000Z"
};
