"use client";

import { useState } from "react";
import { Check, Clipboard, Download } from "lucide-react";

export function CanvaPromptPanel({ prompt, filename }: { prompt: string; filename: string }) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadPrompt() {
    const blob = new Blob([prompt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-lg border border-[#d9dee7] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#111827]">Canva 카드뉴스 프롬프트</h2>
          <p className="mt-1 text-sm text-[#667085]">분석된 사실과 점수만 사용합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyPrompt}
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-[#0f766e] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#115e59]"
          >
            {copied ? <Check aria-hidden="true" size={16} /> : <Clipboard aria-hidden="true" size={16} />}
            {copied ? "복사됨" : "복사"}
          </button>
          <button
            type="button"
            onClick={downloadPrompt}
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-[#d9dee7] bg-white px-3 text-sm font-semibold text-[#344054] shadow-sm hover:border-[#98a2b3]"
          >
            <Download aria-hidden="true" size={16} />
            텍스트 다운로드
          </button>
        </div>
      </div>
      <textarea
        readOnly
        value={prompt}
        className="focus-ring mt-5 min-h-[420px] w-full resize-y rounded-md border border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm leading-6 text-[#111827]"
      />
    </section>
  );
}
