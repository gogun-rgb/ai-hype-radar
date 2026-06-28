# Changelog

All notable changes to AI Hype Radar are documented here.

## 0.1.0 - 2026-06-28

### Added

- Next.js App Router MVP for analyzing public GitHub repositories.
- Deterministic Hype, Reality, and Risk scoring.
- Confidence Level and Data Coverage metadata.
- Reddit status handling for available, insufficient, not configured, rate limited, and failed data sources.
- Optional OpenAI qualitative summaries with rule-based fallback.
- Optional Supabase persistence with local file-storage fallback.
- Canva card-news prompt generation.
- Vitest unit and integration tests.
- Playwright desktop and mobile E2E tests.
- GitHub Actions CI for typecheck, lint, tests, build, and E2E.
- Korean and English README files.

### Changed

- Pinned dependency versions for reproducible installs.
- Missing Reddit data is excluded from scoring weights instead of being treated as zero evidence.

### Security

- Environment examples contain placeholders only.
- API-like secrets are masked during preprocessing.
- Real secrets remain outside Git-tracked files.
