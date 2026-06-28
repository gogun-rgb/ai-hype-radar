# GitHub Portfolio Guide

This guide helps present `ai-hype-radar` as a portfolio representative project on GitHub. No deployment is required.

## Repository About

Open the repository page, click the gear icon next to **About**, and use the following values.

Description:

```text
Analyze GitHub and Reddit signals to separate real AI project utility from hype.
```

Website:

```text
Leave empty unless you intentionally deploy the project later.
```

Topics:

```text
ai
github
reddit
nextjs
typescript
openai
supabase
data-analysis
dashboard
portfolio
playwright
vitest
```

Enable:

- Releases
- Packages only if needed later

Optional repository social preview:

- Do not add a preview image unless you create and commit a real asset.
- Avoid broken image paths in README files.

## Profile Pin

1. Go to your GitHub profile.
2. Select **Customize your pins**.
3. Search for `ai-hype-radar`.
4. Pin it near other projects that show full-stack, data, or AI engineering ability.

Suggested profile note:

```text
AI Hype Radar analyzes open-source AI repositories with deterministic scoring, data coverage, confidence levels, and API-key-free fallback behavior.
```

## Korean Portfolio Summary

```text
AI Hype Radar는 GitHub와 Reddit 신호를 기반으로 AI 오픈소스 프로젝트의 화제성, 실사용성, 위험도를 분석하는 Next.js 프로젝트입니다. Reddit 데이터가 없을 때 0점 처리하지 않고 사용 가능한 신호의 가중치를 재정규화하며, Data Coverage와 Confidence Level로 데이터 한계를 명확히 보여줍니다.
```

## English Portfolio Summary

```text
AI Hype Radar is a Next.js app that analyzes GitHub and Reddit signals to distinguish AI project hype from real utility and risk. It uses deterministic scoring, normalized missing-data handling, Data Coverage, Confidence Level, and API-key-free demo fallback behavior.
```

## What to Emphasize in Interviews

- You separated deterministic scoring from optional LLM summarization.
- You treated missing external data as a data-quality issue, not as negative evidence.
- You designed the app to work without paid or private API keys.
- You added CI and tests that verify type safety, linting, unit/integration logic, builds, and E2E flows.
- You avoided committing secrets and documented fallback behavior explicitly.
