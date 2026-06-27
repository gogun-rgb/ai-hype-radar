import type { GitHubCommit, GitHubData, GitHubIssue, GitHubRelease, GitHubRepository, ParsedGitHubUrl } from "@/types/analysis";

interface GitHubRepoResponse {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  language: string | null;
  license: { spdx_id?: string | null; name?: string | null } | null;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  topics?: string[];
  owner: { login: string };
}

interface GitHubIssueResponse {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: "open" | "closed";
  created_at: string;
  closed_at: string | null;
  updated_at: string;
  comments: number;
  reactions?: { total_count?: number };
  author_association?: string | null;
  pull_request?: unknown;
  user?: { login?: string; type?: string };
}

interface GitHubCommitResponse {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: {
      name?: string | null;
      date?: string | null;
    };
  };
}

interface GitHubReleaseResponse {
  name: string | null;
  tag_name: string;
  published_at: string | null;
  html_url: string;
}

interface GitHubContributorResponse {
  login: string;
}

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
    githubJson<GitHubRepoResponse>(`/repos/${parsed.owner}/${parsed.repo}`),
    githubJson<GitHubIssueResponse[]>(`/repos/${parsed.owner}/${parsed.repo}/issues?state=all&sort=created&direction=desc&per_page=30`),
    githubJson<GitHubIssueResponse[]>(`/repos/${parsed.owner}/${parsed.repo}/issues?state=closed&sort=updated&direction=desc&per_page=20`),
    githubJson<GitHubCommitResponse[]>(`/repos/${parsed.owner}/${parsed.repo}/commits?per_page=30`),
    githubJson<GitHubReleaseResponse[]>(`/repos/${parsed.owner}/${parsed.repo}/releases?per_page=5`),
    githubText(`/repos/${parsed.owner}/${parsed.repo}/readme`, "application/vnd.github.raw").catch(() => ""),
    githubJson<GitHubContributorResponse[]>(`/repos/${parsed.owner}/${parsed.repo}/contributors?per_page=100`).catch(() => [])
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

async function githubJson<T>(path: string): Promise<T> {
  const response = await githubFetch(path, "application/vnd.github+json");
  return (await response.json()) as T;
}

async function githubText(path: string, accept: string): Promise<string> {
  const response = await githubFetch(path, accept);
  return response.text();
}

async function githubFetch(path: string, accept: string): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    next: { revalidate: 0 }
  });

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
