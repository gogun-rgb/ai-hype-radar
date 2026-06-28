import { Database, Info } from "lucide-react";
import type { DataCoverage, DataCoverageSource } from "@/types/analysis";

const FALLBACK_COVERAGE: DataCoverage = {
  overall: 0,
  scoreImpact: "limited",
  sources: [],
  missingCriticalSignals: ["Coverage metadata was not saved for this older analysis."]
};

export function DataCoveragePanel({ coverage }: { coverage?: DataCoverage }) {
  const data = coverage ?? FALLBACK_COVERAGE;

  return (
    <section className="rounded-lg border border-[#d9dee7] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database aria-hidden="true" size={18} className="text-[#0f766e]" />
          <h2 className="text-lg font-bold text-[#111827]">Data Coverage</h2>
        </div>
        <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${impactClass(data.scoreImpact)}`}>
          {data.overall}% · {data.scoreImpact}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef2f6]">
        <div className="h-full rounded-full bg-[#0f766e]" style={{ width: `${data.overall}%` }} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {data.sources.map((source) => (
          <CoverageSourceRow key={source.key} source={source} />
        ))}
      </div>

      {data.missingCriticalSignals.length > 0 ? (
        <div className="mt-5 rounded-md bg-[#fffcf5] p-3">
          <p className="flex gap-2 text-sm font-semibold text-[#b54708]">
            <Info aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
            Missing or limited signals are reflected in Confidence Level instead of being forced to zero.
          </p>
          <p className="mt-2 text-sm leading-6 text-[#667085]">{data.missingCriticalSignals.join(", ")}</p>
        </div>
      ) : null}
    </section>
  );
}

function CoverageSourceRow({ source }: { source: DataCoverageSource }) {
  return (
    <div className="rounded-md bg-[#f8fafc] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#344054]">{source.label}</p>
          <p className="mt-1 text-xs leading-5 text-[#667085]">{source.note}</p>
        </div>
        <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${statusClass(source.status)}`}>{source.status}</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#667085]">
        <span>
          {source.collected.toLocaleString()} / {source.expected.toLocaleString()}
        </span>
        <span>{source.coverage}%</span>
      </div>
    </div>
  );
}

function impactClass(impact: DataCoverage["scoreImpact"]): string {
  if (impact === "complete") {
    return "border-[#abefc6] bg-[#f6fef9] text-[#067647]";
  }

  if (impact === "partial") {
    return "border-[#b2ddff] bg-[#eff8ff] text-[#175cd3]";
  }

  return "border-[#fedf89] bg-[#fffcf5] text-[#b54708]";
}

function statusClass(status: DataCoverageSource["status"]): string {
  if (status === "available") {
    return "border-[#abefc6] bg-[#f6fef9] text-[#067647]";
  }

  if (status === "insufficient") {
    return "border-[#b2ddff] bg-[#eff8ff] text-[#175cd3]";
  }

  return "border-[#fedf89] bg-[#fffcf5] text-[#b54708]";
}
