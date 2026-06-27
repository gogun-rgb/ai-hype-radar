"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { Scores } from "@/types/analysis";

export function ScoreRadarChart({ scores }: { scores: Scores }) {
  const data = [
    { name: "Hype", value: scores.hype.value },
    { name: "Reality", value: scores.reality.value },
    { name: "Risk", value: scores.risk.value }
  ];

  return (
    <div className="h-64 rounded-lg border border-[#d9dee7] bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#344054]">점수 균형</h3>
        <span className="text-xs font-medium text-[#667085]">0-100</span>
      </div>
      <ResponsiveContainer width="100%" height="88%">
        <RadarChart data={data}>
          <PolarGrid stroke="#d9dee7" />
          <PolarAngleAxis dataKey="name" tick={{ fill: "#344054", fontSize: 12, fontWeight: 600 }} />
          <Radar dataKey="value" fill="#0f766e" fillOpacity={0.22} stroke="#0f766e" strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
