const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function cacheGet<T>(key: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(`ole_${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(`ole_${key}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, data: T): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(`ole_${key}`, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}
