/**
 * HeyGen LiveAvatar integration helper.
 *
 * Set HEYGEN_API_KEY and HEYGEN_AVATAR_ID (server-only — no NEXT_PUBLIC
 * prefix, so neither ships to the browser) in .env.local to enable a live
 * LiveAvatar streaming session for Aira. See .env.local.example for where
 * to get each value.
 *
 * If either is missing, `fetchHeygenToken()` resolves to null and the app
 * automatically falls back to a local/demo avatar presentation — the app
 * never breaks without HeyGen credentials.
 */

/**
 * Client-side call to our own /api/heygen/token route, which holds the real
 * secret key + avatar id server-side and exchanges them for a short-lived
 * LiveAvatar session token. Returns null (never throws) when HeyGen isn't
 * configured or reachable, so callers can fall back cleanly.
 */
export async function fetchHeygenToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/heygen/token", { method: "POST" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.token ?? null;
  } catch {
    return null;
  }
}
