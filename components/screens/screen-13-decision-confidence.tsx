"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Frown, Meh, Smile, PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { ScarcityBadge, LiveViewerBadge } from "@/components/urgency-badge";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { questionWithOptions } from "@/lib/speech";
import { rankPockets } from "@/lib/recommendation";
import { track } from "@/lib/analytics";
import { cn, formatLakh } from "@/lib/utils";
import { Concern, ConfidenceLevel } from "@/lib/types";

const CONFIDENCE_OPTIONS: { value: ConfidenceLevel; label: string; sub: string; icon: React.ElementType }[] = [
  { value: "unsure", label: "Still unsure", sub: "I have some doubts", icon: Frown },
  { value: "almost", label: "Almost there", sub: "Just a few questions", icon: Meh },
  { value: "confident", label: "Confident", sub: "I understand the trade-offs", icon: Smile },
  { value: "ready", label: "Ready", sub: "I'm prepared to proceed", icon: PartyPopper },
];

const CONCERN_OPTIONS: { value: Concern; label: string }[] = [
  { value: "price", label: "Price" },
  { value: "location", label: "Location" },
  { value: "development", label: "Development" },
  { value: "plot_choice", label: "Plot choice" },
  { value: "legal", label: "Legal / Documentation" },
  { value: "investment_potential", label: "Investment potential" },
  { value: "something_else", label: "Something else" },
];

const CONCERN_RESPONSES: Record<Concern, string> = {
  price: "That's a fair question. I can show you how this pocket compares on price to the alternatives — but the final applicable pricing should be confirmed with your HoABL advisor.",
  location: "Location details I've shown you are based on the project's published information. For anything beyond that, your HoABL advisor can walk you through it in more depth.",
  development: "Development timelines are one of the things I'd flag as 'confirm with HoABL' — I don't want to guess at dates that aren't finalized yet.",
  plot_choice: "If you're torn between pockets, the comparison view is the best place to look — I can also walk through the trade-offs again if that helps.",
  legal: "That's something you should confirm with your HoABL advisor — legal and documentation specifics aren't something I can verify for you.",
  investment_potential: "I can only speak to how a pocket matches your stated profile, not future value — that's not something I can predict. Happy to revisit the fit analysis though.",
  something_else: "Got it — your HoABL advisor will have full context on this conversation, so you won't need to explain from scratch.",
};

export function Screen13DecisionConfidence() {
  const { dispatch, next, buyerProfile, pocketPreferences, shortlistedPockets, comparedPockets, confidenceLevel, concerns, projectPockets } = useJourney();
  const { speak } = useAira();
  const [stage, setStage] = useState<"confidence" | "concerns" | "summary">("confidence");

  const ranked = useMemo(
    () => rankPockets(projectPockets, buyerProfile, pocketPreferences),
    [projectPockets, buyerProfile, pocketPreferences]
  );
  const top = ranked[0];
  const rejected = ranked.find((r) => shortlistedPockets.length ? !shortlistedPockets.includes(r.pocket.id) : r.pocket.id !== top?.pocket.id);

  useEffect(() => {
    speak(
      questionWithOptions(
        "How confident are you feeling about this choice?",
        CONFIDENCE_OPTIONS.map((o) => o.label)
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speakSummary = () => {
    const because = `It provides stronger accessibility, fits your budget, and aligns with your stated ${buyerProfile.horizon || "investment"} horizon.`;
    const tradeoff = `Your biggest trade-off: you're paying more for ${
      top && top.pocket.entryPriceScore < 60 ? "accessibility and location" : "plot characteristics"
    } rather than choosing the lowest-cost option.`;
    speak(
      `Here's your decision summary. You selected ${top?.pocket.name ?? "your top pocket"}. ${because} ${tradeoff} Before proceeding, please verify current plot availability, applicable documentation, and development timelines with your HoABL advisor.`
    );
  };

  const selectConfidence = (level: ConfidenceLevel) => {
    dispatch({ type: "SET_CONFIDENCE", level });
    track("confidence_selected", { level });
    setStage(level === "unsure" ? "concerns" : "summary");
    if (level === "unsure") {
      speak(questionWithOptions("What's stopping you?", CONCERN_OPTIONS.map((o) => o.label)));
    } else {
      track("decision_summary_viewed");
      speakSummary();
    }
  };

  const selectConcern = (c: Concern) => {
    dispatch({ type: "ADD_CONCERN", concern: c });
    track("concern_selected", { concern: c });
    speak(CONCERN_RESPONSES[c]);
  };

  const proceedToSummary = () => {
    if (concerns.length === 0) return;
    setStage("summary");
    track("decision_summary_viewed");
    speakSummary();
  };

  useVoiceCommands(
    stage === "confidence"
      ? CONFIDENCE_OPTIONS.map((o) => ({ labels: [o.label], action: () => selectConfidence(o.value) }))
      : stage === "concerns"
      ? [
          ...CONCERN_OPTIONS.map((o) => ({ labels: [o.label], action: () => selectConcern(o.value) })),
          { labels: ["done", "continue", "next", "that's it"], action: proceedToSummary },
        ]
      : [{ labels: ["continue", "next", "proceed", "secure with token and kyc"], action: next }]
  );

  return (
    <ScreenShell showStages title="Decision confidence">
      <div className="flex h-full flex-col overflow-y-auto no-scrollbar px-5 pb-5 pt-4">
        <AnimatePresence mode="wait">
          {stage === "confidence" && (
            <motion.div key="confidence" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-balance font-serif text-2xl leading-tight text-forest-900">
                How confident are you about this choice?
              </h1>
              <div className="mt-5 space-y-2.5">
                {CONFIDENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => selectConfidence(opt.value)}
                    className="flex w-full items-center gap-3 rounded-xl border border-forest-900/10 bg-white px-4 py-3.5 text-left shadow-card hover:border-forest-800/40"
                  >
                    <opt.icon className="h-5 w-5 text-forest-800" />
                    <div>
                      <p className="text-sm font-semibold text-forest-900">{opt.label}</p>
                      <p className="text-xs text-forest-900/45">{opt.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {stage === "concerns" && (
            <motion.div key="concerns" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <h1 className="font-serif text-xl text-forest-900">What&rsquo;s stopping you (if unsure)?</h1>
              <div className="mt-4 flex flex-wrap gap-2">
                {CONCERN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => selectConcern(opt.value)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-sm font-medium",
                      concerns.includes(opt.value)
                        ? "border-forest-800 bg-forest-800 text-ivory-100"
                        : "border-forest-900/10 bg-white text-forest-900/75"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {concerns.length > 0 && (
                <div className="mt-4 space-y-2">
                  {concerns.map((c) => (
                    <div key={c} className="rounded-xl2 border border-gold-500/25 bg-gold-50 p-3.5">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gold-600">
                        <Sparkles className="h-3 w-3" /> Aira
                      </div>
                      <p className="text-sm text-forest-900/80">{CONCERN_RESPONSES[c]}</p>
                    </div>
                  ))}
                </div>
              )}

              <Button
                size="lg"
                className="mt-5 w-full"
                disabled={concerns.length === 0}
                onClick={proceedToSummary}
              >
                See my decision summary &rarr;
              </Button>
            </motion.div>
          )}

          {stage === "summary" && (
            <motion.div key="summary" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">A clear, informed choice</p>
              <h1 className="mt-1 font-serif text-2xl text-forest-900">Your decision summary</h1>

              <div className="mt-4 rounded-xl2 border border-forest-900/8 bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-forest-900/40">You selected</p>
                  {top && <ScarcityBadge pocket={top.pocket} />}
                </div>
                <p className="mt-1 font-serif text-xl text-forest-900">{top?.pocket.name}</p>
                <p className="mt-1 text-sm text-forest-900/60">
                  {formatLakh(top?.pocket.price ?? 0)} &middot; {top?.pocket.sizeSqft.toLocaleString()} sq.ft.
                </p>
                {top && <LiveViewerBadge seed={top.pocket.id} className="mt-2" />}
              </div>

              <div className="mt-4 space-y-3 text-sm text-forest-900/80">
                <SummaryLine
                  label="Because"
                  text={`It provides stronger accessibility, fits your budget, and aligns with your stated ${buyerProfile.horizon || "investment"} horizon.`}
                />
                {rejected && (
                  <SummaryLine
                    label="You set aside"
                    text={`${rejected.pocket.name} — mainly due to weaker fit on ${rejected.pocket.roadAccess < 60 ? "accessibility" : "your stated priorities"}.`}
                  />
                )}
                <SummaryLine
                  label="Your biggest trade-off"
                  text={`You are paying more for ${top && top.pocket.entryPriceScore < 60 ? "accessibility and location" : "plot characteristics"} rather than choosing the lowest-cost option.`}
                  highlight
                />
                <SummaryLine
                  label="Before proceeding, please verify"
                  text="Current plot availability, applicable documentation, development timelines, and any project-specific conditions."
                />
              </div>

              <p className="mt-5 text-center text-xs text-forest-900/45">
                Pockets are matched to demand in real time — lock yours in now while it&rsquo;s available.
              </p>
              <Button size="lg" className="mt-2 w-full" onClick={next}>
                Get my plan &amp; secure this &rarr;
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScreenShell>
  );
}

function SummaryLine({ label, text, highlight }: { label: string; text: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-3.5", highlight ? "border-gold-500/30 bg-gold-50" : "border-forest-900/8 bg-white")}>
      <p className={cn("mb-1 text-xs font-semibold uppercase tracking-wide", highlight ? "text-gold-600" : "text-forest-900/40")}>
        {label}
      </p>
      <p className="text-forest-900/80">{text}</p>
    </div>
  );
}
