import { z } from "zod";

export const qualitativePointSchema = z.object({
  summary: z.string().min(1),
  sourceIds: z.array(z.string()).default([])
});

export const recurringProblemSchema = z.object({
  category: z.enum([
    "installation",
    "windows",
    "macos",
    "linux",
    "dependency",
    "security",
    "privacy",
    "api_cost",
    "rate_limit",
    "vendor_lock_in",
    "performance",
    "crash",
    "documentation",
    "maintenance",
    "none"
  ]),
  summary: z.string().min(1),
  frequency: z.number().int().nonnegative(),
  sourceIds: z.array(z.string()).default([])
});

export const officialClaimSchema = z.object({
  claim: z.string().min(1),
  sourceIds: z.array(z.string()).default([])
});

export const claimRealityGapSchema = z.object({
  claim: z.string().min(1),
  userExperience: z.string().min(1),
  gapLevel: z.enum(["low", "medium", "high"]),
  sourceIds: z.array(z.string()).default([])
});

export const qualitativeSummarySchema = z.object({
  positivePoints: z.array(qualitativePointSchema).default([]),
  negativePoints: z.array(qualitativePointSchema).default([]),
  recurringProblems: z.array(recurringProblemSchema).default([]),
  officialClaims: z.array(officialClaimSchema).default([]),
  claimRealityGaps: z.array(claimRealityGapSchema).default([]),
  hypeReason: z.string().default("수집된 GitHub 활동과 Reddit 언급량을 기준으로 화제성을 계산했습니다."),
  oneLineVerdict: z.string().default("데이터가 부족해 정량 점수를 중심으로 판단해야 합니다.")
});

export const qualitativeJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "positivePoints",
    "negativePoints",
    "recurringProblems",
    "officialClaims",
    "claimRealityGaps",
    "hypeReason",
    "oneLineVerdict"
  ],
  properties: {
    positivePoints: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["summary", "sourceIds"],
        properties: {
          summary: { type: "string" },
          sourceIds: { type: "array", items: { type: "string" } }
        }
      }
    },
    negativePoints: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["summary", "sourceIds"],
        properties: {
          summary: { type: "string" },
          sourceIds: { type: "array", items: { type: "string" } }
        }
      }
    },
    recurringProblems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "summary", "frequency", "sourceIds"],
        properties: {
          category: {
            type: "string",
            enum: [
              "installation",
              "windows",
              "macos",
              "linux",
              "dependency",
              "security",
              "privacy",
              "api_cost",
              "rate_limit",
              "vendor_lock_in",
              "performance",
              "crash",
              "documentation",
              "maintenance",
              "none"
            ]
          },
          summary: { type: "string" },
          frequency: { type: "integer", minimum: 0 },
          sourceIds: { type: "array", items: { type: "string" } }
        }
      }
    },
    officialClaims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claim", "sourceIds"],
        properties: {
          claim: { type: "string" },
          sourceIds: { type: "array", items: { type: "string" } }
        }
      }
    },
    claimRealityGaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claim", "userExperience", "gapLevel", "sourceIds"],
        properties: {
          claim: { type: "string" },
          userExperience: { type: "string" },
          gapLevel: { type: "string", enum: ["low", "medium", "high"] },
          sourceIds: { type: "array", items: { type: "string" } }
        }
      }
    },
    hypeReason: { type: "string" },
    oneLineVerdict: { type: "string" }
  }
} as const;
