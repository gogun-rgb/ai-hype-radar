import { randomUUID } from "node:crypto";
import { generateCanvaPrompt } from "@/lib/canva/prompt";
import { fetchGitHubData, GitHubApiError } from "@/lib/github/client";
import { createDemoGitHubData } from "@/lib/github/demo";
import { generateQualitativeSummary } from "@/lib/openai/analyzer";
import { buildAnalysisSources } from "@/lib/analysis/sources";
import { analyzeReadme } from "@/lib/preprocessing/readme";
import { searchReddit } from "@/lib/reddit/client";
import { calculateScores } from "@/lib/scoring/calculate";
import { getPreviousSnapshot, saveAnalysis } from "@/lib/storage/repository";
import { parseGitHubUrl } from "@/lib/validation/github-url";
import type { AnalysisResult, GitHubData, RedditPost, RepositorySnapshot } from "@/types/analysis";

export async function runAnalysis(githubUrl: string): Promise<AnalysisResult> {
  const parsed = parseGitHubUrl(githubUrl);
  const notices: string[] = [];
  const previousSnapshot = await getPreviousSnapshot(parsed.owner, parsed.repo);
  let isDemo = false;

  let github: GitHubData;
  if (process.env.E2E_DEMO === "true") {
    github = createDemoGitHubData(parsed);
    isDemo = true;
    notices.push("E2E DEMO 모드로 실제 외부 API를 호출하지 않았습니다.");
  } else {
    try {
      github = await fetchGitHubData(parsed);
    } catch (error) {
      if (process.env.DEMO_MODE === "true") {
        github = createDemoGitHubData(parsed);
        isDemo = true;
        notices.push("DEMO MODE: GitHub API 요청 실패로 실제 데이터 대신 명시된 예시 데이터를 사용했습니다.");
        if (error instanceof GitHubApiError) {
          notices.push(error.message);
        }
      } else {
        throw error;
      }
    }
  }

  const readmeSignals = analyzeReadme(github.readme);
  const reddit = isDemo
    ? { posts: [] as RedditPost[], status: "not_configured" as const, disabledReason: "DEMO MODE에서는 Reddit 실제 검색을 수행하지 않았습니다." }
    : await searchReddit(buildRedditQueries(github));
  if (reddit.disabledReason) {
    notices.push(reddit.disabledReason);
  }

  const sources = buildAnalysisSources(github, reddit.posts);
  const scores = calculateScores({
    github,
    redditPosts: reddit.posts,
    redditStatus: reddit.status,
    sources,
    readmeSignals,
    previousSnapshot
  });
  const qualitative = await generateQualitativeSummary({
    repoName: github.repository.fullName,
    sources,
    readmeSignals,
    scores
  });

  if (qualitative.error) {
    notices.push(qualitative.error);
  }

  if (scores.hype.provisional) {
    notices.push("최초 분석으로 정확한 스타/포크 증가량 데이터가 부족합니다. 이후 재분석하면 Snapshot 차이를 반영합니다.");
  }

  const createdAt = new Date().toISOString();
  const repositoryId = stableRepositoryId(github.repository.owner, github.repository.repo);
  const snapshot = buildSnapshot(repositoryId, github, createdAt);
  const basisPeriod = "최근 GitHub Issue 최대 30개, 최근 Commit 최대 30개, Reddit 최근 1년 검색 결과";
  const resultBase = {
    id: randomUUID(),
    repositoryId,
    repository: github.repository,
    snapshot,
    sources,
    scores,
    readmeSignals,
    qualitative,
    notices,
    analysisStatus: qualitative.aiGenerated || sources.length > 0 ? "complete" : "partial",
    basisPeriod,
    collectedCounts: {
      issues: github.issues.length,
      closedIssues: github.closedIssues.length,
      commits: github.commits.length,
      releases: github.releases.length,
      redditPosts: reddit.posts.length,
      redditComments: reddit.posts.reduce((sum, post) => sum + post.comments, 0),
      sources: sources.length
    },
    isDemo,
    createdAt
  } satisfies Omit<AnalysisResult, "canvaPrompt">;

  const canvaPrompt = generateCanvaPrompt({
    repository: resultBase.repository,
    scores: resultBase.scores,
    qualitative: resultBase.qualitative,
    basisPeriod,
    sourcesCount: sources.length
  });

  const result: AnalysisResult = {
    ...resultBase,
    canvaPrompt
  };

  await saveAnalysis(result);
  return result;
}

function buildSnapshot(repositoryId: string, github: GitHubData, capturedAt: string): RepositorySnapshot {
  return {
    id: randomUUID(),
    repositoryId,
    stars: github.repository.stars,
    forks: github.repository.forks,
    openIssues: github.repository.openIssues,
    contributors: github.repository.contributors,
    recentCommits: github.commits.length,
    recentReleases: github.releases.length,
    capturedAt
  };
}

function stableRepositoryId(owner: string, repo: string): string {
  return `${owner.toLowerCase()}--${repo.toLowerCase()}`;
}

function buildRedditQueries(github: GitHubData): string[] {
  const name = github.repository.name;
  const fullName = github.repository.fullName;
  const topics = github.repository.topics.slice(0, 2).join(" ");

  return Array.from(
    new Set([
      `"${name}"`,
      `"${fullName}"`,
      `"${name}" install`,
      `"${name}" review`,
      `"${name}" error`,
      topics ? `"${name}" ${topics}` : `"${name}" AI`
    ])
  );
}
