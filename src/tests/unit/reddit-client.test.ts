import { afterEach, describe, expect, it, vi } from "vitest";
import { searchReddit } from "@/lib/reddit/client";

const originalEnv = { ...process.env };

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

describe("searchReddit", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = originalEnv;
  });

  it("returns not_configured without calling fetch when credentials are missing", async () => {
    process.env = {
      ...originalEnv,
      REDDIT_CLIENT_ID: "",
      REDDIT_CLIENT_SECRET: "",
      REDDIT_USER_AGENT: ""
    };
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchReddit(["repo"]);

    expect(result.status).toBe("not_configured");
    expect(result.posts).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns rate_limited when Reddit search responds with 429", async () => {
    process.env = {
      ...originalEnv,
      REDDIT_CLIENT_ID: "client",
      REDDIT_CLIENT_SECRET: "secret",
      REDDIT_USER_AGENT: "ai-hype-radar-test"
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/v1/access_token")) {
          return jsonResponse({ access_token: "token" });
        }

        return jsonResponse({ message: "rate limited" }, 429);
      })
    );

    const result = await searchReddit(["repo"]);

    expect(result.status).toBe("rate_limited");
    expect(result.posts).toEqual([]);
    expect(result.disabledReason).toContain("rate limit");
  });

  it("returns available and maps posts when Reddit search succeeds", async () => {
    process.env = {
      ...originalEnv,
      REDDIT_CLIENT_ID: "client",
      REDDIT_CLIENT_SECRET: "secret",
      REDDIT_USER_AGENT: "ai-hype-radar-test"
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/v1/access_token")) {
          return jsonResponse({ access_token: "token" });
        }

        return jsonResponse({
          data: {
            children: [
              {
                data: {
                  id: "abc",
                  title: "Demo works",
                  selftext: "Successful install",
                  subreddit: "LocalLLaMA",
                  created_utc: 1_704_067_200,
                  score: 12,
                  num_comments: 3,
                  url: "https://www.reddit.com/r/LocalLLaMA/comments/abc",
                  permalink: "/r/LocalLLaMA/comments/abc/demo_works/"
                }
              }
            ]
          }
        });
      })
    );

    const result = await searchReddit(["repo"]);

    expect(result.status).toBe("available");
    expect(result.posts[0]).toMatchObject({
      id: "abc",
      subreddit: "LocalLLaMA",
      score: 12,
      comments: 3
    });
    expect(result.posts[0].permalink).toBe("https://www.reddit.com/r/LocalLLaMA/comments/abc/demo_works/");
  });

  it("returns insufficient when Reddit search succeeds but finds no posts", async () => {
    process.env = {
      ...originalEnv,
      REDDIT_CLIENT_ID: "client",
      REDDIT_CLIENT_SECRET: "secret",
      REDDIT_USER_AGENT: "ai-hype-radar-test"
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/v1/access_token")) {
          return jsonResponse({ access_token: "token" });
        }

        return jsonResponse({ data: { children: [] } });
      })
    );

    const result = await searchReddit(["repo"]);

    expect(result.status).toBe("insufficient");
    expect(result.posts).toEqual([]);
  });

  it("returns failed when Reddit authentication fails", async () => {
    process.env = {
      ...originalEnv,
      REDDIT_CLIENT_ID: "client",
      REDDIT_CLIENT_SECRET: "secret",
      REDDIT_USER_AGENT: "ai-hype-radar-test"
    };
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "invalid_client" }, 401)));

    const result = await searchReddit(["repo"]);

    expect(result.status).toBe("failed");
    expect(result.posts).toEqual([]);
  });
});
