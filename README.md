# AI Hype Radar

[English README](README.en.md)

AI Hype Radar는 GitHub와 Reddit 신호를 결합해 AI 오픈소스 프로젝트의 화제성, 실사용성, 위험도를 분석하는 Next.js 포트폴리오 프로젝트입니다. LLM에게 점수를 만들어 달라고 맡기지 않고, 수집 가능한 정량 신호를 코드로 정규화해 Hype Score, Reality Score, Risk Score를 계산합니다. OpenAI는 설정된 경우에만 근거 요약과 설명을 보강하며, API 키가 없어도 규칙 기반 분석과 Demo Mode가 동작합니다.

## 포트폴리오 하이라이트

- GitHub URL 검증부터 데이터 수집, 점수 계산, 근거 카드, 저장, 결과 화면까지 이어지는 end-to-end 분석 흐름
- Reddit 데이터가 없을 때 0점 처리하지 않고 사용 가능한 신호의 가중치를 재정규화하는 공정한 점수 계산
- Data Coverage와 Confidence Level을 함께 표시해 데이터 부족과 실제 부정 반응을 구분
- OpenAI, Reddit, Supabase가 없어도 동작하는 graceful fallback 및 Demo Mode
- TypeScript 타입, Vitest 단위/통합 테스트, Playwright E2E, GitHub Actions CI로 검증 가능한 품질 관리
- Canva 카드뉴스 프롬프트 생성까지 포함한 분석 결과 재활용 흐름

## 주요 기능

- GitHub 저장소 URL 입력 및 검증
- 저장소 기본 정보, 최근 Issue, 최근 Commit, Release, Contributor, README 수집
- Reddit 공식 API 연결 시 관련 게시물 검색
- Reddit 미연결, 실패, rate limit, 결과 부족 상태를 명시적으로 구분
- Hype Score, Reality Score, Risk Score, Confidence Level, Data Coverage 계산
- README 주장, 반복 문제, 긍정/부정 반응, 근거 링크 표시
- Canva에 붙여 넣을 수 있는 6장 카드뉴스 프롬프트 생성
- Supabase가 없을 때 파일 기반 저장소(`.ai-hype-radar/analyses.json`) 사용

## 기술 스택

- Next.js App Router, React, TypeScript
- Tailwind CSS, Recharts, Lucide Icons
- Zod, Vitest, React Testing Library, Playwright
- GitHub REST API, Reddit API, OpenAI API
- Supabase PostgreSQL 또는 로컬 파일 저장소
- GitHub Actions CI

## 프로젝트 구조

```text
src/
  app/                  Next.js pages and route handlers
  components/           Analysis UI, charts, layout components
  config/scoring.ts     Score weights and normalization thresholds
  lib/analysis          Analysis orchestration and source building
  lib/github            GitHub API client and demo fallback
  lib/reddit            Reddit OAuth search client
  lib/openai            Optional structured qualitative summary
  lib/scoring           Deterministic score calculation utilities
  lib/preprocessing     README parsing, classification, sanitization
  lib/storage           File and Supabase persistence
  tests/                Unit, integration, and E2E tests
supabase/migrations     Database schema
.github/workflows       CI workflow
```

## 로컬 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
npm.cmd run dev
```

브라우저에서 `http://localhost:3000`을 열고 다음 예시 저장소를 입력해 볼 수 있습니다.

```text
https://github.com/vercel/ai
```

## 환경 변수

| 변수 | 목적 | 없을 때 동작 |
| --- | --- | --- |
| `GITHUB_TOKEN` | GitHub API rate limit 완화 | 공개 저장소는 익명 요청으로 수집 |
| `OPENAI_API_KEY` | AI 기반 설명과 주장 비교 보강 | 규칙 기반 요약 사용 |
| `OPENAI_MODEL` | OpenAI 설명 생성 모델 | `gpt-4o-mini` 기본값 |
| `REDDIT_CLIENT_ID` | Reddit OAuth 검색 | Reddit 신호는 점수에서 제외 |
| `REDDIT_CLIENT_SECRET` | Reddit OAuth 검색 | Reddit 신호는 점수에서 제외 |
| `REDDIT_USER_AGENT` | Reddit API 필수 User-Agent | Reddit 신호는 점수에서 제외 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 파일 기반 저장소 사용 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 anon key | 현재 서버 중심 MVP에서는 필수 아님 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 측 분석 결과 저장 | 파일 기반 저장소 사용 |
| `NEXT_PUBLIC_APP_URL` | 앱 URL | 로컬 기본값 사용 |
| `DEMO_MODE` | 외부 API 실패 시 demo fallback | `true`이면 명시된 예시 데이터 사용 |

실제 API 키는 `.env.local`에만 저장하고 Git에 커밋하지 마세요.

## 점수 계산

모든 점수는 0-100으로 제한됩니다.

Hype Score:

- 스타 모멘텀 또는 최초 분석 시 연령 대비 스타 모멘텀: 40%
- Reddit 언급량: 30%
- 포크 모멘텀 또는 포크 비율: 15%
- 최근 Issue/Commit 활동: 15%

Reality Score:

- 최근 Commit 활동: 20%
- 설치 성공 후기: 25%
- Issue 해결 속도: 20%
- README 완성도: 20%
- 실제 결과물 사례: 15%

Risk Score:

- 미해결 버그: 25%
- 보안/개인정보 신호: 25%
- 비용 불확실성: 20%
- 설치 복잡도: 15%
- 특정 API 종속성: 15%

Reality Score는 높을수록 좋고, Risk Score는 높을수록 위험합니다.

## 데이터 부족 처리

AI Hype Radar는 “데이터 없음”과 “실제 반응 없음”을 구분합니다.

- Reddit 인증 정보가 없거나 API가 실패하면 Reddit 신호는 0점으로 처리하지 않고 점수 계산에서 제외합니다.
- 제외된 신호의 원래 가중치는 사용 가능한 신호들에 재분배됩니다.
- Reddit 검색이 정상 수행되었지만 게시물이 없다면 실제 언급이 부족한 신호로 계산합니다.
- 누락되거나 제한적인 데이터는 Data Coverage와 Confidence Level에 반영됩니다.
- 모든 핵심 신호가 부족한 경우 임의의 정상 점수를 만들지 않고 낮은 신뢰도와 데이터 부족 상태를 보여줍니다.

가중치 재정규화 공식:

```text
effectiveWeight = originalWeight / sumOfAvailableWeights
```

## API와 저장 데이터

분석 API 응답의 `analysis.scores`에는 다음 정보가 포함됩니다.

- `hype`, `reality`, `risk`: 점수, breakdown, 원래 가중치, 효과 가중치, 누락 신호
- `confidence`: `High`, `Medium`, `Low`
- `confidenceReasons`: 신뢰도 판단 이유
- `dataCoverage`: 데이터 소스별 상태, 수집량, coverage, 점수 영향

Data source status:

```ts
type DataSourceStatus =
  | "available"
  | "unavailable"
  | "not_configured"
  | "rate_limited"
  | "failed"
  | "insufficient";
```

## 검증 명령

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
npm run check
```

GitHub Actions CI도 같은 품질 게이트를 실행합니다. CI는 배포하지 않고 검증만 수행합니다.

## Supabase 설정

Supabase를 사용하려면 프로젝트를 만든 뒤 SQL Editor에서 다음 파일을 실행합니다.

```text
supabase/migrations/001_initial_schema.sql
```

그 다음 `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`를 입력합니다. Supabase가 없어도 로컬 파일 저장소로 분석 결과가 저장됩니다.

## 보안

- `.env`, `.env.local`, `.env.*.local`은 Git에서 제외됩니다.
- Authorization header와 API 키를 로그로 출력하지 않습니다.
- 전처리 단계에서 API key나 token처럼 보이는 문자열을 마스킹합니다.
- `github.com/owner/repo` 형식의 저장소 URL만 허용합니다.

## 로드맵

1. 자동 rising repository 탐지
2. 예약 snapshot 수집
3. 다중 저장소 비교
4. 카드뉴스 이미지 생성 자동화
5. 검색 트렌드 API 연동

## 라이선스

MIT
