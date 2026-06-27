# AI Hype Radar

GitHub와 Reddit 데이터를 바탕으로 AI 오픈소스 프로젝트의 화제성, 실사용성, 위험도를 분석하는 Next.js MVP입니다. 점수는 LLM이 임의로 만들지 않고 GitHub/Reddit 신호를 코드로 정규화해 계산하며, OpenAI는 해설과 요약을 보강하는 용도로만 사용합니다.

## 주요 기능

- GitHub 저장소 URL 입력 및 검증
- 저장소 기본 정보, Issue 최대 30개, 최근 Commit, Release, README 수집
- Reddit 공식 API 연결 시 관련 게시물 검색
- Reddit 미연결 상태에서도 GitHub 중심 분석 유지
- Hype Score, Reality Score, Risk Score, Confidence Level 계산
- README 주장, 반복 문제, 긍정/부정 반응, 근거 링크 표시
- Canva에 붙여 넣을 수 있는 6장 카드뉴스 프롬프트 생성
- Supabase가 없을 때 `.ai-hype-radar/analyses.json` 파일 기반 Demo Mode 저장
- Vitest 단위/통합 테스트와 Playwright E2E 테스트

## 화면

실행 후 `http://localhost:3000`에서 메인 대시보드, 분석 진행 상태, 결과 페이지, Canva 프롬프트 패널을 확인할 수 있습니다.

## 기술 스택

- Next.js App Router, TypeScript, React
- Tailwind CSS, Recharts, Lucide Icons
- Zod, Vitest, React Testing Library, Playwright
- GitHub REST API, Reddit 공식 API, OpenAI API, Supabase PostgreSQL

## 폴더 구조

```text
src/
  app/                  Next.js 페이지와 Route Handlers
  components/           분석 UI, 차트, 공통 레이아웃
  config/scoring.ts     점수 가중치와 키워드
  lib/github            GitHub API client와 demo fallback
  lib/reddit            Reddit OAuth 검색 client
  lib/openai            Structured JSON 해설 생성
  lib/scoring           순수 점수 계산 함수
  lib/preprocessing     Markdown 정리, 중복 제거, README 분석
  lib/storage           파일 저장소와 Supabase 저장 계층
  tests/                unit, integration, e2e 테스트
supabase/migrations     DB 스키마
```

## 로컬 설치

```bash
npm install
cp .env.example .env.local
npm run dev
```

Windows PowerShell에서는 복사 명령을 이렇게 실행합니다.

```powershell
Copy-Item .env.example .env.local
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 환경변수

| 변수 | 필요한 이유 | 없을 때 동작 |
| --- | --- | --- |
| `GITHUB_TOKEN` | GitHub API rate limit 완화 | 공개 저장소는 비인증 요청으로 시도 |
| `OPENAI_API_KEY` | 한국어 해설, 주장 비교, 카드뉴스 문구 보강 | 규칙 기반 요약으로 대체 |
| `REDDIT_CLIENT_ID` | Reddit OAuth 검색 | Reddit 분석 비활성화 |
| `REDDIT_CLIENT_SECRET` | Reddit OAuth 검색 | Reddit 분석 비활성화 |
| `REDDIT_USER_AGENT` | Reddit API 필수 User-Agent | Reddit 분석 비활성화 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 파일 기반 저장 사용 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 공개 키 | 현재 MVP 서버 저장에는 필수 아님 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버에서 분석 결과 저장 | 파일 기반 저장 사용 |
| `NEXT_PUBLIC_APP_URL` | 배포 URL | 로컬 기본값 사용 |
| `DEMO_MODE` | 외부 API 실패 시 명시적 demo fallback | `false`면 실패를 오류로 반환 |

API 키는 `.env.local`에만 넣고 Git에 올리지 마세요.

## API 키 설정

GitHub Token은 GitHub Settings → Developer settings → Personal access tokens에서 발급합니다. 공개 저장소 읽기만 필요하면 넓은 권한을 주지 않아도 됩니다.

Reddit API는 Reddit 앱 관리 페이지에서 script 앱을 만들고 client id, secret, user agent를 입력합니다.

OpenAI API는 OpenAI 대시보드에서 키를 발급해 `OPENAI_API_KEY`에 입력합니다. 키가 없으면 정량 점수와 규칙 기반 요약은 계속 작동합니다.

Supabase를 쓰려면 새 프로젝트를 만든 뒤 SQL editor에서 `supabase/migrations/001_initial_schema.sql`을 실행하고 URL과 service role key를 `.env.local`에 입력합니다.

## 실행 명령어

```bash
npm run dev
npm run build
npm run start
```

## 테스트 명령어

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
npm run check
```

## 점수 계산 공식

모든 점수는 0-100으로 제한됩니다.

Hype Score:
- 스타 증가율 또는 최초 분석용 스타 모멘텀 40%
- Reddit 언급량 30%
- 포크 증가율 또는 포크 비율 15%
- 최근 Issue/Commit 활동 15%

Reality Score:
- 최근 커밋 활동 20%
- 설치 성공 후기 25%
- Issue 해결 속도 20%
- README 문서 완성도 20%
- 실제 결과물 사례 15%

Risk Score:
- 미해결 버그 25%
- 보안/개인정보 Issue 25%
- 비용 불확실성 20%
- 설치 복잡도 15%
- 특정 API 종속성 15%

Reality Score는 높을수록 좋고, Risk Score는 높을수록 위험합니다.

## 한계와 데이터 부족 처리

- GitHub API만으로 과거 스타 수를 정확히 알기 어렵기 때문에 최초 분석은 임시 Hype Score로 표시합니다.
- 같은 저장소를 다시 분석하면 저장된 Snapshot과 비교해 증가량을 더 정확히 반영합니다.
- Reddit 인증 정보가 없으면 Reddit 항목은 0으로 계산하고 화면에 미연결 상태를 표시합니다.
- OpenAI 호출이 실패해도 점수 계산과 결과 페이지는 유지됩니다.
- Demo Mode fallback 데이터는 화면에 DEMO로 표시되어 실제 데이터처럼 보이지 않게 했습니다.

## 보안 주의사항

- `.env`, `.env.local`, `.env.*.local`은 `.gitignore`에 포함되어 있습니다.
- 로그에 Authorization 헤더나 API 키를 출력하지 않습니다.
- 전처리 단계에서 API key처럼 보이는 문자열을 마스킹합니다.
- GitHub URL은 `github.com/owner/repo` 형태만 허용합니다.

## 배포

Vercel 배포를 권장합니다.

1. GitHub 저장소에 푸시합니다.
2. Vercel에서 프로젝트를 import합니다.
3. Production 환경변수에 `.env.local`과 같은 값을 입력합니다.
4. Supabase를 쓸 경우 migration SQL을 먼저 실행합니다.

## 현재 MVP 기능

- 단일 GitHub 저장소 URL 분석
- GitHub 중심 정량 점수 계산
- Reddit/OpenAI/Supabase 선택 연결
- Canva 카드뉴스 프롬프트 출력
- 최근 분석 목록 확인

## 향후 로드맵

1. 자동 급상승 저장소 탐지
2. 시간별 Snapshot 수집
3. 다중 저장소 비교
4. 자동 카드뉴스 이미지 생성
5. 검색 트렌드 API 연동
6. 팀 공유용 리포트 내보내기

## GitHub 업로드

```bash
git init
git add .
git commit -m "feat: build AI Hype Radar MVP"
gh repo create ai-hype-radar --public --source=. --remote=origin --description="Analyze GitHub and Reddit signals to separate real AI project utility from hype." --push
```

같은 이름의 저장소가 이미 있으면 `ai-hype-radar-mvp`처럼 새 이름을 사용하세요.

## 라이선스

MIT
