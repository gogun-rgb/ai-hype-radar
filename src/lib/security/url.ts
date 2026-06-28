const SAFE_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);

export function toSafeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return SAFE_EXTERNAL_PROTOCOLS.has(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
