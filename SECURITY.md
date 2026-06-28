# Security Policy

## Supported Versions

AI Hype Radar is an early portfolio project. Security fixes are applied to the `main` branch.

## Reporting a Vulnerability

Please report suspected vulnerabilities privately to the repository owner before opening a public issue.

If private contact is not available, open a GitHub issue with a minimal description and avoid posting secrets, tokens, private repository URLs, or exploit details.

## Scope and Limitations

AI Hype Radar performs lightweight static and heuristic analysis of public project signals. It does not prove that a repository is secure, bug-free, actively maintained, or safe to run in production.

The app is designed so that:

- API keys are read from environment variables only.
- OpenAI, Reddit, and Supabase integrations are optional.
- Missing third-party credentials should degrade to rule-based analysis or Demo Mode.
- User-visible evidence links are restricted to `http` and `https` protocols.
- README and issue text is summarized and sanitized before being used in prompts.

Known limitations:

- GitHub and Reddit data can be incomplete, stale, rate-limited, or unavailable.
- LLM-generated explanations, when enabled, are supplemental and must not be treated as authoritative security findings.
- Local file persistence is intended for local development and demo use, not multi-user production hosting.
