import { BuyerProfile, Pocket, PocketPreferenceTag } from "./types";
import { listToSpeech } from "./speech";

/**
 * Deterministic "profile suitability" scoring.
 * This is NOT a financial prediction — it is a transparent weighted match
 * between a pocket's attributes and the buyer's stated preferences.
 */

const PREFERENCE_WEIGHT = 8; // each selected preference tag contributes up to this many points

function preferenceContribution(pocket: Pocket, tag: PocketPreferenceTag): number {
  switch (tag) {
    case "road_access":
      return (pocket.roadAccess / 100) * PREFERENCE_WEIGHT;
    case "corner_plot":
      return pocket.description.toLowerCase().includes("corner") ? PREFERENCE_WEIGHT : PREFERENCE_WEIGHT * 0.3;
    case "larger_plot":
      return Math.min(pocket.sizeSqft / 2100, 1) * PREFERENCE_WEIGHT;
    case "near_amenity":
      return (pocket.amenityProximity / 100) * PREFERENCE_WEIGHT;
    case "better_view":
      return (pocket.view / 100) * PREFERENCE_WEIGHT;
    case "more_privacy":
      return (pocket.privacy / 100) * PREFERENCE_WEIGHT;
    case "investment_potential":
      return ((pocket.roadAccess + pocket.amenityProximity) / 200) * PREFERENCE_WEIGHT;
    case "lower_entry_price":
      return (pocket.entryPriceScore / 100) * PREFERENCE_WEIGHT;
    default:
      return 0;
  }
}

export function scorePocket(pocket: Pocket, profile: BuyerProfile, preferences: PocketPreferenceTag[]): number {
  let score = 40; // baseline

  // Budget fit (up to 20)
  if (profile.budgetMin != null && profile.budgetMax != null) {
    if (pocket.price >= profile.budgetMin && pocket.price <= profile.budgetMax) {
      score += 20;
    } else {
      const distance = pocket.price < profile.budgetMin
        ? profile.budgetMin - pocket.price
        : pocket.price - profile.budgetMax;
      const range = profile.budgetMax - profile.budgetMin || 1;
      score += Math.max(0, 20 - (distance / range) * 20);
    }
  } else {
    score += 10;
  }

  // Plot preference fit (up to 12)
  if (profile.plotPreference === "corner" && pocket.description.toLowerCase().includes("corner")) score += 12;
  else if (profile.plotPreference === "larger" && pocket.sizeSqft >= 1900) score += 12;
  else if (profile.plotPreference === "interior" && pocket.privacy >= 70) score += 12;
  else score += 4;

  // Selected preference tags (up to preferences.length * 8, normalized)
  const prefTotal = preferences.reduce((sum, tag) => sum + preferenceContribution(pocket, tag), 0);
  score += prefTotal;

  // Availability penalty
  if (pocket.availability === "sold") score -= 40;
  if (pocket.availability === "limited") score -= 4;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function rankPockets(pockets: Pocket[], profile: BuyerProfile, preferences: PocketPreferenceTag[]) {
  return pockets
    .map((pocket) => ({ pocket, score: scorePocket(pocket, profile, preferences) }))
    .sort((a, b) => b.score - a.score);
}

export function suitabilityTier(score: number): "Recommended" | "Good fit" | "Alternative" {
  if (score >= 80) return "Recommended";
  if (score >= 60) return "Good fit";
  return "Alternative";
}

const PREFERENCE_LABELS: Record<PocketPreferenceTag, string> = {
  road_access: "road access",
  corner_plot: "having a corner plot",
  larger_plot: "plot size",
  near_amenity: "amenity proximity",
  better_view: "the view",
  more_privacy: "privacy",
  investment_potential: "investment potential",
  lower_entry_price: "the lowest entry price",
};

/**
 * Turns a pocket's score into a plain-language reason it was suggested —
 * tying the recommendation back to the buyer's own budget and stated
 * preferences, rather than presenting the ranking as an unexplained number.
 */
export function explainPocketMatch(pocket: Pocket, profile: BuyerProfile, preferences: PocketPreferenceTag[]): string {
  const reasons: string[] = [];

  if (profile.budgetMin != null && profile.budgetMax != null && pocket.price >= profile.budgetMin && pocket.price <= profile.budgetMax) {
    reasons.push(`sits right inside your ${profile.budgetLabel ? profile.budgetLabel.toLowerCase() : "stated"} budget`);
  }

  const strongTags = preferences
    .map((tag) => ({ tag, contribution: preferenceContribution(pocket, tag) }))
    .filter((r) => r.contribution >= PREFERENCE_WEIGHT * 0.55)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 2)
    .map((r) => PREFERENCE_LABELS[r.tag]);

  if (strongTags.length) {
    reasons.push(`leads on ${listToSpeech(strongTags)} — exactly what you told me mattered most`);
  }

  if (!reasons.length) reasons.push("gives the best all-round balance for your profile");

  return reasons.join(" and ");
}
