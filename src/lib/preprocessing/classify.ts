import { NEGATIVE_KEYWORDS, POSITIVE_KEYWORDS, RISK_KEYWORDS } from "@/config/scoring";
import type { ProblemCategory, Sentiment } from "@/types/analysis";

export function classifySentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  const positive = POSITIVE_KEYWORDS.filter((word) => lower.includes(word)).length;
  const negative = NEGATIVE_KEYWORDS.filter((word) => lower.includes(word)).length;

  if (positive > negative) {
    return "positive";
  }

  if (negative > positive) {
    return "negative";
  }

  return "neutral";
}

export function classifyCategory(text: string): ProblemCategory {
  const lower = text.toLowerCase();
  let best: ProblemCategory = "none";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(RISK_KEYWORDS) as Array<[ProblemCategory, readonly string[]]>) {
    const hits = keywords.filter((keyword) => lower.includes(keyword)).length;
    if (hits > bestScore) {
      best = category;
      bestScore = hits;
    }
  }

  return best;
}

export function isPromotional(text: string): boolean {
  const lower = text.toLowerCase();
  return ["launching", "check out my", "subscribe", "promo", "sponsored", "buy now"].some((word) =>
    lower.includes(word)
  );
}
