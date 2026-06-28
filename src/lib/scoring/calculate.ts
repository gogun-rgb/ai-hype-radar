import { SCORING_CONFIG } from "@/config/scoring";
import { classifyCategory, classifySentiment } from "@/lib/preprocessing/classify";
import { calculateWeightedScore, clampScore, daysBetween, median, normalize, type WeightedSignal } from "@/lib/scoring/utils";
import type {
  AnalysisSource,
  ConfidenceLevel,
  DataCoverage,
  DataCoverageSource,
  DataSourceStatus,
  GitHubData,
  ReadmeSignals,
  RedditPost,
  RepositorySnapshot,
  ScoreResult,
  Scores
} from "@/types/analysis";

export interface ScoreInput {
  github: GitHubData;
  redditPosts: RedditPost[];
  sources: AnalysisSource[];
  readmeSignals: ReadmeSignals;
  previousSnapshot?: RepositorySnapshot | null;
  redditStatus?: DataSourceStatus;
}

export function calculateScores(input: ScoreInput): Scores {
  const normalizedInput = {
    ...input,
    redditStatus: input.redditStatus ?? inferRedditStatus(input.redditPosts)
  };
  const dataCoverage = calculateDataCoverage(normalizedInput);
  const hype = calculateHypeScore(normalizedInput);
  const reality = calculateRealityScore(normalizedInput);
  const risk = calculateRiskScore(normalizedInput);
  const confidence = calculateConfidence(normalizedInput, dataCoverage);

  return {
    hype,
    reality,
    risk,
    confidence: confidence.level,
    confidenceReasons: confidence.reasons,
    dataCoverage
  };
}

export function calculateHypeScore(input: ScoreInput): ScoreResult {
  const redditStatus = input.redditStatus ?? inferRedditStatus(input.redditPosts);
  const { github, redditPosts, previousSnapshot } = input;
  const repo = github.repository;
  const ageDays = Math.max(1, daysBetween(repo.createdAt));
  const recentIssues = github.issues.filter((issue) => daysBetween(issue.createdAt) <= 30).length;
  const recentCommits = github.commits.filter((commit) => daysBetween(commit.committedAt) <= 30).length;
  const provisional = !previousSnapshot;

  const starMomentum = previousSnapshot
    ? normalize(repo.stars - previousSnapshot.stars, Math.max(100, previousSnapshot.stars * 0.1))
    : normalize(repo.stars / Math.sqrt(ageDays), SCORING_CONFIG.normalization.highStarAgeAdjusted / 10);

  const forkMomentum = previousSnapshot
    ? normalize(repo.forks - previousSnapshot.forks, Math.max(20, previousSnapshot.forks * 0.1))
    : normalize(repo.stars === 0 ? 0 : repo.forks / repo.stars, SCORING_CONFIG.normalization.highForkRatio);

  const redditMentions = normalize(redditPosts.length, SCORING_CONFIG.normalization.highRedditMentions);
  const redditAvailable = isScoreAvailable(redditStatus);
  const activity = clampScore(
    normalize(recentIssues, SCORING_CONFIG.normalization.highRecentIssueCount) * 0.45 +
      normalize(recentCommits, SCORING_CONFIG.normalization.highRecentCommitCount) * 0.55
  );

  return buildScoreResult(
    [
      {
        label: provisional ? "저장소 연령 대비 스타 모멘텀" : "이전 Snapshot 대비 스타 증가",
        value: starMomentum,
        weight: SCORING_CONFIG.hype.starMomentumWeight,
        available: true,
        status: "available",
        explanation: provisional
          ? "최초 분석이라 과거 스타 수 대신 생성일 대비 현재 스타 수를 제한적으로 사용했습니다."
          : "이전 분석 Snapshot과 현재 스타 수를 비교했습니다."
      },
      {
        label: "Reddit 언급량",
        value: redditMentions,
        weight: SCORING_CONFIG.hype.redditMentionsWeight,
        available: redditAvailable,
        status: redditStatus,
        explanation: redditExplanation(redditStatus, redditPosts.length)
      },
      {
        label: provisional ? "포크 비율" : "이전 Snapshot 대비 포크 증가",
        value: forkMomentum,
        weight: SCORING_CONFIG.hype.forkMomentumWeight,
        available: true,
        status: "available",
        explanation: provisional ? "현재 스타 대비 포크 비율을 사용했습니다." : "이전 Snapshot과 현재 포크 수를 비교했습니다."
      },
      {
        label: "최근 Issue·Commit 활동",
        value: activity,
        weight: SCORING_CONFIG.hype.activityWeight,
        available: true,
        status: "available",
        explanation: `최근 30일 Issue ${recentIssues}개, Commit ${recentCommits}개를 반영했습니다.`
      }
    ],
    provisional
  );
}

export function calculateRealityScore(input: ScoreInput): ScoreResult {
  const { github, sources, readmeSignals } = input;
  const repo = github.repository;
  const daysSinceCommit = repo.latestCommit ? daysBetween(repo.latestCommit.committedAt) : SCORING_CONFIG.normalization.staleCommitDays;
  const recentCommitCount = github.commits.filter((commit) => daysBetween(commit.committedAt) <= 30).length;
  const commitActivity = clampScore(
    normalize(recentCommitCount, SCORING_CONFIG.normalization.highRecentCommitCount) * 0.6 +
      (daysSinceCommit <= SCORING_CONFIG.normalization.freshCommitDays
        ? 40
        : daysSinceCommit >= SCORING_CONFIG.normalization.staleCommitDays
          ? 0
          : 40 - (daysSinceCommit / SCORING_CONFIG.normalization.staleCommitDays) * 40)
  );

  const installRelated = sources.filter((source) => source.category === "installation" || source.category === "dependency");
  const positiveInstall = installRelated.filter((source) => source.sentiment === "positive").length;
  const installSuccess = installRelated.length === 0 ? 45 : clampScore((positiveInstall / installRelated.length) * 100);

  const resolutionDays = github.closedIssues
    .filter((issue) => issue.closedAt)
    .map((issue) => daysBetween(issue.createdAt, issue.closedAt ?? new Date()));
  const medianResolution = median(resolutionDays);
  const issueResolution =
    resolutionDays.length === 0
      ? 40
      : clampScore(
          100 -
            normalize(
              Math.max(0, medianResolution - SCORING_CONFIG.normalization.fastIssueResolutionDays),
              SCORING_CONFIG.normalization.slowIssueResolutionDays
            )
        );

  const documentation = readmeSignals.completenessScore;
  const realOutputSignals = readmeSignals.hasDemoSignals || sources.some((source) => /\b(demo|example|showcase|works)\b/i.test(source.summary)) ? 80 : 35;

  return buildScoreResult(
    [
      {
        label: "최근 커밋 활동",
        value: commitActivity,
        weight: SCORING_CONFIG.reality.commitActivityWeight,
        available: github.commits.length > 0,
        status: github.commits.length > 0 ? "available" : "insufficient",
        explanation: `최근 30일 Commit ${recentCommitCount}개와 마지막 Commit 시점을 반영했습니다.`
      },
      {
        label: "설치 성공 후기",
        value: installSuccess,
        weight: SCORING_CONFIG.reality.installSuccessWeight,
        available: installRelated.length > 0,
        status: installRelated.length > 0 ? "available" : "insufficient",
        explanation:
          installRelated.length > 0
            ? `설치 관련 근거 ${installRelated.length}개 중 긍정 반응 ${positiveInstall}개를 반영했습니다.`
            : "설치 후기가 부족해 이 신호는 점수에서 제외하고 다른 Reality 신호로 재정규화했습니다."
      },
      {
        label: "Issue 해결 속도",
        value: issueResolution,
        weight: SCORING_CONFIG.reality.issueResolutionWeight,
        available: resolutionDays.length > 0,
        status: resolutionDays.length > 0 ? "available" : "insufficient",
        explanation:
          resolutionDays.length > 0
            ? `닫힌 Issue의 해결 기간 중앙값은 ${Math.round(medianResolution)}일입니다.`
            : "닫힌 Issue 데이터가 부족해 이 신호는 점수에서 제외했습니다."
      },
      {
        label: "문서 완성도",
        value: documentation,
        weight: SCORING_CONFIG.reality.documentationWeight,
        available: readmeSignals.wordCount > 0,
        status: readmeSignals.wordCount > 0 ? "available" : "insufficient",
        explanation: "README의 설치, 사용법, 요구사항, 라이선스, 예제, 문제 해결 섹션을 확인했습니다."
      },
      {
        label: "실제 결과물 사례",
        value: realOutputSignals,
        weight: SCORING_CONFIG.reality.realOutputWeight,
        available: readmeSignals.wordCount > 0,
        status: readmeSignals.hasDemoSignals ? "available" : "insufficient",
        explanation: readmeSignals.hasDemoSignals ? "README에서 demo/example/showcase 신호를 찾았습니다." : "결과물 사례 신호가 제한적입니다."
      }
    ],
    false
  );
}

export function calculateRiskScore(input: ScoreInput): ScoreResult {
  const { github, sources, readmeSignals } = input;
  const issueOrCommunitySources = sources.filter((source) => source.sourceType !== "github_readme");
  const hasCommunityEvidence = issueOrCommunitySources.length > 0;
  const openBugLikeIssues = github.issues.filter((issue) => {
    const text = `${issue.title} ${issue.body}`;
    const sentiment = classifySentiment(text);
    const category = classifyCategory(text);
    return issue.state === "open" && sentiment === "negative" && category !== "none";
  }).length;
  const unresolvedBugs = normalize(openBugLikeIssues, 10);
  const security = normalize(sources.filter((source) => source.category === "security" || source.category === "privacy").length, 5);
  const cost = normalize(sources.filter((source) => source.category === "api_cost" || source.category === "rate_limit").length, 5);
  const installComplexity = normalize(
    sources.filter((source) => ["installation", "dependency", "windows", "macos", "linux"].includes(source.category)).length,
    10
  );
  const apiDependency =
    /\b(openai|anthropic|gemini|api key|cloud|hosted|token)\b/i.test(github.readme) || readmeSignals.claims.some((claim) => /api|cloud|token/i.test(claim)) ? 65 : 20;

  return buildScoreResult(
    [
      {
        label: "미해결 버그",
        value: unresolvedBugs,
        weight: SCORING_CONFIG.risk.unresolvedBugsWeight,
        available: github.issues.length > 0 || github.repository.openIssues === 0,
        status: github.issues.length > 0 || github.repository.openIssues === 0 ? "available" : "insufficient",
        explanation: `열린 Issue 중 위험 키워드가 있는 항목 ${openBugLikeIssues}개를 반영했습니다.`
      },
      {
        label: "보안·개인정보 Issue",
        value: security,
        weight: SCORING_CONFIG.risk.securityWeight,
        available: hasCommunityEvidence,
        status: hasCommunityEvidence ? "available" : "insufficient",
        explanation: hasCommunityEvidence ? "security/privacy 키워드가 있는 근거를 계산했습니다." : "검토할 Issue 또는 Reddit 근거가 부족해 이 신호는 제외했습니다."
      },
      {
        label: "비용 불확실성",
        value: cost,
        weight: SCORING_CONFIG.risk.costWeight,
        available: hasCommunityEvidence,
        status: hasCommunityEvidence ? "available" : "insufficient",
        explanation: hasCommunityEvidence ? "API 비용, quota, rate limit 관련 신호를 반영했습니다." : "검토할 커뮤니티 근거가 부족해 이 신호는 제외했습니다."
      },
      {
        label: "설치 복잡도",
        value: installComplexity,
        weight: SCORING_CONFIG.risk.installComplexityWeight,
        available: hasCommunityEvidence,
        status: hasCommunityEvidence ? "available" : "insufficient",
        explanation: hasCommunityEvidence ? "설치, 의존성, OS별 오류 신호를 반영했습니다." : "설치 관련 근거가 부족해 이 신호는 제외했습니다."
      },
      {
        label: "특정 API 종속성",
        value: apiDependency,
        weight: SCORING_CONFIG.risk.apiDependencyWeight,
        available: readmeSignals.wordCount > 0,
        status: readmeSignals.wordCount > 0 ? "available" : "insufficient",
        explanation: "README와 공식 주장에 외부 API key 또는 클라우드 종속 신호가 있는지 확인했습니다."
      }
    ],
    false
  );
}

export function calculateDataCoverage(input: ScoreInput): DataCoverage {
  const redditStatus = input.redditStatus ?? inferRedditStatus(input.redditPosts);
  const sources: DataCoverageSource[] = [
    {
      key: "github_repository",
      label: "GitHub repository metadata",
      status: "available",
      collected: 1,
      expected: 1,
      coverage: 100,
      affectsScore: true,
      note: "Repository metadata was collected."
    },
    {
      key: "github_issues",
      label: "GitHub issues",
      status: input.github.issues.length > 0 ? "available" : "insufficient",
      collected: input.github.issues.length,
      expected: 30,
      coverage: input.github.issues.length > 0 ? normalize(input.github.issues.length, 30) : 20,
      affectsScore: true,
      note: `${input.github.issues.length} recent non-PR issues were collected.`
    },
    {
      key: "github_commits",
      label: "GitHub commits",
      status: input.github.commits.length > 0 ? "available" : "insufficient",
      collected: input.github.commits.length,
      expected: 30,
      coverage: input.github.commits.length > 0 ? normalize(input.github.commits.length, 30) : 20,
      affectsScore: true,
      note: `${input.github.commits.length} recent commits were collected.`
    },
    {
      key: "github_readme",
      label: "README",
      status: input.readmeSignals.wordCount > 0 ? "available" : "insufficient",
      collected: input.readmeSignals.wordCount,
      expected: 400,
      coverage: input.readmeSignals.wordCount > 0 ? input.readmeSignals.completenessScore : 0,
      affectsScore: true,
      note: `README completeness score is ${input.readmeSignals.completenessScore}.`
    },
    {
      key: "reddit",
      label: "Reddit search",
      status: redditStatus,
      collected: input.redditPosts.length,
      expected: SCORING_CONFIG.normalization.highRedditMentions,
      coverage: redditCoverage(redditStatus, input.redditPosts.length),
      affectsScore: true,
      note: redditCoverageNote(redditStatus, input.redditPosts.length)
    },
    {
      key: "historical_snapshot",
      label: "Previous snapshot",
      status: input.previousSnapshot ? "available" : "insufficient",
      collected: input.previousSnapshot ? 1 : 0,
      expected: 1,
      coverage: input.previousSnapshot ? 100 : 30,
      affectsScore: true,
      note: input.previousSnapshot ? "Previous snapshot is available for delta comparison." : "First analysis; exact growth deltas are not available yet."
    }
  ];

  const overall = clampScore(sources.reduce((sum, source) => sum + source.coverage, 0) / sources.length);
  const missingCriticalSignals = sources
    .filter((source) => source.affectsScore && !isScoreAvailable(source.status))
    .map((source) => source.label);

  return {
    overall,
    scoreImpact: overall >= 80 ? "complete" : overall >= 45 ? "partial" : "limited",
    sources,
    missingCriticalSignals
  };
}

function buildScoreResult(signals: WeightedSignal[], provisional: boolean): ScoreResult {
  const result = calculateWeightedScore(signals);
  return {
    value: result.value,
    provisional,
    breakdown: result.breakdown,
    availableWeight: result.availableWeight,
    missingSignals: result.missingSignals,
    dataLimited: result.dataLimited
  };
}

function calculateConfidence(input: ScoreInput, dataCoverage: DataCoverage): { level: ConfidenceLevel; reasons: string[] } {
  const redditStatus = input.redditStatus ?? inferRedditStatus(input.redditPosts);
  const reasons: string[] = [];
  let points = 0;

  if (input.github.issues.length >= 20) {
    points += 2;
    reasons.push("Issue data is strong: 20 or more recent issues were collected.");
  } else if (input.github.issues.length >= 5) {
    points += 1;
    reasons.push("Issue data is usable but not broad.");
  } else {
    reasons.push("Issue data is sparse, so issue-based conclusions are limited.");
  }

  if (redditStatus === "available" && input.redditPosts.length >= 5) {
    points += 2;
    reasons.push("Reddit data is available with multiple posts.");
  } else if (redditStatus === "available" || redditStatus === "insufficient") {
    points += 1;
    reasons.push("Reddit search was available, but community evidence is limited.");
  } else {
    reasons.push("Reddit data was not available and was excluded from score weighting.");
  }

  if (input.previousSnapshot) {
    points += 1;
    reasons.push("A previous snapshot is available for real growth comparison.");
  } else {
    reasons.push("This is the first analysis, so growth deltas are provisional.");
  }

  if (input.readmeSignals.wordCount > 400 && input.readmeSignals.completenessScore >= 50) {
    points += 2;
    reasons.push("README structure and length are sufficient for documentation analysis.");
  } else if (input.readmeSignals.wordCount > 0) {
    points += 1;
    reasons.push("README exists, but documentation coverage is limited.");
  } else {
    reasons.push("README data is missing or empty.");
  }

  const lastPush = input.github.repository.pushedAt ?? input.github.repository.updatedAt;
  if (daysBetween(lastPush) <= 60) {
    points += 1;
    reasons.push("Repository activity is recent.");
  }

  if (dataCoverage.overall >= 75) {
    points += 1;
    reasons.push(`Data coverage is ${dataCoverage.overall}%.`);
  } else {
    reasons.push(`Data coverage is ${dataCoverage.overall}%, so confidence is limited.`);
  }

  const level: ConfidenceLevel = points >= 7 ? "High" : points >= 4 ? "Medium" : "Low";
  return { level, reasons };
}

function inferRedditStatus(posts: RedditPost[]): DataSourceStatus {
  return posts.length > 0 ? "available" : "not_configured";
}

function isScoreAvailable(status: DataSourceStatus): boolean {
  return status === "available" || status === "insufficient";
}

function redditCoverage(status: DataSourceStatus, postCount: number): number {
  if (status === "available") {
    return Math.max(40, normalize(postCount, SCORING_CONFIG.normalization.highRedditMentions));
  }

  if (status === "insufficient") {
    return 25;
  }

  return 0;
}

function redditExplanation(status: DataSourceStatus, postCount: number): string {
  if (status === "available") {
    return `${postCount} Reddit posts were collected and counted as a hype signal.`;
  }

  if (status === "insufficient") {
    return "Reddit search was available but returned little or no evidence, so it is counted as a low mention signal.";
  }

  return `Reddit data source is ${status}; this signal is excluded and the remaining Hype weights are normalized.`;
}

function redditCoverageNote(status: DataSourceStatus, postCount: number): string {
  if (status === "available") {
    return `${postCount} Reddit posts were collected.`;
  }

  if (status === "insufficient") {
    return "Reddit search was reachable but returned insufficient evidence.";
  }

  return `Reddit data source is ${status}.`;
}
