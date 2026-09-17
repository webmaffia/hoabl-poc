import { BuyerProfile, Project } from "./types";
import { PROJECT, PROJECTS, PROJECT_STARTING_PRICE, getProjectById, getProjectPockets, projectDemand } from "./data";
import { scorePocket } from "./recommendation";

/**
 * Deterministic "profile suitability" scoring for whole projects — the
 * project-level counterpart to scorePocket in lib/recommendation.ts. This is
 * NOT a financial prediction, return estimate, or appreciation forecast; it
 * is a transparent weighted match between a project's real, known
 * attributes and the buyer's stated preferences, always surfaced to the
 * user as "profile suitability".
 */

const ALL_PROJECT_IDS = [PROJECT.id, ...PROJECTS.map((p) => p.id)];

export function calculateProjectMatch(profile: BuyerProfile, project: Project): number {
  let score = 20; // baseline

  // Budget fit against the project's known starting price (up to 30).
  const startingPrice = PROJECT_STARTING_PRICE[project.id];
  if (startingPrice != null && profile.budgetMin != null && profile.budgetMax != null) {
    if (startingPrice >= profile.budgetMin && startingPrice <= profile.budgetMax) {
      score += 30;
    } else {
      const distance =
        startingPrice < profile.budgetMin ? profile.budgetMin - startingPrice : startingPrice - profile.budgetMax;
      const range = profile.budgetMax - profile.budgetMin || 1;
      score += Math.max(0, 30 - (distance / range) * 30);
    }
  } else {
    score += 15;
  }

  // Stated location preference (up to 20).
  if (profile.location) {
    if (profile.location.toLowerCase().includes("open")) {
      score += 12; // neutral — no specific project named
    } else if (profile.location.toLowerCase().includes(project.name.toLowerCase().split(" ")[0])) {
      score += 20;
    } else {
      score += 4;
    }
  } else {
    score += 10;
  }

  // Best-fitting pocket this project actually has for the buyer's plot
  // preference and budget (up to 30) — reuses the same honest per-pocket
  // scoring used later in the journey, just previewed early.
  const pockets = getProjectPockets(project.id);
  const bestPocketScore = pockets.length
    ? Math.max(...pockets.map((p) => scorePocket(p, profile, [])))
    : 50;
  score += (bestPocketScore / 100) * 30;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export interface ProjectMatchResult {
  project: Project;
  score: number;
}

export function rankProjects(profile: BuyerProfile): ProjectMatchResult[] {
  return ALL_PROJECT_IDS.map((id) => {
    const project = getProjectById(id);
    return { project, score: calculateProjectMatch(profile, project) };
  }).sort((a, b) => b.score - a.score);
}

export function topProjectMatch(profile: BuyerProfile): ProjectMatchResult {
  return rankProjects(profile)[0];
}

// Re-exported for callers that just need a quick demand signal alongside a score.
export { projectDemand };
