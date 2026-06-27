export const SCORING_CONFIG = {
  hype: {
    starMomentumWeight: 0.4,
    redditMentionsWeight: 0.3,
    forkMomentumWeight: 0.15,
    activityWeight: 0.15
  },
  reality: {
    commitActivityWeight: 0.2,
    installSuccessWeight: 0.25,
    issueResolutionWeight: 0.2,
    documentationWeight: 0.2,
    realOutputWeight: 0.15
  },
  risk: {
    unresolvedBugsWeight: 0.25,
    securityWeight: 0.25,
    costWeight: 0.2,
    installComplexityWeight: 0.15,
    apiDependencyWeight: 0.15
  },
  normalization: {
    highStarAgeAdjusted: 5000,
    highForkRatio: 0.2,
    highRecentIssueCount: 20,
    highRecentCommitCount: 30,
    highRedditMentions: 20,
    freshCommitDays: 14,
    staleCommitDays: 180,
    fastIssueResolutionDays: 7,
    slowIssueResolutionDays: 60
  }
} as const;

export const RISK_KEYWORDS = {
  installation: ["install", "installation", "setup", "pip install", "npm install", "build failed", "cannot install"],
  windows: ["windows", "powershell", "win32", "path error", "visual studio build tools"],
  macos: ["macos", "osx", "apple silicon", "m1", "m2", "m3", "darwin"],
  linux: ["linux", "ubuntu", "debian", "glibc", "wsl"],
  dependency: ["dependency", "dependencies", "package conflict", "version conflict", "peer dependency"],
  security: ["security", "vulnerability", "cve", "xss", "injection", "exploit"],
  privacy: ["privacy", "personal data", "pii", "tracking", "telemetry"],
  api_cost: ["cost", "billing", "expensive", "credits", "token cost", "api bill", "pricing"],
  rate_limit: ["rate limit", "quota", "429", "too many requests"],
  vendor_lock_in: ["openai key", "api key", "vendor", "lock-in", "requires openai", "requires anthropic"],
  performance: ["slow", "latency", "performance", "memory", "gpu", "timeout"],
  crash: ["crash", "exception", "stack trace", "segfault", "panic", "fatal"],
  documentation: ["docs", "documentation", "readme", "unclear", "missing guide"],
  maintenance: ["unmaintained", "stale", "no response", "abandoned", "dead project"]
} as const;

export const POSITIVE_KEYWORDS = [
  "works",
  "worked",
  "success",
  "successful",
  "great",
  "useful",
  "amazing",
  "love",
  "fast",
  "easy",
  "fixed",
  "resolved",
  "좋",
  "성공",
  "유용"
] as const;

export const NEGATIVE_KEYWORDS = [
  "error",
  "failed",
  "failure",
  "bug",
  "broken",
  "crash",
  "doesn't work",
  "not working",
  "slow",
  "expensive",
  "issue",
  "problem",
  "오류",
  "실패",
  "문제"
] as const;
