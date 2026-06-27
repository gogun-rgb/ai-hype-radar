import { AnalyzeForm } from "@/components/analysis/AnalyzeForm";
import { RecentAnalyses } from "@/components/analysis/RecentAnalyses";
import { AppShell } from "@/components/layout/AppShell";
import { BarChart3, Database, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <AppShell>
      <section className="border-b border-[#d9dee7] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-14">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#0f766e]">AI project reality check</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-[#111827] sm:text-5xl">AI Hype Radar</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#475467]">
              GitHub와 Reddit 데이터를 바탕으로 AI 프로젝트의 화제성, 실사용성, 위험도를 분석합니다.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: BarChart3, label: "정량 점수", text: "LLM이 아닌 코드 계산" },
                { icon: Database, label: "근거 추적", text: "Issue와 게시물 링크" },
                { icon: ShieldCheck, label: "안전한 fallback", text: "키 없이도 기본 분석" }
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[#d9dee7] bg-[#f8fafc] p-4">
                  <item.icon aria-hidden="true" size={20} className="text-[#0f766e]" />
                  <p className="mt-3 text-sm font-bold text-[#111827]">{item.label}</p>
                  <p className="mt-1 text-xs font-medium text-[#667085]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          <AnalyzeForm />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <RecentAnalyses />
      </section>
    </AppShell>
  );
}
