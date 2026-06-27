import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Hype Radar",
  description: "GitHub와 Reddit 데이터를 바탕으로 AI 프로젝트의 화제성, 실사용성, 위험도를 분석합니다."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
