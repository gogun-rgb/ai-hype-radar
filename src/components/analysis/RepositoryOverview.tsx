import { Calendar, Code2, GitFork, Scale, Star, Users } from "lucide-react";
import type { GitHubRepository } from "@/types/analysis";

export function RepositoryOverview({ repository }: { repository: GitHubRepository }) {
  const stats = [
    { label: "Stars", value: repository.stars.toLocaleString(), icon: Star },
    { label: "Forks", value: repository.forks.toLocaleString(), icon: GitFork },
    { label: "Open Issues", value: repository.openIssues.toLocaleString(), icon: Code2 },
    { label: "Contributors", value: repository.contributors.toLocaleString(), icon: Users },
    { label: "Language", value: repository.language ?? "데이터 부족", icon: Code2 },
    { label: "License", value: repository.license ?? "데이터 부족", icon: Scale }
  ];

  return (
    <section className="rounded-lg border border-[#d9dee7] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#0f766e]">저장소 정보</p>
          <h1 className="mt-2 break-words text-3xl font-bold text-[#111827]">{repository.fullName}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[#475467]">{repository.description ?? "저장소 설명이 비어 있습니다."}</p>
          <a
            href={repository.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="focus-ring mt-4 inline-flex rounded-md text-sm font-semibold text-[#0f766e] underline-offset-4 hover:underline"
          >
            GitHub에서 열기
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          {repository.topics.slice(0, 6).map((topic) => (
            <span key={topic} className="rounded-md border border-[#d9dee7] bg-[#f8fafc] px-2 py-1 text-xs font-semibold text-[#344054]">
              {topic}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border border-[#e4e7ec] bg-[#f8fafc] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#667085]">
              <stat.icon aria-hidden="true" size={15} />
              {stat.label}
            </div>
            <p className="mt-2 truncate text-lg font-bold text-[#111827]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 text-sm text-[#475467] sm:grid-cols-2 lg:grid-cols-4">
        <MetaDate label="생성일" value={repository.createdAt} />
        <MetaDate label="최근 업데이트" value={repository.updatedAt} />
        <MetaDate label="최근 Push" value={repository.pushedAt} />
        <MetaDate label="최근 릴리스" value={repository.latestRelease?.publishedAt ?? null} />
      </div>
    </section>
  );
}

function MetaDate({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-[#f8fafc] px-3 py-2">
      <Calendar aria-hidden="true" size={15} className="text-[#667085]" />
      <span className="font-semibold text-[#344054]">{label}</span>
      <span>{value ? new Date(value).toLocaleDateString("ko-KR") : "데이터 부족"}</span>
    </div>
  );
}
