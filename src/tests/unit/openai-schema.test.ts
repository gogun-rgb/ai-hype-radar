import { describe, expect, it } from "vitest";
import { qualitativeSummarySchema } from "@/lib/openai/schema";

describe("qualitativeSummarySchema", () => {
  it("validates strict qualitative output shape", () => {
    const parsed = qualitativeSummarySchema.parse({
      positivePoints: [{ summary: "기본 기능이 동작합니다.", sourceIds: ["github-issue-1"] }],
      negativePoints: [],
      recurringProblems: [],
      officialClaims: [],
      claimRealityGaps: [],
      hypeReason: "최근 활동이 많습니다.",
      oneLineVerdict: "관심은 있지만 데이터 확인이 필요합니다."
    });

    expect(parsed.oneLineVerdict).toContain("관심");
  });
});
