"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ExternalLink } from "lucide-react";
import type { AnalysisResult, ApiResponse } from "@/types/analysis";

export function RecentAnalyses() {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/analyses")
      .then((response) => response.json() as Promise<ApiResponse<{ analyses: AnalysisResult[] }>>)
      .then((payload) => {
        if (mounted && payload.success && payload.data) {
          setAnalyses(payload.data.analyses);
        }
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!loaded) {
    return (
      <section className="rounded-lg border border-[#d9dee7] bg-white p-5 shadow-sm">
        <div className="h-5 w-40 rounded bg-[#eef2f6]" />
        <div className="mt-4 grid gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-16 rounded-md bg-[#f1f5f9]" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[#d9dee7] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Clock aria-hidden="true" size={18} className="text-[#0f766e]" />
        <h2 className="text-lg font-bold text-[#111827]">최근 분석</h2>
      </div>
      {analyses.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-[#cbd5e1] p-4 text-sm leading-6 text-[#667085]">
          아직 저장된 분석이 없습니다. 첫 저장소를 분석하면 이곳에 표시됩니다.
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {analyses.map((analysis) => (
            <Link
              key={analysis.id}
              href={`/analysis/${analysis.id}`}
              className="focus-ring flex items-center justify-between gap-4 rounded-md border border-[#d9dee7] p-3 transition hover:border-[#98a2b3] hover:bg-[#f8fafc]"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#111827]">{analysis.repository.fullName}</span>
                <span className="mt-1 block text-xs font-medium text-[#667085]">
                  H {analysis.scores.hype.value} · R {analysis.scores.reality.value} · Risk {analysis.scores.risk.value}
                </span>
              </span>
              <ExternalLink aria-hidden="true" size={16} className="shrink-0 text-[#98a2b3]" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
