import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { ConfidenceBadge } from "@/components/common/StatusBadge";
import { CanvaPromptPanel } from "@/components/analysis/CanvaPromptPanel";
import { RepositoryOverview } from "@/components/analysis/RepositoryOverview";
import { ScoreBreakdown } from "@/components/analysis/ScoreBreakdown";
import { SourceCards } from "@/components/analysis/SourceCards";
import { SummarySection } from "@/components/analysis/SummarySection";
import { ScoreGauge } from "@/components/charts/ScoreGauge";
import { ScoreRadarChart } from "@/components/charts/ScoreRadarChart";
import { AppShell } from "@/components/layout/AppShell";
import { canvaFilename } from "@/lib/canva/prompt";
import { getAnalysis } from "@/lib/storage/repository";

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = await getAnalysis(id);

  if (!analysis) {
    notFound();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-semibold text-[#0f766e] hover:underline">
          <ArrowLeft aria-hidden="true" size={16} />
          새 분석으로 돌아가기
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 pb-12 sm:px-6 lg:px-8">
        {analysis.isDemo ? (
          <div className="rounded-lg border border-[#fedf89] bg-[#fffcf5] p-4 text-sm font-semibold text-[#b54708]">
            DEMO MODE: 일부 데이터는 실제 API 응답이 아닌 예시 데이터입니다.
          </div>
        ) : null}

        <RepositoryOverview repository={analysis.repository} />

        <section className="grid gap-4 lg:grid-cols-3">
          <ScoreGauge
            label="Hype Score"
            value={analysis.scores.hype.value}
            helper="스타, 포크, 최근 활동, Reddit 언급량을 정규화했습니다."
            provisional={analysis.scores.hype.provisional}
          />
          <ScoreGauge label="Reality Score" value={analysis.scores.reality.value} helper="커밋, 문서, 해결 속도, 실제 반응을 반영했습니다." />
          <ScoreGauge label="Risk Score" value={analysis.scores.risk.value} helper="버그, 보안, 비용, 설치, API 종속 신호를 반영했습니다." risk />
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <ScoreRadarChart scores={analysis.scores} />
          <div className="rounded-lg border border-[#d9dee7] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-[#111827]">분석 기준</h2>
              <ConfidenceBadge level={analysis.scores.confidence} />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#475467]">{analysis.basisPeriod}</p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Issue" value={analysis.collectedCounts.issues} />
              <Metric label="Commit" value={analysis.collectedCounts.commits} />
              <Metric label="Reddit" value={analysis.collectedCounts.redditPosts} />
              <Metric label="근거" value={analysis.collectedCounts.sources} />
            </dl>
            <div className="mt-5 space-y-2">
              {analysis.scores.confidenceReasons.map((reason) => (
                <p key={reason} className="flex gap-2 text-sm leading-6 text-[#667085]">
                  <Info aria-hidden="true" size={16} className="mt-1 shrink-0 text-[#0f766e]" />
                  {reason}
                </p>
              ))}
            </div>
          </div>
        </section>

        {analysis.notices.length > 0 ? (
          <section className="rounded-lg border border-[#d9dee7] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[#111827]">상태 알림</h2>
            <ul className="mt-3 space-y-2">
              {analysis.notices.map((notice) => (
                <li key={notice} className="text-sm leading-6 text-[#667085]">
                  {notice}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <SummarySection qualitative={analysis.qualitative} />

        <section className="grid gap-4 lg:grid-cols-3">
          <ScoreBreakdown title="Hype Score" score={analysis.scores.hype} />
          <ScoreBreakdown title="Reality Score" score={analysis.scores.reality} />
          <ScoreBreakdown title="Risk Score" score={analysis.scores.risk} />
        </section>

        <SourceCards sources={analysis.sources} />
        <CanvaPromptPanel prompt={analysis.canvaPrompt} filename={canvaFilename(analysis)} />
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-[#f8fafc] p-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#667085]">{label}</dt>
      <dd className="mt-1 text-xl font-bold text-[#111827]">{value.toLocaleString()}</dd>
    </div>
  );
}
