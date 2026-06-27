import { compactText } from "@/lib/preprocessing/sanitize";

export interface DedupeCandidate {
  id: string | number;
  title: string;
  body: string;
}

export function fingerprint(candidate: DedupeCandidate): string {
  const normalized = `${candidate.title} ${compactText(candidate.body, 300)}`
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim();

  return normalized.slice(0, 240);
}

export function dedupeByContent<T extends DedupeCandidate>(items: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const item of items) {
    const key = fingerprint(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
  }

  return unique;
}
