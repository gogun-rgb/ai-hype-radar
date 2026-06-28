# Test Organization

This is a Next.js and TypeScript application. Tests intentionally live close to the source tree instead of using Python-style `test_*.py` files.

Current locations:

- `src/tests/unit`: Vitest unit tests for scoring, validation, preprocessing, API clients, security helpers, and prompt generation
- `src/tests/integration`: Vitest integration tests for the analysis pipeline with mocked external APIs
- `src/tests/e2e`: Playwright browser tests for the main analysis flow on desktop and mobile projects

Commands:

```bash
npm run test
npm run test:coverage
npm run test:e2e
```

Coverage is configured in `vitest.config.ts` and focuses on reusable application logic under `src/lib` and `src/config`.
