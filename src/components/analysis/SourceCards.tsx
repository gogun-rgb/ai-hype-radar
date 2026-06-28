import { ExternalLink } from "lucide-react";
import { toSafeExternalUrl } from "@/lib/security/url";
import type { AnalysisSource } from "@/types/analysis";

const sentimentLabel = {
  positive: "긍정",
  negative: "부정",
  neutral: "중립"
};

export function SourceCards({ sources }: { sources: AnalysisSource[] }) {
  return (
    <section className="rounded-lg border border-[#d9dee7] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111827]">증거와 출처</h2>
          <p className="mt-1 text-sm text-[#667085]">짧은 인용 대신 요약을 표시합니다.</p>
        </div>
        <span className="rounded-md border border-[#d9dee7] px-2 py-1 text-xs font-semibold text-[#344054]">{sources.length}개</span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {sources.slice(0, 12).map((source) => {
          const safeUrl = toSafeExternalUrl(source.url);

          return (
            <article key={source.id} className="rounded-lg border border-[#d9dee7] bg-[#f8fafc] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-[#344054] ring-1 ring-[#d9dee7]">
                  {source.sourceType === "github_issue" ? "GitHub Issue" : source.sourceType === "reddit_post" ? "Reddit" : "README"}
                </span>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#475467] ring-1 ring-[#d9dee7]">
                  {sentimentLabel[source.sentiment]}
                </span>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#475467] ring-1 ring-[#d9dee7]">
                  {source.category}
                </span>
              </div>
              <h3 className="mt-3 line-clamp-2 text-base font-bold text-[#111827]">{source.title}</h3>
              <p className="mt-2 line-clamp-4 text-sm leading-6 text-[#475467]">{source.summary}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-[#667085]">
                <span>{source.publishedAt ? new Date(source.publishedAt).toLocaleDateString("ko-KR") : "작성일 데이터 부족"}</span>
                {source.reactions || source.score ? <span>반응 {source.reactions ?? source.score}</span> : null}
                {safeUrl ? (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring inline-flex items-center gap-1 rounded-md font-bold text-[#0f766e] hover:underline"
                  >
                    원문 링크
                    <ExternalLink aria-hidden="true" size={13} />
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
