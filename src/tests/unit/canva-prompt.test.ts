import { describe, expect, it } from "vitest";
import { canvaFilename, generateCanvaPrompt } from "@/lib/canva/prompt";
import type { AnalysisResult, GitHubRepository, QualitativeSummary, Scores } from "@/types/analysis";

describe("Canva prompt generation", () => {
  it("includes repository identity, score context, and evidence count", () => {
    const prompt = generateCanvaPrompt({
      repository,
      scores,
      qualitative,
      basisPeriod: "최근 GitHub Issue 최대 30개",
      sourcesCount: 4
    });

    expect(prompt).toContain("acme/demo");
    expect(prompt).toContain("Hype Score: 64/100");
    expect(prompt).toContain("Risk Score: 30/100");
    expect(prompt).toContain("4개");
  });

  it("creates filesystem-safe prompt filenames", () => {
    const filename = canvaFilename({
      repository,
      id: "analysis-1"
    } as AnalysisResult);

    expect(filename).toBe("ai-hype-radar-acme-demo-canva-prompt.txt");
  });
});

const repository: GitHubRepository = {
  owner: "acme",
  repo: "demo",
  fullName: "acme/demo",
  name: "demo",
  description: "A demo AI project",
  htmlUrl: "https://github.com/acme/demo",
  stars: 1000,
  forks: 80,
  watchers: 1000,
  openIssues: 3,
  language: "TypeScript",
  license: "MIT",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-02-01T00:00:00.000Z",
  pushedAt: "2024-02-02T00:00:00.000Z",
  topics: ["ai"],
  contributors: 5,
  latestRelease: null,
  latestCommit: null
};

const scores: Scores = {
  hype: score(64),
  reality: score(72),
  risk: score(30),
  confidence: "High",
  confidenceReasons: ["coverage"],
  dataCoverage: {
    overall: 82,
    scoreImpact: "complete",
    sources: [],
    missingCriticalSignals: []
  }
};

const qualitative: QualitativeSummary = {
  positivePoints: [{ summary: "Users report successful installs.", sourceIds: ["github-issue-1"] }],
  negativePoints: [{ summary: "Some users hit rate limits.", sourceIds: ["github-issue-2"] }],
  recurringProblems: [],
  officialClaims: [],
  claimRealityGaps: [],
  hypeReason: "Recent activity is visible.",
  oneLineVerdict: "Useful but still needs validation.",
  aiGenerated: false
};

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
