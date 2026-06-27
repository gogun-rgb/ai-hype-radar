import type { GitHubData, ParsedGitHubUrl } from "@/types/analysis";

export function createDemoGitHubData(parsed: ParsedGitHubUrl): GitHubData {
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
  const htmlBase = parsed.canonicalUrl;

  return {
    repository: {
      owner: parsed.owner,
      repo: parsed.repo,
      fullName: `${parsed.owner}/${parsed.repo}`,
      name: parsed.repo,
      description: "DEMO MODE: 실제 GitHub API 실패 시 화면 확인을 위해 생성된 예시 저장소입니다.",
      htmlUrl: htmlBase,
      stars: 18420,
      forks: 1420,
      watchers: 18420,
      openIssues: 118,
      language: "TypeScript",
      license: "MIT",
      createdAt: daysAgo(520),
      updatedAt: daysAgo(2),
      pushedAt: daysAgo(1),
      topics: ["ai", "agents", "demo"],
      contributors: 82,
      latestRelease: {
        name: "v0.9.0 demo",
        tagName: "v0.9.0",
        publishedAt: daysAgo(15),
        htmlUrl: `${htmlBase}/releases/tag/v0.9.0`
      },
      latestCommit: {
        sha: "demo1234",
        message: "Improve installer diagnostics",
        committedAt: daysAgo(1),
        htmlUrl: `${htmlBase}/commit/demo1234`,
        authorName: "demo-maintainer"
      }
    },
    issues: [
      {
        id: 1,
        number: 101,
        title: "Windows install fails when path contains spaces",
        body: "DEMO: pip install fails on Windows when the project path contains spaces.",
        htmlUrl: `${htmlBase}/issues/101`,
        state: "open",
        createdAt: daysAgo(8),
        closedAt: null,
        updatedAt: daysAgo(2),
        comments: 12,
        reactions: 5,
        authorAssociation: "NONE",
        isPullRequest: false,
        isBot: false
      },
      {
        id: 2,
        number: 98,
        title: "Token usage is higher than expected",
        body: "DEMO: API cost can spike when long documents are processed.",
        htmlUrl: `${htmlBase}/issues/98`,
        state: "open",
        createdAt: daysAgo(12),
        closedAt: null,
        updatedAt: daysAgo(3),
        comments: 7,
        reactions: 2,
        authorAssociation: "CONTRIBUTOR",
        isPullRequest: false,
        isBot: false
      },
      {
        id: 3,
        number: 91,
        title: "Demo workflow works well on macOS",
        body: "DEMO: The quickstart worked for the default example.",
        htmlUrl: `${htmlBase}/issues/91`,
        state: "closed",
        createdAt: daysAgo(25),
        closedAt: daysAgo(23),
        updatedAt: daysAgo(23),
        comments: 3,
        reactions: 4,
        authorAssociation: "NONE",
        isPullRequest: false,
        isBot: false
      }
    ],
    closedIssues: [
      {
        id: 4,
        number: 76,
        title: "Document missing environment variables",
        body: "DEMO: README did not explain required API keys.",
        htmlUrl: `${htmlBase}/issues/76`,
        state: "closed",
        createdAt: daysAgo(41),
        closedAt: daysAgo(33),
        updatedAt: daysAgo(33),
        comments: 6,
        reactions: 1,
        authorAssociation: "NONE",
        isPullRequest: false,
        isBot: false
      }
    ],
    commits: Array.from({ length: 18 }, (_, index) => ({
      sha: `demo${index}`,
      message: index % 3 === 0 ? "Fix install path handling" : "Update analysis pipeline",
      committedAt: daysAgo(index + 1),
      htmlUrl: `${htmlBase}/commit/demo${index}`,
      authorName: "demo-maintainer"
    })),
    releases: [
      {
        name: "v0.9.0 demo",
        tagName: "v0.9.0",
        publishedAt: daysAgo(15),
        htmlUrl: `${htmlBase}/releases/tag/v0.9.0`
      }
    ],
    readme: `# ${parsed.repo}

DEMO MODE README. This content is generated because live GitHub data was unavailable.

## Installation
Install with npm and configure an API key.

## Usage
Run the agent workflow against local files.

## Requirements
Node.js, an OpenAI API key, and internet access.

## Examples
The demo includes screenshots and example output.

## Troubleshooting
Windows users may need to check path spacing and build tools.

## License
MIT`
  };
}
