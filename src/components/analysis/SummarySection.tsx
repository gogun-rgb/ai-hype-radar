import { AlertCircle, CheckCircle2, GitCompareArrows, Sparkles } from "lucide-react";
import type { QualitativeSummary } from "@/types/analysis";

export function SummarySection({ qualitative }: { qualitative: QualitativeSummary }) {
  return (
    <section className="rounded-lg border border-[#d9dee7] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden="true" size={19} className="text-[#0f766e]" />
        <h2 className="text-xl font-bold text-[#111827]">핵심 요약</h2>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SummaryList
          icon={<CheckCircle2 aria-hidden="true" size={18} className="text-[#067647]" />}
          title="긍정적으로 평가된 부분"
          empty="긍정 신호가 부족합니다."
          items={qualitative.positivePoints.map((point) => point.summary)}
        />
        <SummaryList
          icon={<AlertCircle aria-hidden="true" size={18} className="text-[#b42318]" />}
          title="반복적으로 나온 문제"
          empty="반복 문제 데이터가 부족합니다."
          items={qualitative.recurringProblems.map((problem) => problem.summary)}
        />
        <SummaryList
          icon={<GitCompareArrows aria-hidden="true" size={18} className="text-[#175cd3]" />}
          title="공식 주장과 실제 반응 차이"
          empty="비교할 사용자 반응이 부족합니다."
          items={qualitative.claimRealityGaps.map((gap) => `${gap.claim}: ${gap.userExperience}`)}
        />
        <div className="rounded-md border border-[#d9dee7] bg-[#f8fafc] p-4">
          <p className="text-sm font-bold text-[#344054]">한 줄 평가</p>
          <p className="mt-3 text-base leading-7 text-[#111827]">{qualitative.oneLineVerdict}</p>
          <p className="mt-3 text-xs font-medium text-[#667085]">{qualitative.aiGenerated ? "OpenAI 해설" : "규칙 기반 해설"}</p>
        </div>
      </div>
    </section>
  );
}

function SummaryList({ icon, title, empty, items }: { icon: React.ReactNode; title: string; empty: string; items: string[] }) {
  return (
    <div className="rounded-md border border-[#d9dee7] bg-[#f8fafc] p-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-[#344054]">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-[#667085]">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.slice(0, 4).map((item) => (
            <li key={item} className="text-sm leading-6 text-[#475467]">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
