import { SCORING_CONFIG } from "@/config/scoring";
import { classifyCategory, classifySentiment } from "@/lib/preprocessing/classify";
import { clampScore, daysBetween, median, normalize } from "@/lib/scoring/utils";
import type {
  AnalysisSource,
  ConfidenceLevel,
  GitHubData,
  ReadmeSignals,
  RedditPost,
  RepositorySnapshot,
  ScoreBreakdownItem,
  ScoreResult,
  Scores
} from "@/types/analysis";

export interface ScoreInput {
  github: GitHubData;
  redditPosts: RedditPost[];
  sources: AnalysisSource[];
  readmeSignals: ReadmeSignals;
  previousSnapshot?: RepositorySnapshot | null;
}

export function calculateScores(input: ScoreInput): Scores {
  const hype = calculateHypeScore(input);
  const reality = calculateRealityScore(input);
  const risk = calculateRiskScore(input);
  const confidence = calculateConfidence(input);

  return {
    hype,
    reality,
    risk,
    confidence: confidence.level,
    confidenceReasons: confidence.reasons
  };
}

export function calculateHypeScore(input: ScoreInput): ScoreResult {
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
  const activity = clampScore(
    normalize(recentIssues, SCORING_CONFIG.normalization.highRecentIssueCount) * 0.45 +
      normalize(recentCommits, SCORING_CONFIG.normalization.highRecentCommitCount) * 0.55
  );

  const breakdown: ScoreBreakdownItem[] = [
    {
      label: provisional ? "저장소 연령 대비 스타 모멘텀" : "이전 Snapshot 대비 스타 증가",
      value: starMomentum,
      weight: SCORING_CONFIG.hype.starMomentumWeight,
      explanation: provisional
        ? "최초 분석이라 과거 스타 수 대신 생성일 대비 현재 스타 수를 제한적으로 사용했습니다."
        : "이전 분석 Snapshot과 현재 스타 수를 비교했습니다."
    },
    {
      label: "Reddit 언급량",
      value: redditMentions,
      weight: SCORING_CONFIG.hype.redditMentionsWeight,
      explanation:
        redditPosts.length > 0
          ? `${redditPosts.length}개의 Reddit 게시물을 반영했습니다.`
          : "Reddit 데이터가 없거나 연결되지 않아 0점으로 계산했습니다."
    },
    {
      label: provisional ? "포크 비율" : "이전 Snapshot 대비 포크 증가",
      value: forkMomentum,
      weight: SCORING_CONFIG.hype.forkMomentumWeight,
      explanation: provisional ? "현재 스타 대비 포크 비율을 사용했습니다." : "이전 Snapshot과 현재 포크 수를 비교했습니다."
    },
    {
      label: "최근 Issue·Commit 활동",
      value: activity,
      weight: SCORING_CONFIG.hype.activityWeight,
      explanation: `최근 30일 Issue ${recentIssues}개, Commit ${recentCommits}개를 반영했습니다.`
    }
  ];

  return weightedResult(breakdown, provisional);
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
  const realOutputSignals = readmeSignals.hasDemoSignals || sources.some((source) => /\b(demo|example|showcase|works)\b/i.test(source.summary))
    ? 80
    : 35;

  const breakdown: ScoreBreakdownItem[] = [
    {
      label: "최근 커밋 활동",
      value: commitActivity,
      weight: SCORING_CONFIG.reality.commitActivityWeight,
      explanation: `최근 30일 Commit ${recentCommitCount}개와 마지막 Commit 시점을 반영했습니다.`
    },
    {
      label: "설치 성공 후기",
      value: installSuccess,
      weight: SCORING_CONFIG.reality.installSuccessWeight,
      explanation:
        installRelated.length > 0
          ? `설치 관련 근거 ${installRelated.length}개 중 긍정 반응 ${positiveInstall}개를 반영했습니다.`
          : "설치 후기가 부족해 보수적인 기본값을 적용했습니다."
    },
    {
      label: "Issue 해결 속도",
      value: issueResolution,
      weight: SCORING_CONFIG.reality.issueResolutionWeight,
      explanation:
        resolutionDays.length > 0
          ? `닫힌 Issue의 해결 기간 중앙값은 ${Math.round(medianResolution)}일입니다.`
          : "닫힌 Issue 데이터가 부족해 보수적인 기본값을 적용했습니다."
    },
    {
      label: "문서 완성도",
      value: documentation,
      weight: SCORING_CONFIG.reality.documentationWeight,
      explanation: "README의 설치, 사용법, 요구사항, 라이선스, 예제, 문제 해결 섹션을 확인했습니다."
    },
    {
      label: "실제 결과물 사례",
      value: realOutputSignals,
      weight: SCORING_CONFIG.reality.realOutputWeight,
      explanation: readmeSignals.hasDemoSignals ? "README에서 demo/example/showcase 신호를 찾았습니다." : "결과물 사례 신호가 제한적입니다."
    }
  ];

  return weightedResult(breakdown, false);
}

export function calculateRiskScore(input: ScoreInput): ScoreResult {
  const { github, sources, readmeSignals } = input;
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
    /\b(openai|anthropic|gemini|api key|cloud|hosted|token)\b/i.test(github.readme) || readmeSignals.claims.some((claim) => /api|cloud|token/i.test(claim))
      ? 65
      : 20;

  const breakdown: ScoreBreakdownItem[] = [
    {
      label: "미해결 버그",
      value: unresolvedBugs,
      weight: SCORING_CONFIG.risk.unresolvedBugsWeight,
      explanation: `열린 Issue 중 위험 키워드가 있는 항목 ${openBugLikeIssues}개를 반영했습니다.`
    },
    {
      label: "보안·개인정보 Issue",
      value: security,
      weight: SCORING_CONFIG.risk.securityWeight,
      explanation: "security/privacy 키워드가 있는 근거를 계산했습니다."
    },
    {
      label: "비용 불확실성",
      value: cost,
      weight: SCORING_CONFIG.risk.costWeight,
      explanation: "API 비용, quota, rate limit 관련 신호를 반영했습니다."
    },
    {
      label: "설치 복잡도",
      value: installComplexity,
      weight: SCORING_CONFIG.risk.installComplexityWeight,
      explanation: "설치, 의존성, OS별 오류 신호를 반영했습니다."
    },
    {
      label: "특정 API 종속성",
      value: apiDependency,
      weight: SCORING_CONFIG.risk.apiDependencyWeight,
      explanation: "README와 공식 주장에 외부 API key 또는 클라우드 종속 신호가 있는지 확인했습니다."
    }
  ];

  return weightedResult(breakdown, false);
}

function weightedResult(breakdown: ScoreBreakdownItem[], provisional: boolean): ScoreResult {
  const value = breakdown.reduce((sum, item) => sum + item.value * item.weight, 0);
  return {
    value: clampScore(value),
    provisional,
    breakdown
  };
}

function calculateConfidence(input: ScoreInput): { level: ConfidenceLevel; reasons: string[] } {
  const reasons: string[] = [];
  let points = 0;

  if (input.github.issues.length >= 20) {
    points += 2;
    reasons.push("Issue 데이터가 충분합니다.");
  } else if (input.github.issues.length >= 5) {
    points += 1;
    reasons.push("Issue 데이터가 일부 수집되었습니다.");
  } else {
    reasons.push("Issue 데이터가 적어 신뢰도가 낮아질 수 있습니다.");
  }

  if (input.redditPosts.length >= 5) {
    points += 2;
    reasons.push("Reddit 게시물이 여러 개 수집되었습니다.");
  } else if (input.redditPosts.length > 0) {
    points += 1;
    reasons.push("Reddit 게시물이 일부 수집되었습니다.");
  } else {
    reasons.push("Reddit 데이터가 없거나 연결되지 않았습니다.");
  }

  if (input.previousSnapshot) {
    points += 1;
    reasons.push("이전 Snapshot과 비교할 수 있습니다.");
  } else {
    reasons.push("최초 분석이라 증가량 데이터가 부족합니다.");
  }

  if (input.readmeSignals.wordCount > 400 && input.readmeSignals.completenessScore >= 50) {
    points += 2;
    reasons.push("README 구조와 길이가 분석에 충분합니다.");
  } else {
    reasons.push("README 정보가 짧거나 주요 섹션이 부족합니다.");
  }

  const lastPush = input.github.repository.pushedAt ?? input.github.repository.updatedAt;
  if (daysBetween(lastPush) <= 60) {
    points += 1;
    reasons.push("저장소 활동이 비교적 최신입니다.");
  }

  const level: ConfidenceLevel = points >= 6 ? "High" : points >= 3 ? "Medium" : "Low";
  return { level, reasons };
}
