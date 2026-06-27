import type { AnalysisResult, GitHubRepository, QualitativeSummary, Scores } from "@/types/analysis";

export function generateCanvaPrompt(input: {
  repository: GitHubRepository;
  scores: Scores;
  qualitative: QualitativeSummary;
  basisPeriod: string;
  sourcesCount: number;
}): string {
  const repo = input.repository;
  const positives = input.qualitative.positivePoints.map((point) => point.summary).slice(0, 2);
  const negatives = input.qualitative.negativePoints.map((point) => point.summary).slice(0, 3);
  const gaps = input.qualitative.claimRealityGaps.map((gap) => `${gap.claim}: ${gap.userExperience}`).slice(0, 2);

  return `Canva 카드뉴스 제작 프롬프트

목표: GitHub와 Reddit 기반 데이터 분석 결과만 사용해 "${repo.fullName}" 프로젝트의 화제성, 실사용성, 위험도를 설명하는 인스타그램 세로형 카드뉴스를 만든다.

디자인 조건:
- 인스타그램 세로형 1080x1350px
- 총 6장
- 미니멀한 AI 기술 뉴스 디자인
- 흰색 또는 아주 옅은 회색 배경
- 상단 45~55%에 GitHub 화면, 터미널 UI, 단순 도식 중 하나를 배치
- 하단에 제목과 본문
- 모든 텍스트 좌측 정렬
- 제목은 Pretendard ExtraBold 또는 SUIT Heavy
- 본문은 Pretendard Medium 또는 SUIT Medium
- 검정과 진회색 중심, 강조색은 청록/파랑/주황을 절제해서 사용
- 과도한 그라데이션과 장식 금지
- 출처와 분석 기준일을 작게 표시
- 확인되지 않은 사실이나 수치를 추가하지 않기

분석 기준:
- 저장소: ${repo.fullName}
- GitHub: ${repo.htmlUrl}
- 분석 기준 기간: ${input.basisPeriod}
- 수집 근거 수: ${input.sourcesCount}개
- Hype Score: ${input.scores.hype.value}/100${input.scores.hype.provisional ? " (최초 분석 임시 점수)" : ""}
- Reality Score: ${input.scores.reality.value}/100
- Risk Score: ${input.scores.risk.value}/100
- 신뢰도: ${input.scores.confidence}

1장: 썸네일
제목: GitHub에서 주목받는 ${repo.name}
본문: 진짜 쓸 만할까?
시각 요소: GitHub 스타 수 ${repo.stars.toLocaleString()}개와 레이더 차트를 단순하게 표현.
출처 문구: GitHub/Reddit 기반 AI Hype Radar 분석

2장: 프로젝트 소개
제목: 무엇을 만드는 프로젝트인가
본문: ${repo.description ?? "README와 GitHub 메타데이터를 기준으로 프로젝트 성격을 확인했습니다."}
시각 요소: 언어 ${repo.language ?? "데이터 부족"}, 라이선스 ${repo.license ?? "데이터 부족"}, 포크 ${repo.forks.toLocaleString()}개를 작은 지표로 배치.
출처 문구: GitHub 저장소 메타데이터

3장: Hype Score
제목: 화제성 점수 ${input.scores.hype.value}
본문: ${input.qualitative.hypeReason}
시각 요소: 반원형 게이지와 스타/포크/최근 활동 지표.
출처 문구: GitHub 활동, Reddit 언급량

4장: 실제 사용자 반응
제목: 실사용성 점수 ${input.scores.reality.value}
본문: ${positives.length > 0 ? positives.join(" ") : "긍정 후기는 데이터가 부족합니다. README 문서와 최근 커밋 활동을 중심으로 평가했습니다."}
시각 요소: 설치 성공 후기, 문서 완성도, 최근 커밋을 3개 칩으로 표현.
출처 문구: GitHub Issue/Reddit 요약

5장: 반복 문제와 위험
제목: 위험도 점수 ${input.scores.risk.value}
본문: ${negatives.length > 0 ? negatives.join(" ") : "반복 위험 신호는 제한적으로만 발견되었습니다."}
시각 요소: 설치, 비용, 보안, API 종속성 위험을 체크리스트로 표현.
출처 문구: GitHub Issue/Reddit 요약

6장: 최종 평가
제목: 그래서 누구에게 맞을까
본문: ${input.qualitative.oneLineVerdict} ${gaps.length > 0 ? `공식 주장과 반응 차이: ${gaps.join(" ")}` : "공식 주장과 실제 반응 차이는 데이터가 더 필요합니다."}
시각 요소: Hype/Reality/Risk 세 점수를 한 줄 대시보드로 배치.
출처 문구: 분석 기준일 ${new Date().toLocaleDateString("ko-KR")} / 수집 근거 ${input.sourcesCount}개`;
}

export function canvaFilename(result: AnalysisResult): string {
  const safeRepo = `${result.repository.owner}-${result.repository.repo}`.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  return `ai-hype-radar-${safeRepo}-canva-prompt.txt`;
}
