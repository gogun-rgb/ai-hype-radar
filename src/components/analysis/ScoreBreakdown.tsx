import type { ScoreResult } from "@/types/analysis";

export function ScoreBreakdown({ title, score }: { title: string; score: ScoreResult }) {
  return (
    <section className="rounded-lg border border-[#d9dee7] bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-[#111827]">{title} 계산 근거</h3>
      <div className="mt-4 space-y-4">
        {score.breakdown.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#344054]">{item.label}</p>
              <p className="text-sm font-bold text-[#111827]">{item.value}</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef2f6]">
              <div className="h-full rounded-full bg-[#0f766e]" style={{ width: `${item.value}%` }} />
            </div>
            <p className="mt-2 text-xs leading-5 text-[#667085]">
              가중치 {Math.round(item.weight * 100)}% · {item.explanation}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
