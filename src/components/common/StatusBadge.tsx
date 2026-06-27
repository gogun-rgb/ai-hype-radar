import type { ConfidenceLevel } from "@/types/analysis";

export function scoreLabel(value: number): string {
  if (value <= 29) return "낮음";
  if (value <= 59) return "보통";
  if (value <= 79) return "높음";
  return "매우 높음";
}

export function ScoreBadge({ value, risk = false }: { value: number; risk?: boolean }) {
  const label = scoreLabel(value);
  const color = risk
    ? value >= 60
      ? "border-[#fecdca] bg-[#fffbfa] text-[#b42318]"
      : "border-[#abefc6] bg-[#f6fef9] text-[#067647]"
    : value >= 60
      ? "border-[#abefc6] bg-[#f6fef9] text-[#067647]"
      : "border-[#fedf89] bg-[#fffcf5] text-[#b54708]";

  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${color}`}>{label}</span>;
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const color =
    level === "High"
      ? "border-[#abefc6] bg-[#f6fef9] text-[#067647]"
      : level === "Medium"
        ? "border-[#b2ddff] bg-[#eff8ff] text-[#175cd3]"
        : "border-[#fedf89] bg-[#fffcf5] text-[#b54708]";

  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${color}`}>{level}</span>;
}
