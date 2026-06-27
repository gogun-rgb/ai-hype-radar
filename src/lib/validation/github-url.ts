import type { ParsedGitHubUrl } from "@/types/analysis";

const OWNER_REPO_PATTERN = /^[A-Za-z0-9_.-]+$/;

export function parseGitHubUrl(value: string): ParsedGitHubUrl {
  const raw = value.trim();

  if (!raw) {
    throw new Error("GitHub 저장소 URL을 입력해 주세요.");
  }

  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("올바른 GitHub 저장소 URL 형식이 아닙니다.");
  }

  if (url.hostname.toLowerCase() !== "github.com") {
    throw new Error("github.com 저장소 URL만 분석할 수 있습니다.");
  }

  const [owner, repo, ...rest] = url.pathname.split("/").filter(Boolean);
  if (!owner || !repo || rest.length > 0) {
    throw new Error("GitHub URL은 https://github.com/owner/repo 형식이어야 합니다.");
  }

  const repoWithoutSuffix = repo.replace(/\.git$/i, "");

  if (!OWNER_REPO_PATTERN.test(owner) || !OWNER_REPO_PATTERN.test(repoWithoutSuffix)) {
    throw new Error("저장소 owner 또는 repo 이름에 허용되지 않는 문자가 있습니다.");
  }

  return {
    owner,
    repo: repoWithoutSuffix,
    canonicalUrl: `https://github.com/${owner}/${repoWithoutSuffix}`
  };
}

export function isLikelyGitHubUrl(value: string): boolean {
  try {
    parseGitHubUrl(value);
    return true;
  } catch {
    return false;
  }
}
