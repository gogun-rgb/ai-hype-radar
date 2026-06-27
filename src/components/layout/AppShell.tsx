import Link from "next/link";
import { Activity, GitBranch } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <header className="border-b border-[#d9dee7] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="focus-ring flex items-center gap-3 rounded-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#0f766e] text-white">
              <Activity aria-hidden="true" size={22} />
            </span>
            <span>
              <span className="block text-base font-semibold text-[#111827]">AI Hype Radar</span>
              <span className="block text-xs font-medium text-[#667085]">GitHub + Reddit signal analysis</span>
            </span>
          </Link>
          <a
            href="https://github.com"
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-[#d9dee7] bg-white px-3 text-sm font-semibold text-[#344054] shadow-sm transition hover:border-[#98a2b3]"
            target="_blank"
            rel="noreferrer"
          >
            <GitBranch aria-hidden="true" size={17} />
            GitHub
          </a>
        </div>
      </header>
      {children}
    </main>
  );
}
