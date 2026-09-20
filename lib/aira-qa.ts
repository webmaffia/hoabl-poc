import { BuyerProfile, Pocket, PocketPreferenceTag, Project } from "./types";
import { rankPockets, explainPocketMatch } from "./recommendation";
import { formatLakh } from "./utils";

/**
 * Everything Aira needs to answer an open-ended question in context, rather
 * than just matching it against a fixed list of nav commands. Sourced
 * straight from useJourney() by the caller — this module itself stays
 * framework-free so it's easy to unit-test and reuse from both voice and
 * typed chat.
 */
export interface QaContext {
  buyerProfile: BuyerProfile;
  selectedProject: Project;
  projectPockets: Pocket[];
  pocketPreferences: PocketPreferenceTag[];
  activePocketId: string | null;
}

function focusedPocket(ctx: QaContext): Pocket | undefined {
  const active = ctx.projectPockets.find((p) => p.id === ctx.activePocketId);
  if (active) return active;
  return rankPockets(ctx.projectPockets, ctx.buyerProfile, ctx.pocketPreferences)[0]?.pocket;
}

interface Topic {
  test: (heardLower: string) => boolean;
  answer: (ctx: QaContext) => string;
}

// Ordered most-specific-first — the first matching topic wins, so a broader
// pattern (e.g. "pocket") doesn't swallow a more specific one (e.g. "price").
const TOPICS: Topic[] = [
  {
    test: (t) => /\brefund|\btoken\b|reserve|hold my|lock in/.test(t),
    answer: () =>
      "The ₹45,000 token is fully refundable — it just reserves your chosen pocket at today's terms while you finish KYC, before you're handed off to a human advisor. Nothing about it is a final commitment.",
  },
  {
    test: (t) => /kyc|\bpan\b|aadhaar|selfie|document/.test(t),
    answer: () =>
      "KYC just needs your name, PAN, Aadhaar, mobile, email, and a quick selfie check. It's the standard verification every buyer goes through, and in this demo nothing is actually stored or submitted anywhere.",
  },
  {
    test: (t) => /price|cost|how much|budget|lakh|crore|₹/.test(t),
    answer: (ctx) => {
      const pocket = focusedPocket(ctx);
      if (pocket) {
        const budgetLine = ctx.buyerProfile.budgetLabel
          ? ` That fits inside the ${ctx.buyerProfile.budgetLabel} budget you told me about.`
          : "";
        return `${pocket.name} is priced at ${formatLakh(pocket.price)} for ${pocket.sizeSqft.toLocaleString()} sq.ft.${budgetLine}`;
      }
      const priceFact = ctx.selectedProject.verified.find((f) => /price/i.test(f.label));
      return `${ctx.selectedProject.name} starts around ${priceFact?.value ?? "the price shown on the project page"} — exact pocket-level pricing depends on which one you pick.`;
    },
  },
  {
    test: (t) => /location|where is|address|distance|how far|airport|connectiv/.test(t),
    answer: (ctx) => `${ctx.selectedProject.name} is located in ${ctx.selectedProject.location}. ${ctx.selectedProject.tagline}.`,
  },
  {
    test: (t) => /legal|rera|title|dispute|litigation|is (it|this) safe|trust|genuine|scam/.test(t),
    answer: (ctx) => {
      const confirmItem = ctx.selectedProject.needsConfirmation[0];
      return `Fair thing to check — RERA registration and title clearance are exactly the kind of thing I don't guess at, so I'd have your HoABL advisor confirm it directly.${
        confirmItem ? ` One item still open here: ${confirmItem}.` : ""
      }`;
    },
  },
  {
    test: (t) => /which pocket|best pocket|recommend|suggest.*pocket|what.*pocket/.test(t),
    answer: (ctx) => {
      const ranked = rankPockets(ctx.projectPockets, ctx.buyerProfile, ctx.pocketPreferences);
      const top = ranked[0];
      return top
        ? `I'd point you toward ${top.pocket.name} — it ${explainPocketMatch(top.pocket, ctx.buyerProfile, ctx.pocketPreferences)}.`
        : "Head over to the pocket map and I'll show you exactly what fits your profile best.";
    },
  },
  {
    test: (t) => /payment plan|instal?ment|emi|schedule/.test(t),
    answer: () =>
      "After the refundable token, the rest is paid in a structured instalment schedule — I'll lay out the exact numbers for your chosen pocket on the payment plan screen.",
  },
  {
    test: (t) => /advisor|human|real person|talk to (a |an )?(person|agent|someone)|call me/.test(t),
    answer: () =>
      "Of course — whenever you're ready, I'll hand you off to a HoABL advisor with everything we've already covered, so you won't have to repeat yourself.",
  },
];

const FALLBACK =
  "That's a good question, and I don't want to guess at it — I'll flag it so your HoABL advisor can give you a proper answer.";

/** Answers a free-form question using the buyer's live journey context, falling back gracefully when nothing matches. */
export function answerQuestion(heard: string, ctx: QaContext): string {
  const t = heard.toLowerCase();
  const topic = TOPICS.find((topic) => topic.test(t));
  return topic ? topic.answer(ctx) : FALLBACK;
}
