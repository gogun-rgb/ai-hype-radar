import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runAnalysis } from "@/lib/analysis/run-analysis";

const originalEnv = { ...process.env };

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

describe("runAnalysis integration", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DEMO_MODE: "false",
      OPENAI_API_KEY: "",
      REDDIT_CLIENT_ID: "",
      REDDIT_CLIENT_SECRET: "",
      REDDIT_USER_AGENT: "",
      DEMO_DATA_DIR: path.join(tmpdir(), `ai-hype-radar-test-${Date.now()}`)
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url === "https://api.github.com/repos/acme/demo") {
          return jsonResponse({
            name: "demo",
            full_name: "acme/demo",
            description: "Mock AI project",
            html_url: "https://github.com/acme/demo",
            stargazers_count: 500,
            forks_count: 40,
            watchers_count: 500,
            open_issues_count: 3,
            language: "TypeScript",
            license: { spdx_id: "MIT" },
            created_at: "2024-01-01T00:00:00Z",
            updated_at: new Date().toISOString(),
            pushed_at: new Date().toISOString(),
            topics: ["ai"],
            owner: { login: "acme" }
          });
        }

        if (url.includes("/issues?state=all")) {
          return jsonResponse([
            {
              id: 1,
              number: 7,
              title: "Install failed on Windows",
              body: "install error on windows",
              html_url: "https://github.com/acme/demo/issues/7",
              state: "open",
              created_at: new Date().toISOString(),
              closed_at: null,
              updated_at: new Date().toISOString(),
              comments: 4,
              reactions: { total_count: 1 },
              author_association: "NONE",
              user: { login: "user", type: "User" }
            },
            {
              id: 2,
              number: 8,
              title: "PR",
              body: "",
              html_url: "https://github.com/acme/demo/pull/8",
              state: "open",
              created_at: new Date().toISOString(),
              closed_at: null,
              updated_at: new Date().toISOString(),
              comments: 0,
              pull_request: {},
              user: { login: "user", type: "User" }
            }
          ]);
        }

        if (url.includes("/issues?state=closed")) {
          return jsonResponse([
            {
              id: 3,
              number: 3,
              title: "Docs fixed",
              body: "docs",
              html_url: "https://github.com/acme/demo/issues/3",
              state: "closed",
              created_at: "2024-01-03T00:00:00Z",
              closed_at: "2024-01-05T00:00:00Z",
              updated_at: "2024-01-05T00:00:00Z",
              comments: 1,
              reactions: { total_count: 0 },
              user: { login: "user", type: "User" }
            }
          ]);
        }

        if (url.includes("/commits")) {
          return jsonResponse([
            {
              sha: "abc",
              html_url: "https://github.com/acme/demo/commit/abc",
              commit: { message: "fix", author: { name: "Dev", date: new Date().toISOString() } }
            }
          ]);
        }

        if (url.includes("/releases")) {
          return jsonResponse([]);
        }

        if (url.includes("/readme")) {
          return new Response("## Installation\n## Usage\n## Requirements\n## License\n## Examples\n## Troubleshooting\nOpenAI API key demo", {
            status: 200
          });
        }

        if (url.includes("/contributors")) {
          return jsonResponse([{ login: "dev" }]);
        }

        return jsonResponse({}, 404);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = originalEnv;
  });

  it("analyzes with mocked GitHub and no Reddit/OpenAI/Supabase", async () => {
    const result = await runAnalysis("https://github.com/acme/demo");
    expect(result.repository.fullName).toBe("acme/demo");
    expect(result.collectedCounts.issues).toBe(1);
    expect(result.collectedCounts.redditPosts).toBe(0);
    expect(result.scores.hype.value).toBeGreaterThanOrEqual(0);
    expect(result.scores.dataCoverage.overall).toBeGreaterThanOrEqual(0);
    expect(result.scores.dataCoverage.sources.find((source) => source.key === "reddit")?.status).toBe("not_configured");
    expect(result.scores.hype.breakdown.find((item) => item.label === "Reddit 언급량")?.available).toBe(false);
    expect(result.qualitative.aiGenerated).toBe(false);
    expect(result.canvaPrompt).toContain("총 6장");
  });
});
