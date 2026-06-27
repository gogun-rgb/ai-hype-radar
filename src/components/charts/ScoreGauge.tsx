import { ScoreBadge } from "@/components/common/StatusBadge";

interface ScoreGaugeProps {
  label: string;
  value: number;
  helper: string;
  risk?: boolean;
  provisional?: boolean;
}

export function ScoreGauge({ label, value, helper, risk = false, provisional = false }: ScoreGaugeProps) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const color = risk ? (value >= 60 ? "#b42318" : "#0f766e") : value >= 60 ? "#0f766e" : "#b45309";

  return (
    <article className="rounded-lg border border-[#d9dee7] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#667085]">{label}</h3>
          <p className="mt-2 text-sm leading-6 text-[#667085]">{helper}</p>
        </div>
        <ScoreBadge value={value} risk={risk} />
      </div>
      <div className="mt-5 flex items-center gap-5">
        <svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label={`${label} ${value}점`}>
          <circle cx="66" cy="66" r={radius} fill="none" stroke="#eef2f6" strokeWidth="12" />
          <circle
            cx="66"
            cy="66"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 66 66)"
          />
          <text x="66" y="61" textAnchor="middle" className="fill-[#111827] text-3xl font-bold">
            {value}
          </text>
          <text x="66" y="83" textAnchor="middle" className="fill-[#667085] text-xs font-semibold">
            / 100
          </text>
        </svg>
        <div className="min-w-0">
          <p className="text-3xl font-bold text-[#111827]">{value}</p>
          <p className="mt-2 text-sm font-medium text-[#667085]">
            {provisional ? "최초 분석 임시 점수" : "정량 계산 점수"}
          </p>
        </div>
      </div>
    </article>
  );
}
