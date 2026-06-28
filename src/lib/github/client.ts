import { z } from "zod";
import { FetchTimeoutError, fetchWithTimeout } from "@/lib/api/fetch";
import type { GitHubCommit, GitHubData, GitHubIssue, GitHubRelease, GitHubRepository, ParsedGitHubUrl } from "@/types/analysis";

const GITHUB_TIMEOUT_MS = 15_000;

const githubRepoResponseSchema = z.object({
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  html_url: z.string().url(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  watchers_count: z.number(),
  open_issues_count: z.number(),
  language: z.string().nullable(),
  license: z.object({ spdx_id: z.string().nullable().optional(), name: z.string().nullable().optional() }).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string().nullable(),
  topics: z.array(z.string()).optional(),
  owner: z.object({ login: z.string() })
});

const githubIssueResponseSchema = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  body: z.string().nullable(),
  html_url: z.string().url(),
  state: z.enum(["open", "closed"]),
  created_at: z.string(),
  closed_at: z.string().nullable(),
  updated_at: z.string(),
  comments: z.number(),
  reactions: z.object({ total_count: z.number().optional() }).optional(),
  author_association: z.string().nullable().optional(),
  pull_request: z.unknown().optional(),
  user: z.object({ login: z.string().optional(), type: z.string().optional() }).optional()
});

const githubCommitResponseSchema = z.object({
  sha: z.string(),
  html_url: z.string().url(),
  commit: z.object({
    message: z.string(),
    author: z
      .object({
        name: z.string().nullable().optional(),
        date: z.string().nullable().optional()
      })
      .optional()
  })
});

const githubReleaseResponseSchema = z.object({
  name: z.string().nullable(),
  tag_name: z.string(),
  published_at: z.string().nullable(),
  html_url: z.string().url()
});

const githubContributorResponseSchema = z.object({
  login: z.string()
});

type GitHubRepoResponse = z.infer<typeof githubRepoResponseSchema>;
type GitHubIssueResponse = z.infer<typeof githubIssueResponseSchema>;
type GitHubCommitResponse = z.infer<typeof githubCommitResponseSchema>;
type GitHubReleaseResponse = z.infer<typeof githubReleaseResponseSchema>;

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
  }
}

export async function fetchGitHubData(parsed: ParsedGitHubUrl): Promise<GitHubData> {
  const [repo, issues, closedIssues, commits, releases, readme, contributors] = await Promise.all([
    githubJson(`/repos/${parsed.owner}/${parsed.repo}`, githubRepoResponseSchema),
    githubJson(`/repos/${parsed.owner}/${parsed.repo}/issues?state=all&sort=created&direction=desc&per_page=30`, z.array(githubIssueResponseSchema)),
    githubJson(`/repos/${parsed.owner}/${parsed.repo}/issues?state=closed&sort=updated&direction=desc&per_page=20`, z.array(githubIssueResponseSchema)),
    githubJson(`/repos/${parsed.owner}/${parsed.repo}/commits?per_page=30`, z.array(githubCommitResponseSchema)),
    githubJson(`/repos/${parsed.owner}/${parsed.repo}/releases?per_page=5`, z.array(githubReleaseResponseSchema)),
    githubText(`/repos/${parsed.owner}/${parsed.repo}/readme`, "application/vnd.github.raw").catch(() => ""),
    githubJson(`/repos/${parsed.owner}/${parsed.repo}/contributors?per_page=100`, z.array(githubContributorResponseSchema)).catch(() => [])
  ]);

  const filteredIssues = issues.map(mapIssue).filter((issue) => !issue.isPullRequest);
  const filteredClosedIssues = closedIssues.map(mapIssue).filter((issue) => !issue.isPullRequest);
  const mappedCommits = commits.map(mapCommit);
  const mappedReleases = releases.map(mapRelease);

  return {
    repository: mapRepository(parsed, repo, contributors.length, mappedReleases[0] ?? null, mappedCommits[0] ?? null),
    issues: filteredIssues,
    closedIssues: filteredClosedIssues,
    commits: mappedCommits,
    releases: mappedReleases,
    readme
  };
}

async function githubJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await githubFetch(path, "application/vnd.github+json");
  try {
    return schema.parse(await response.json());
  } catch {
    throw new GitHubApiError("GitHub API returned an unexpected response shape.", 502, "GITHUB_MALFORMED_RESPONSE");
  }
}

async function githubText(path: string, accept: string): Promise<string> {
  const response = await githubFetch(path, accept);
  return response.text();
}

async function githubFetch(path: string, accept: string): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  let response: Response;

  try {
    response = await fetchWithTimeout(
      `https://api.github.com${path}`,
      {
        headers: {
          Accept: accept,
          "X-GitHub-Api-Version": "2022-11-28",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        next: { revalidate: 0 }
      },
      GITHUB_TIMEOUT_MS
    );
  } catch (error) {
    const message = error instanceof FetchTimeoutError ? "GitHub API request timed out." : "GitHub API request failed before a response was received.";
    throw new GitHubApiError(message, 502, "GITHUB_NETWORK_ERROR");
  }

  if (!response.ok) {
    const code =
      response.status === 404
        ? "GITHUB_NOT_FOUND"
        : response.status === 403
          ? "GITHUB_RATE_LIMIT_OR_PRIVATE"
          : "GITHUB_API_ERROR";
    const message =
      response.status === 404
        ? "저장소를 찾을 수 없거나 비공개 저장소입니다."
        : response.status === 403
          ? "GitHub API 제한에 걸렸거나 접근 권한이 없습니다. GITHUB_TOKEN을 설정하면 한도가 늘어납니다."
          : `GitHub API 요청이 실패했습니다. 상태 코드: ${response.status}`;

    throw new GitHubApiError(message, response.status, code);
  }

  return response;
}

function mapRepository(
  parsed: ParsedGitHubUrl,
  repo: GitHubRepoResponse,
  contributors: number,
  latestRelease: GitHubRelease | null,
  latestCommit: GitHubCommit | null
): GitHubRepository {
  return {
    owner: parsed.owner,
    repo: parsed.repo,
    fullName: repo.full_name,
    name: repo.name,
    description: repo.description,
    htmlUrl: repo.html_url,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    watchers: repo.watchers_count,
    openIssues: repo.open_issues_count,
    language: repo.language,
    license: repo.license?.spdx_id || repo.license?.name || null,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
    topics: repo.topics ?? [],
    contributors,
    latestRelease,
    latestCommit
  };
}

function mapIssue(issue: GitHubIssueResponse): GitHubIssue {
  const login = issue.user?.login?.toLowerCase() ?? "";
  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body ?? "",
    htmlUrl: issue.html_url,
    state: issue.state,
    createdAt: issue.created_at,
    closedAt: issue.closed_at,
    updatedAt: issue.updated_at,
    comments: issue.comments,
    reactions: issue.reactions?.total_count ?? 0,
    authorAssociation: issue.author_association ?? null,
    isPullRequest: Boolean(issue.pull_request),
    isBot: issue.user?.type === "Bot" || login.endsWith("[bot]") || login.includes("bot")
  };
}

function mapCommit(commit: GitHubCommitResponse): GitHubCommit {
  return {
    sha: commit.sha,
    message: commit.commit.message,
    committedAt: commit.commit.author?.date ?? new Date().toISOString(),
    htmlUrl: commit.html_url,
    authorName: commit.commit.author?.name ?? null
  };
}

function mapRelease(release: GitHubReleaseResponse): GitHubRelease {
  return {
    name: release.name ?? release.tag_name,
    tagName: release.tag_name,
    publishedAt: release.published_at,
    htmlUrl: release.html_url
  };
}
