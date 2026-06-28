# AI Hype Radar

[한국어 README](README.md)

AI Hype Radar is a Next.js MVP that analyzes GitHub and Reddit signals to help separate real open-source AI project utility from hype.

The app does not ask an LLM to invent scores. It first calculates Hype, Reality, and Risk scores from normalized quantitative signals, then optionally uses OpenAI only for Korean-language explanation, issue grouping, README claim comparison, and Canva prompt writing.

## Features

- GitHub repository URL validation
- GitHub repository metadata, recent issues, commits, releases, contributors, and README collection
- Reddit official API search when credentials are configured
- Safe fallback when Reddit, OpenAI, or Supabase is not configured
- Deterministic Hype Score, Reality Score, Risk Score, and Confidence Level
- Evidence cards linked back to GitHub issues, Reddit posts, or README
- Canva-ready 6-slide vertical card-news prompt
- File-based demo storage when Supabase is unavailable
- Unit, integration, and Playwright E2E tests

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Recharts
- Zod
- Lucide Icons
- Vitest
- Playwright
- GitHub REST API
- Reddit API
- OpenAI API
- Supabase PostgreSQL

## Quick Start

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

Open the app at:

```text
http://localhost:3000
```

Try this example repository:

```text
https://github.com/vercel/ai
```

## Environment Variables

| Variable | Purpose | Behavior when missing |
| --- | --- | --- |
| `GITHUB_TOKEN` | Increases GitHub API rate limits | Public repositories are fetched anonymously |
| `OPENAI_API_KEY` | Enables AI-generated explanation and claim comparison | Rule-based summary is used |
| `OPENAI_MODEL` | Model used for OpenAI explanation | Defaults to `gpt-4o-mini` |
| `REDDIT_CLIENT_ID` | Reddit OAuth search | Reddit analysis is disabled |
| `REDDIT_CLIENT_SECRET` | Reddit OAuth search | Reddit analysis is disabled |
| `REDDIT_USER_AGENT` | Required Reddit API User-Agent | Reddit analysis is disabled |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | File-based storage is used |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key | Not required for the current server-side MVP |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side persistence | File-based storage is used |
| `NEXT_PUBLIC_APP_URL` | Public app URL | Localhost is used |
| `DEMO_MODE` | Enables explicit demo fallback when external APIs fail | If `false`, failures are returned as errors |

Never commit real API keys. Keep them in `.env.local`.

## Scripts

```bash
npm run dev
npm run typegen
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

## Scoring

All scores are clamped to 0-100.

Hype Score:
- Star momentum or first-analysis star momentum: 40%
- Reddit mentions: 30%
- Fork momentum or fork ratio: 15%
- Recent issue and commit activity: 15%

Reality Score:
- Recent commit activity: 20%
- Installation success signals: 25%
- Issue resolution speed: 20%
- README completeness: 20%
- Real output examples: 15%

Risk Score:
- Unresolved bugs: 25%
- Security and privacy signals: 25%
- Cost uncertainty: 20%
- Installation complexity: 15%
- Vendor/API dependency: 15%

Reality is better when higher. Risk is more dangerous when higher.

## Data Limitations

- The first analysis cannot know historical GitHub star growth from the REST API alone, so Hype Score is marked provisional.
- Re-running the same repository stores snapshots and enables real delta comparison.
- If Reddit is not connected, the app clearly states that analysis is GitHub-centered.
- If OpenAI fails, quantitative scoring still works.
- Demo fallback data is visibly labeled as DEMO and is not presented as real user data.

## Supabase Setup

Create a Supabase project, open SQL Editor, and run:

```text
supabase/migrations/001_initial_schema.sql
```

Then fill in `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Security Notes

- `.env`, `.env.local`, and `.env.*.local` are ignored by Git.
- The app does not log API keys or authorization headers.
- Preprocessing masks strings that look like API keys or tokens.
- Only `github.com/owner/repo`-style repository URLs are accepted.

## Roadmap

1. Automatic rising-repository detection
2. Scheduled snapshot collection
3. Multi-repository comparison
4. Automatic card-news image generation
5. Search trend API integration

## License

MIT
