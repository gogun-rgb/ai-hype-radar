import { describe, expect, it } from "vitest";
import { dedupeByContent } from "@/lib/preprocessing/dedupe";
import { analyzeReadme } from "@/lib/preprocessing/readme";
import { compactText, maskSecrets } from "@/lib/preprocessing/sanitize";

describe("preprocessing", () => {
  it("masks API-like secrets", () => {
    const masked = maskSecrets("OPENAI sk-abcdefghijklmnopqrstuvwxyz1234567890");
    expect(masked).toContain("[MASKED_SECRET]");
  });

  it("compacts long code blocks", () => {
    const text = compactText("```ts\nconst a = 1;\nconst b = 2;\n```", 200);
    expect(text).toContain("긴 코드 블록 생략");
  });

  it("deduplicates repeated posts", () => {
    const deduped = dedupeByContent([
      { id: "1", title: "Install failed", body: "same body" },
      { id: "2", title: "Install failed", body: "same body" }
    ]);
    expect(deduped).toHaveLength(1);
  });

  it("evaluates README completeness", () => {
    const signals = analyzeReadme("## Installation\n## Usage\n## Requirements\n## License\n## Examples\n## Troubleshooting");
    expect(signals.completenessScore).toBe(100);
  });
});
