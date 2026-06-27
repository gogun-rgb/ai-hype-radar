"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FlaskConical, Loader2, Search } from "lucide-react";
import type { AnalysisResult, ApiResponse } from "@/types/analysis";

const steps = ["저장소 정보 확인", "Issue 및 개발 활동 수집", "Reddit 반응 검색", "사용자 의견 분류", "점수 계산", "리포트 생성"];

export function AnalyzeForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    }, 950);
    return () => window.clearInterval(timer);
  }, [loading]);

  const canSubmit = useMemo(() => url.trim().length > 0 && !loading, [url, loading]);

  async function submitAnalysis(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setStepIndex(0);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const payload = (await response.json()) as ApiResponse<{ analysis: AnalysisResult; reused: boolean }>;

      if (!payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "분석 요청이 실패했습니다.");
      }

      setStepIndex(steps.length - 1);
      router.push(`/analysis/${payload.data.analysis.id}`);
      router.refresh();
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "분석 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-[#d9dee7] bg-white p-5 shadow-sm sm:p-6">
      <form onSubmit={submitAnalysis} className="space-y-4">
        <div>
          <label htmlFor="github-url" className="text-sm font-semibold text-[#344054]">
            GitHub 저장소 URL
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" size={18} />
              <input
                id="github-url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://github.com/vercel/ai"
                className="focus-ring h-12 w-full rounded-md border border-[#cbd5e1] bg-white pl-10 pr-3 text-base text-[#111827] shadow-sm"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#0f766e] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:bg-[#98a2b3]"
            >
              {loading ? <Loader2 aria-hidden="true" size={18} className="animate-spin" /> : <ArrowRight aria-hidden="true" size={18} />}
              분석 시작
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setUrl("https://github.com/vercel/ai")}
          className="focus-ring inline-flex items-center gap-2 rounded-md border border-[#d9dee7] bg-white px-3 py-2 text-sm font-semibold text-[#344054] shadow-sm transition hover:border-[#98a2b3]"
          disabled={loading}
        >
          <FlaskConical aria-hidden="true" size={16} />
          예시 저장소 입력
        </button>
      </form>

      {loading ? (
        <div className="mt-6 rounded-md border border-[#d9dee7] bg-[#f8fafc] p-4">
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    index <= stepIndex ? "bg-[#0f766e] text-white" : "bg-white text-[#667085] ring-1 ring-[#d9dee7]"
                  }`}
                >
                  {index + 1}
                </span>
                <span className={index <= stepIndex ? "font-semibold text-[#111827]" : "font-medium text-[#667085]"}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-md border border-[#fecdca] bg-[#fffbfa] p-4 text-sm font-medium text-[#b42318]" role="alert">
          {error}
        </div>
      ) : null}
    </section>
  );
}
