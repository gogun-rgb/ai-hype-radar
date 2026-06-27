const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{20,}/g,
  /ghp_[A-Za-z0-9_]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /(api[_-]?key\s*[:=]\s*)[A-Za-z0-9._-]{12,}/gi
];

export function maskSecrets(text: string): string {
  return SECRET_PATTERNS.reduce((current, pattern) => current.replace(pattern, "$1[MASKED_SECRET]"), text);
}

export function stripMarkdownNoise(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, (block) => {
      const firstLine = block.split(/\r?\n/)[0] ?? "```";
      return `${firstLine}\n[긴 코드 블록 생략]\n\`\`\``;
    })
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "[이미지 생략]")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<details>[\s\S]*?<\/details>/gi, "[세부 로그 생략]")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\r/g, "")
    .trim();
}

export function compactText(text: string, maxChars = 1800): string {
  const cleaned = maskSecrets(stripMarkdownNoise(text)).replace(/\n{3,}/g, "\n\n").trim();

  if (cleaned.length <= maxChars) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxChars)}\n\n[길이 제한으로 이후 내용 생략]`;
}

export function tokenizeForSearch(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s/-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}
