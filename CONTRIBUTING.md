# Contributing

Thanks for helping improve AI Hype Radar.

## Local Setup

Requirements:

- Node.js 24
- npm 11

Install dependencies:

```bash
npm ci
```

Create local environment variables:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Real API keys are optional. Without them, the app should still support rule-based analysis and Demo Mode.

## Development

```bash
npm run dev
```

Open `http://localhost:3000`.

## Validation

Run these before opening a pull request:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:coverage
npm run build
npm run test:e2e
```

`npm run check` runs typecheck, lint, tests, and build. E2E and coverage are kept as explicit commands because they are separate CI gates.

## Testing Expectations

- Add or update tests for scoring changes, fallback behavior, API clients, validation, and user-facing state changes.
- Do not weaken lint, typecheck, tests, or coverage thresholds to make a change pass.
- Keep external services mocked in tests unless a test explicitly documents why live access is required.
- Demo data must remain visibly labeled as demo data.

## Pull Request Guidance

- Keep changes focused.
- Explain user impact and validation commands in the PR description.
- Do not commit `.env.local`, runtime data, coverage output, or repo-health generated reports.
- Do not add screenshots, GIFs, or deployment links unless they are real and intentionally maintained.
