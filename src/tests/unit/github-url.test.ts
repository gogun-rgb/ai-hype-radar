import { describe, expect, it } from "vitest";
import { parseGitHubUrl } from "@/lib/validation/github-url";

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
  });

  it("rejects non-GitHub and nested URLs", () => {
    expect(() => parseGitHubUrl("https://example.com/openai/openai-cookbook")).toThrow("github.com");
    expect(() => parseGitHubUrl("https://github.com/openai/openai-cookbook/issues")).toThrow("owner/repo");
  });
});
