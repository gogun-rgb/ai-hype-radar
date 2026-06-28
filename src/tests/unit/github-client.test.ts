import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGitHubData } from "@/lib/github/client";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

describe("fetchGitHubData", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws a typed error when GitHub returns a malformed repository response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url === "https://api.github.com/repos/acme/demo") {
          return jsonResponse({ name: "demo" });
        }

        if (url.includes("/readme")) {
          return new Response("# Demo", { status: 200 });
        }

        return jsonResponse([]);
      })
    );

    await expect(
      fetchGitHubData({
        owner: "acme",
        repo: "demo",
        canonicalUrl: "https://github.com/acme/demo"
      })
    ).rejects.toMatchObject({
      code: "GITHUB_MALFORMED_RESPONSE",
      status: 502
    });
  });
});
