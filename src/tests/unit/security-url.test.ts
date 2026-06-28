import { describe, expect, it } from "vitest";
import { toSafeExternalUrl } from "@/lib/security/url";

describe("toSafeExternalUrl", () => {
  it("allows only http and https URLs", () => {
    expect(toSafeExternalUrl("https://github.com/gogun-rgb/ai-hype-radar")).toBe("https://github.com/gogun-rgb/ai-hype-radar");
    expect(toSafeExternalUrl("http://www.reddit.com/r/test")).toBe("http://www.reddit.com/r/test");
    expect(toSafeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(toSafeExternalUrl("not a url")).toBeNull();
  });
});
