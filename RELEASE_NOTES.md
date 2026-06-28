# AI Hype Radar v0.1.0

## English

Initial MVP release.

- Analyze a single public GitHub repository from a URL.
- Collect GitHub repository metadata, recent issues, commits, releases, contributors, and README.
- Optionally search Reddit through the official API when credentials are configured.
- Calculate deterministic Hype, Reality, and Risk scores without letting an LLM invent scores.
- Display score breakdowns, confidence level, evidence cards, and source links.
- Fall back safely when Reddit, OpenAI, or Supabase is not configured.
- Generate a Canva-ready 6-slide vertical card-news prompt.
- Include Korean and English documentation.
- Include Supabase migration, Vitest tests, and Playwright desktop/mobile E2E tests.

Validation:

- `npm run check`
- `npm run test:e2e`

Known limitation:

- First-time Hype Score is provisional because GitHub REST API does not provide exact historical star growth.

## 한국어

초기 MVP 릴리즈입니다.

- GitHub 저장소 URL 하나를 입력해 공개 저장소를 분석합니다.
- 저장소 메타데이터, 최근 Issue, Commit, Release, 기여자, README를 수집합니다.
- Reddit 인증 정보가 있으면 공식 API로 관련 게시물을 검색합니다.
- LLM이 점수를 만들지 않고 코드가 Hype, Reality, Risk 점수를 계산합니다.
- 점수 근거, 신뢰도, 증거 카드, 원문 링크를 표시합니다.
- Reddit, OpenAI, Supabase가 없어도 안전하게 fallback합니다.
- Canva에 붙여 넣을 수 있는 6장 카드뉴스 프롬프트를 생성합니다.
- 한국어/영어 문서를 제공합니다.
- Supabase migration, Vitest 테스트, Playwright desktop/mobile E2E 테스트를 포함합니다.

검증:

- `npm run check`
- `npm run test:e2e`

현재 제한:

- 최초 분석의 Hype Score는 GitHub REST API만으로 정확한 과거 스타 증가량을 알 수 없어 임시 점수로 표시됩니다.
