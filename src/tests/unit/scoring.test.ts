import { describe, expect, it } from "vitest";
import { calculateHypeScore, calculateRealityScore, calculateRiskScore, calculateScores } from "@/lib/scoring/calculate";
import { clampScore } from "@/lib/scoring/utils";
import type { AnalysisSource, GitHubData, ReadmeSignals } from "@/types/analysis";

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

function githubFixture(): GitHubData {
  return {
    repository: {
      owner: "owner",
      repo: "repo",
      fullName: "owner/repo",
      name: "repo",
      description: "test",
      htmlUrl: "https://github.com/owner/repo",
      stars: 1200,
      forks: 150,
      watchers: 1200,
      openIssues: 10,
      language: "TypeScript",
      license: "MIT",
      createdAt: daysAgo(300),
      updatedAt: daysAgo(2),
      pushedAt: daysAgo(1),
      topics: ["ai"],
      contributors: 12,
      latestRelease: null,
      latestCommit: {
        sha: "abc",
        message: "fix",
        committedAt: daysAgo(1),
        htmlUrl: "https://github.com/owner/repo/commit/abc",
        authorName: "dev"
      }
    },
    issues: [
      {
        id: 1,
        number: 1,
        title: "Windows install error",
        body: "install failed on windows",
        htmlUrl: "https://github.com/owner/repo/issues/1",
        state: "open",
        createdAt: daysAgo(3),
        closedAt: null,
        updatedAt: daysAgo(1),
        comments: 2,
        reactions: 1,
        authorAssociation: null,
        isPullRequest: false,
        isBot: false
      }
    ],
    closedIssues: [
      {
        id: 2,
        number: 2,
        title: "docs",
        body: "missing docs",
        htmlUrl: "https://github.com/owner/repo/issues/2",
        state: "closed",
        createdAt: daysAgo(10),
        closedAt: daysAgo(4),
        updatedAt: daysAgo(4),
        comments: 2,
        reactions: 1,
        authorAssociation: null,
        isPullRequest: false,
        isBot: false
      }
    ],
    commits: Array.from({ length: 12 }, (_, index) => ({
      sha: `sha${index}`,
      message: "commit",
      committedAt: daysAgo(index + 1),
      htmlUrl: `https://github.com/owner/repo/commit/${index}`,
      authorName: "dev"
    })),
    releases: [],
    readme: "Installation Usage Requirements License Examples Troubleshooting OpenAI API key demo"
  };
}

const readmeSignals: ReadmeSignals = {
  completenessScore: 100,
  sections: {
    installation: true,
    usage: true,
    requirements: true,
    license: true,
    examples: true,
    troubleshooting: true
  },
  claims: ["Easy automated AI workflow with API key"],
  hasDemoSignals: true,
  wordCount: 200
};

const sources: AnalysisSource[] = [
  {
    id: "github-issue-1",
    sourceType: "github_issue",
    title: "Windows install error",
    summary: "Install failed on Windows",
    url: "https://github.com/owner/repo/issues/1",
    sentiment: "negative",
    category: "installation",
    publishedAt: daysAgo(3)
  }
];

describe("scoring", () => {
  it("clamps scores to 0-100", () => {
    expect(clampScore(-10)).toBe(0);
    expect(clampScore(101)).toBe(100);
    expect(clampScore(Number.NaN)).toBe(0);
  });

  it("calculates hype, reality, and risk scores", () => {
    const input = { github: githubFixture(), redditPosts: [], sources, readmeSignals, previousSnapshot: null };
    expect(calculateHypeScore(input).value).toBeGreaterThanOrEqual(0);
    expect(calculateRealityScore(input).value).toBeGreaterThan(50);
    expect(calculateRiskScore(input).value).toBeGreaterThan(0);
  });

  it("lowers confidence when data is sparse", () => {
    const result = calculateScores({ github: githubFixture(), redditPosts: [], sources, readmeSignals, previousSnapshot: null });
    expect(["Low", "Medium", "High"]).toContain(result.confidence);
    expect(result.confidenceReasons.join(" ")).toContain("Reddit");
  });
});
