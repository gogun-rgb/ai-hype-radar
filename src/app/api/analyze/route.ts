import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { GitHubApiError } from "@/lib/github/client";
import { runAnalysis } from "@/lib/analysis/run-analysis";
import { getLatestAnalysisForRepo } from "@/lib/storage/repository";
import { parseGitHubUrl } from "@/lib/validation/github-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const analyzeRequestSchema = z.object({
  url: z.string().min(1),
  force: z.boolean().optional().default(false)
});

export async function POST(request: Request) {
  try {
    const body = analyzeRequestSchema.parse(await request.json());
    const parsed = parseGitHubUrl(body.url);

    if (!body.force) {
      const recent = await getLatestAnalysisForRepo(parsed.owner, parsed.repo, 15);
      if (recent) {
        return apiOk({ analysis: recent, reused: true });
      }
    }

    const analysis = await runAnalysis(body.url);
    return apiOk({ analysis, reused: false }, 201);
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return apiError(error.code, error.message, error.status === 403 ? 429 : error.status);
    }

    if (error instanceof z.ZodError) {
      return apiError("INVALID_REQUEST", "요청 형식이 올바르지 않습니다.", 400);
    }

    if (error instanceof Error) {
      return apiError("INVALID_GITHUB_URL", error.message, 400);
    }

    return apiError("ANALYSIS_FAILED", "분석 중 알 수 없는 오류가 발생했습니다.", 500);
  }
}
