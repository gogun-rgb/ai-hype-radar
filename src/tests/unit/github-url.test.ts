import { describe, expect, it } from "vitest";
import { isLikelyGitHubUrl, parseGitHubUrl } from "@/lib/validation/github-url";

describe("parseGitHubUrl", () => {
  it("parses common GitHub repository URL forms", () => {
    expect(parseGitHubUrl("https://github.com/openai/openai-cookbook")).toEqual({
      owner: "openai",
      repo: "openai-cookbook",
      canonicalUrl: "https://github.com/openai/openai-cookbook"
    });

    expect(parseGitHubUrl("github.com/vercel/ai/")).toEqual({
      owner: "vercel",
      repo: "ai",
      canonicalUrl: "https://github.com/vercel/ai"
    });

    expect(parseGitHubUrl("https://github.com/acme/demo.git")).toEqual({
      owner: "acme",
      repo: "demo",
      canonicalUrl: "https://github.com/acme/demo"
    });
  });

  it("rejects non-GitHub and nested URLs", () => {
    expect(() => parseGitHubUrl("https://example.com/openai/openai-cookbook")).toThrow("github.com");
    expect(() => parseGitHubUrl("https://github.com/openai/openai-cookbook/issues")).toThrow("owner/repo");
  });

  it("rejects empty, malformed, and unsupported repository names", () => {
    expect(() => parseGitHubUrl("")).toThrow("GitHub");
    expect(() => parseGitHubUrl("https://github.com/openai")).toThrow("owner/repo");
    expect(() => parseGitHubUrl("https://github.com/openai/repo name")).toThrow("허용");
    expect(isLikelyGitHubUrl("https://github.com/openai/openai-cookbook")).toBe(true);
    expect(isLikelyGitHubUrl("https://example.com/openai/openai-cookbook")).toBe(false);
  });
});
