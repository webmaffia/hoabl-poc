"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronLeft } from "lucide-react";
import { AiraVisual } from "@/components/aira-visual";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoice, useVoiceCommands } from "@/lib/voice-command-context";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { BuyerProfile } from "@/lib/types";

interface Option {
  value: string;
  label: string;
}

// Buyers often just say/type a number ("40", "40L", "40 lakh", "1.2 crore")
// instead of one of the exact option labels — the generic label matcher in
// voice-command-context can't handle that (no label to fuzzy-match against),
// so the budget step needs its own numeric parsing to bucket a free-form
// amount into the right option.
function parseBudgetLakhs(text: string): number | null {
  const t = text.toLowerCase().replace(/,/g, "");
  const numMatch = t.match(/[\d.]+/);
  if (!numMatch) return null;
  const raw = parseFloat(numMatch[0]);
  if (isNaN(raw)) return null;
  if (/cr|crore/.test(t)) return raw * 100;
  if (/\d\s*l\b|lakh|lac/.test(t)) return raw;
  // No unit given — a bare number this small is almost certainly meant in
  // lakhs ("40" -> ₹40L); a large one is rupees ("4000000" -> ₹40L).
  return raw >= 100000 ? raw / 100000 : raw;
}

function bucketBudget(lakhs: number): string {
  if (lakhs < 20) return "lt20";
  if (lakhs <= 35) return "20-35";
  if (lakhs <= 50) return "35-50";
  return "gt50";
}

// Boundary phrasing ("< ₹20L", "under 20", "above 50") takes priority over
// plain numeric bucketing — otherwise a boundary value like "20" would land
// one bucket off from what "< ₹20L" actually means.
function resolveBudgetBucket(text: string): string | null {
  const lakhs = parseBudgetLakhs(text);
  if (lakhs === null) return null;
  const t = text.toLowerCase();
  if (/<|under|below|less than|up ?to/.test(t)) return "lt20";
  if (/>|above|more than|over/.test(t)) return "gt50";
  return bucketBudget(lakhs);
}

interface Step {
  id: string;
  question: string;
  intro?: string;
  options: Option[];
  multi?: boolean;
  maxSelect?: number;
  apply: (profile: BuyerProfile, values: string[]) => Partial<BuyerProfile>;
}

const STEPS: Step[] = [
  {
    id: "purpose",
    intro: "Hi! I'm Aira 👋 Let's find the right land for you.",
    question: "What are you mainly buying the land for?",
    options: [
      { value: "investment", label: "Investment" },
      { value: "personal", label: "Personal use" },
      { value: "both", label: "Both" },
    ],
    apply: (_p, v) => ({ purpose: v[0] as BuyerProfile["purpose"] }),
  },
  {
    id: "budget",
    question: "What's your approximate budget?",
    options: [
      { value: "lt20", label: "< ₹20L" },
      { value: "20-35", label: "₹20L – ₹35L" },
      { value: "35-50", label: "₹35L – ₹50L" },
      { value: "gt50", label: "> ₹50L" },
    ],
    apply: (_p, v) => {
      const map: Record<string, [string, number, number]> = {
        lt20: ["Under ₹20L", 0, 2000000],
        "20-35": ["₹20L – ₹35L", 2000000, 3500000],
        "35-50": ["₹35L – ₹50L", 3500000, 5000000],
        gt50: ["Above ₹50L", 5000000, 10000000],
      };
      const [label, min, max] = map[v[0]];
      return { budgetLabel: label, budgetMin: min, budgetMax: max };
    },
  },
  {
    id: "expected",
    question: "What's the expected purpose of this land?",
    options: [
      { value: "wealth", label: "Long-term wealth creation" },
      { value: "income", label: "Future development / income" },
      { value: "home", label: "Personal use / second home" },
      { value: "unsure", label: "Not sure yet" },
    ],
    apply: (_p, v) => ({
      expectedPurpose:
        { wealth: "Long-term wealth creation", income: "Future development / income", home: "Personal use / second home", unsure: "Not sure yet" }[v[0]] || v[0],
    }),
  },
];

export function Screen02BuyerProfile() {
  const { next, back, dispatch, buyerProfile } = useJourney();
  const { speak, status } = useAira();
  const { supported: voiceSupported, setCallActive } = useVoice();
  const [stepIdx, setStepIdx] = useState(0);
  const [selection, setSelection] = useState<string[]>([]);
  const [bubbleText, setBubbleText] = useState("");
  const [typing, setTyping] = useState(false);
  const [ending, setEnding] = useState(false);
  const initialized = useRef(false);

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  // This screen presents Aira as a full-screen "video call" for the
  // duration of the 3 profiling questions — the small floating avatar
  // widget (see app/page.tsx) is redundant while she already fills the
  // whole frame, so it's hidden for as long as this screen is active.
  useEffect(() => {
    setCallActive(true);
    return () => setCallActive(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const first = STEPS[0];
    setBubbleText(`${first.intro} ${first.question}`);
    // Aira speaks just the question here — the options are already visible
    // as tappable chips right below, so reading them aloud too is redundant
    // and makes her opening line drag on.
    speak(`${first.intro} ${first.question}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleOption = (value: string) => {
    if (step.multi) {
      setSelection((prev) => {
        if (prev.includes(value)) return prev.filter((v) => v !== value);
        if (step.maxSelect && prev.length >= step.maxSelect) return prev;
        return [...prev, value];
      });
    } else {
      setSelection([value]);
    }
  };

  const submitAnswer = (values: string[]) => {
    if (values.length === 0) return;
    const patch = step.apply(buyerProfile, values);
    dispatch({ type: "UPDATE_PROFILE", patch });
    track("profile_question_answered", { question: step.id, answer: values });
    setSelection([]);

    if (isLast) {
      track("profile_completed");
      setTyping(true);
      setTimeout(() => {
        const closing = "Got it. Let me build your land-buying profile.";
        setBubbleText(closing);
        speak(closing);
        setTyping(false);
        // Give the closing line a beat to land, then dock Aira into the
        // small bottom-right widget — visible for a moment before the
        // screen transitions to the next step — before advancing.
        setTimeout(() => {
          setEnding(true);
          setCallActive(false);
        }, 900);
        setTimeout(next, 1500);
      }, 700);
      return;
    }

    setTyping(true);
    setTimeout(() => {
      const nextStep = STEPS[stepIdx + 1];
      setBubbleText(nextStep.question);
      speak(nextStep.question);
      setTyping(false);
      setStepIdx((i) => i + 1);
    }, 650);
  };

  const handleContinue = () => submitAnswer(selection);

  // Voice answers should feel like a real conversation — saying an option
  // both selects it and moves on, rather than requiring a separate tap.
  // For multi-select steps that means auto-advancing once the max number of
  // choices has been reached by voice (nothing more to pick at that point);
  // below the max, it still just selects, since the user may want to name
  // more than one option.
  const selectOptionByVoice = (value: string) => {
    if (!step.multi) {
      submitAnswer([value]);
      return;
    }
    setSelection((prev) => {
      let next = prev;
      if (prev.includes(value)) next = prev.filter((v) => v !== value);
      else if (!step.maxSelect || prev.length < step.maxSelect) next = [...prev, value];
      if (step.maxSelect && next.length >= step.maxSelect) {
        setTimeout(() => submitAnswer(next), 0);
      }
      return next;
    });
  };

  useVoiceCommands(
    typing || ending
      ? []
      : step.multi
      ? [
          ...step.options.map((o) => ({ labels: [o.label], action: () => selectOptionByVoice(o.value) })),
          {
            labels: ["done", "continue", "next", "send", "that's it", "submit"],
            action: () => submitAnswer(selection),
          },
        ]
      : step.id === "budget"
      ? [
          {
            labels: [],
            test: (heard: string) => parseBudgetLakhs(heard) !== null,
            action: (heard: string) => selectOptionByVoice(resolveBudgetBucket(heard)!),
          },
          ...step.options.map((o) => ({ labels: [o.label], action: () => selectOptionByVoice(o.value) })),
        ]
      : step.options.map((o) => ({ labels: [o.label], action: () => selectOptionByVoice(o.value) }))
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-forest-950">
      {/* Full-screen "video call" presentation — Aira fills the whole frame
          while she asks her 3 profiling questions, matching a real video
          call rather than a small avatar tucked into a chat header. */}
      <AnimatePresence>
        {!ending && (
          <motion.div
            key="call"
            initial={false}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.35, ease: "easeIn" }}
            className="absolute inset-0"
          >
            <AiraVisual className="absolute inset-0 h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-forest-950/80 via-transparent to-forest-950/85" />

            {/* Top bar */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
              <button
                type="button"
                onClick={back}
                aria-label="Back"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-950/50 text-ivory-100 backdrop-blur"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <div className="text-[15px] font-semibold text-ivory-50">Aira</div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-ivory-100/70">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      status === "live" ? "bg-emerald-400" : status === "connecting" ? "animate-pulse bg-gold-400" : "bg-ivory-100/40"
                    )}
                  />
                  {status === "live" ? "Live" : status === "connecting" ? "Connecting…" : "AI Land Advisor"}
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-forest-950/50 px-2.5 py-1.5 text-[11px] font-semibold text-gold-300 backdrop-blur">
                {stepIdx + 1}/{STEPS.length}
              </div>
            </div>

            {/* Bottom question + options overlay */}
            <div className="absolute inset-x-0 bottom-24 flex flex-col gap-3 px-4">
              <AnimatePresence mode="wait">
                {typing ? (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm bg-forest-950/70 px-4 py-3.5 backdrop-blur"
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-ivory-100/70"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key={bubbleText}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="max-w-[88%] rounded-2xl rounded-bl-sm bg-forest-950/70 px-4 py-3 text-[14px] leading-snug text-ivory-50 shadow-elevated backdrop-blur"
                  >
                    {bubbleText}
                  </motion.div>
                )}
              </AnimatePresence>

              {!typing && (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2.5"
                >
                  <div className="flex flex-wrap gap-2">
                    {step.options.map((opt) => {
                      const selected = selection.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => toggleOption(opt.value)}
                          className={cn(
                            "relative flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-[13.5px] font-medium leading-snug backdrop-blur transition-all",
                            selected
                              ? "border-gold-400 bg-gold-500/90 text-forest-950 shadow-elevated"
                              : "border-ivory-100/25 bg-forest-950/50 text-ivory-50 hover:border-gold-400/50"
                          )}
                        >
                          {selected && <Check className="h-3 w-3" />}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {voiceSupported && (
                    <p className="text-[11px] text-ivory-100/60">
                      Or tap &ldquo;Talk to Aira&rdquo; below and just say your answer
                    </p>
                  )}
                  {step.multi && (
                    <p className="text-xs text-ivory-100/50">
                      {selection.length}/{step.maxSelect} selected
                    </p>
                  )}
                  <button
                    onClick={handleContinue}
                    disabled={selection.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 py-3.5 text-[15px] font-semibold text-forest-950 shadow-elevated transition-opacity disabled:opacity-40"
                  >
                    {isLast ? "Build my profile" : "Continue"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
