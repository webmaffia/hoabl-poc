/**
 * Small, honest "sales engine" signals: demand indicators driven by real
 * pocket state (availability / plotsLeft), plus a lightweight simulated
 * "people viewing" counter for texture. All are clearly demo/illustrative —
 * see components/urgency-badge.tsx — and none block or gate any action.
 */

export function seedFromString(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function baseViewerCount(seed: string): number {
  return 2 + (seedFromString(seed) % 5); // 2–6
}
