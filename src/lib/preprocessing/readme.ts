import { compactText } from "@/lib/preprocessing/sanitize";
import type { ReadmeSignals } from "@/types/analysis";

const SECTION_PATTERNS = {
  installation: /\b(installation|install|setup|getting started|시작|설치)\b/i,
  usage: /\b(usage|quickstart|example|사용|실행)\b/i,
  requirements: /\b(requirements|prerequisites|dependencies|환경|요구)\b/i,
  license: /\b(license|licence|라이선스)\b/i,
  examples: /\b(examples|demo|showcase|sample|예제|데모)\b/i,
  troubleshooting: /\b(troubleshooting|faq|known issues|문제 해결|오류)\b/i
};

export function analyzeReadme(readme: string): ReadmeSignals {
  const cleaned = compactText(readme, 20_000);
  const sections = {
    installation: SECTION_PATTERNS.installation.test(cleaned),
    usage: SECTION_PATTERNS.usage.test(cleaned),
    requirements: SECTION_PATTERNS.requirements.test(cleaned),
    license: SECTION_PATTERNS.license.test(cleaned),
    examples: SECTION_PATTERNS.examples.test(cleaned),
    troubleshooting: SECTION_PATTERNS.troubleshooting.test(cleaned)
  };

  const matchedSections = Object.values(sections).filter(Boolean).length;
  const completenessScore = Math.round((matchedSections / Object.keys(sections).length) * 100);
  const claims = extractClaims(cleaned);
  const hasDemoSignals = /\b(demo|showcase|example|gallery|screenshot|video|live)\b/i.test(cleaned);
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;

  return {
    completenessScore,
    sections,
    claims,
    hasDemoSignals,
    wordCount
  };
}

export function extractClaims(readme: string, maxClaims = 5): string[] {
  const cleaned = compactText(readme, 6000);
  const candidateLines = cleaned
    .split(/\r?\n/)
    .map((line) => line.replace(/^#+\s*/, "").replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length >= 24 && line.length <= 180)
    .filter((line) =>
      /\b(auto|automatic|fast|easy|simple|production|secure|reliable|scale|real-time|agent|workflow|AI|LLM|자동|간단|빠른|보안|확장)\b/i.test(
        line
      )
    );

  return Array.from(new Set(candidateLines)).slice(0, maxClaims);
}
