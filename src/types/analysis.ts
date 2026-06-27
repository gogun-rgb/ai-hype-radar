export type Sentiment = "positive" | "negative" | "neutral";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type SourceType =
  | "github_issue"
  | "github_commit"
  | "github_release"
  | "github_readme"
  | "reddit_post"
  | "reddit_comment";

export type ProblemCategory =
  | "installation"
  | "windows"
  | "macos"
  | "linux"
  | "dependency"
  | "security"
  | "privacy"
  | "api_cost"
  | "rate_limit"
  | "vendor_lock_in"
  | "performance"
  | "crash"
  | "documentation"
  | "maintenance"
  | "none";

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  canonicalUrl: string;
}

export interface GitHubRelease {
  name: string;
  tagName: string;
  publishedAt: string | null;
  htmlUrl: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  committedAt: string;
  htmlUrl: string;
  authorName: string | null;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  htmlUrl: string;
  state: "open" | "closed";
  createdAt: string;
  closedAt: string | null;
  updatedAt: string;
  comments: number;
  reactions: number;
  authorAssociation: string | null;
  isPullRequest: boolean;
  isBot: boolean;
}

export interface GitHubRepository {
  owner: string;
  repo: string;
  fullName: string;
  name: string;
  description: string | null;
  htmlUrl: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string | null;
  license: string | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string | null;
  topics: string[];
  contributors: number;
  latestRelease: GitHubRelease | null;
  latestCommit: GitHubCommit | null;
}

export interface GitHubData {
  repository: GitHubRepository;
  issues: GitHubIssue[];
  closedIssues: GitHubIssue[];
  commits: GitHubCommit[];
  releases: GitHubRelease[];
  readme: string;
}

export interface RedditPost {
  id: string;
  title: string;
  body: string;
  subreddit: string;
  createdAt: string;
  score: number;
  comments: number;
  url: string;
  permalink: string;
}

export interface AnalysisSource {
  id: string;
  sourceType: SourceType;
  title: string;
  summary: string;
  url: string;
  sentiment: Sentiment;
  category: ProblemCategory;
  publishedAt: string | null;
  score?: number;
  reactions?: number;
  metadata?: Record<string, unknown>;
}

export interface ReadmeSignals {
  completenessScore: number;
  sections: {
    installation: boolean;
    usage: boolean;
    requirements: boolean;
    license: boolean;
    examples: boolean;
    troubleshooting: boolean;
  };
  claims: string[];
  hasDemoSignals: boolean;
  wordCount: number;
}

export interface ScoreBreakdownItem {
  label: string;
  value: number;
  weight: number;
  explanation: string;
}

export interface ScoreResult {
  value: number;
  provisional: boolean;
  breakdown: ScoreBreakdownItem[];
}

export interface Scores {
  hype: ScoreResult;
  reality: ScoreResult;
  risk: ScoreResult;
  confidence: ConfidenceLevel;
  confidenceReasons: string[];
}

export interface QualitativePoint {
  summary: string;
  sourceIds: string[];
}

export interface RecurringProblem {
  category: ProblemCategory;
  summary: string;
  frequency: number;
  sourceIds: string[];
}

export interface OfficialClaim {
  claim: string;
  sourceIds: string[];
}

export interface ClaimRealityGap {
  claim: string;
  userExperience: string;
  gapLevel: "low" | "medium" | "high";
  sourceIds: string[];
}

export interface QualitativeSummary {
  positivePoints: QualitativePoint[];
  negativePoints: QualitativePoint[];
  recurringProblems: RecurringProblem[];
  officialClaims: OfficialClaim[];
  claimRealityGaps: ClaimRealityGap[];
  hypeReason: string;
  oneLineVerdict: string;
  aiGenerated: boolean;
  error?: string;
}

export interface RepositorySnapshot {
  id: string;
  repositoryId: string;
  stars: number;
  forks: number;
  openIssues: number;
  contributors: number;
  recentCommits: number;
  recentReleases: number;
  capturedAt: string;
}

export interface AnalysisResult {
  id: string;
  repositoryId: string;
  repository: GitHubRepository;
  snapshot: RepositorySnapshot;
  sources: AnalysisSource[];
  scores: Scores;
  readmeSignals: ReadmeSignals;
  qualitative: QualitativeSummary;
  canvaPrompt: string;
  notices: string[];
  analysisStatus: "complete" | "partial" | "failed";
  basisPeriod: string;
  collectedCounts: {
    issues: number;
    closedIssues: number;
    commits: number;
    releases: number;
    redditPosts: number;
    redditComments: number;
    sources: number;
  };
  isDemo: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}
