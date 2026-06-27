import { apiError, apiOk } from "@/lib/api/response";
import { fetchGitHubData, GitHubApiError } from "@/lib/github/client";
import { getLatestAnalysisForRepo } from "@/lib/storage/repository";
import type { ParsedGitHubUrl } from "@/types/analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;

  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
    return apiError("INVALID_REPOSITORY", "저장소 경로가 올바르지 않습니다.", 400);
  }

  const latest = await getLatestAnalysisForRepo(owner, repo);
  if (latest) {
    return apiOk({ repository: latest.repository, fromCache: true });
  }

  try {
    const parsed: ParsedGitHubUrl = {
      owner,
      repo,
      canonicalUrl: `https://github.com/${owner}/${repo}`
    };
    const github = await fetchGitHubData(parsed);
    return apiOk({ repository: github.repository, fromCache: false });
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return apiError(error.code, error.message, error.status === 403 ? 429 : error.status);
    }

    return apiError("REPOSITORY_FETCH_FAILED", "저장소 정보를 가져오지 못했습니다.", 500);
  }
}
