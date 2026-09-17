"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScreenShell } from "@/components/screen-shell";
import { AiraVisual } from "@/components/aira-visual";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoice, useVoiceCommands } from "@/lib/voice-command-context";
import { questionWithOptions } from "@/lib/speech";
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

interface Message {
  id: string;
  from: "aira" | "user";
  text: string;
}

export function Screen02BuyerProfile() {
  const { next, dispatch, buyerProfile } = useJourney();
  const { speak } = useAira();
  const { supported: voiceSupported } = useVoice();
  const [stepIdx, setStepIdx] = useState(0);
  const [selection, setSelection] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const first = STEPS[0];
    const text = `${first.intro} ${first.question}`;
    setMessages([{ id: "aira-0", from: "aira", text }]);
    speak(
      `${first.intro} ${questionWithOptions(first.question, first.options.map((o) => o.label), first.multi)}`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

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

    const answerLabels = step.options.filter((o) => values.includes(o.value)).map((o) => o.label).join(", ");
    setMessages((prev) => [...prev, { id: `user-${stepIdx}`, from: "user", text: answerLabels }]);
    setSelection([]);

    if (isLast) {
      track("profile_completed");
      setTyping(true);
      setTimeout(() => {
        const closing = "Got it. Let me build your land-buying profile.";
        setMessages((prev) => [...prev, { id: "aira-final", from: "aira", text: closing }]);
        speak(closing);
        setTyping(false);
        setTimeout(next, 700);
      }, 700);
      return;
    }

    setTyping(true);
    setTimeout(() => {
      const nextStep = STEPS[stepIdx + 1];
      setMessages((prev) => [...prev, { id: `aira-${stepIdx + 1}`, from: "aira", text: nextStep.question }]);
      speak(questionWithOptions(nextStep.question, nextStep.options.map((o) => o.label), nextStep.multi));
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
    typing
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

  const progressPct = ((stepIdx + 1) / STEPS.length) * 100;

  return (
    <ScreenShell showStages={false} title="Your buyer profile">
      <div className="flex h-full flex-col px-5 pb-5 pt-4">
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-gold-400/20 bg-white/70 px-3.5 py-2.5 shadow-card backdrop-blur">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-gold-400/60">
            <AiraVisual className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-forest-900">Building your profile</span>
              <span className="shrink-0 text-[11px] font-semibold text-gold-600">
                {stepIdx + 1}/{STEPS.length}
              </span>
            </div>
            <Progress value={progressPct} className="mt-1.5" />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar pb-2">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug shadow-card",
                    m.from === "user"
                      ? "rounded-br-sm bg-gradient-to-br from-forest-700 to-forest-800 text-ivory-100"
                      : "rounded-bl-sm border border-gold-400/15 bg-white text-forest-900"
                  )}
                >
                  {m.text}
                </div>
              </motion.div>
            ))}
            {typing && (
              <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end justify-start gap-2">
                <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-gold-400/50">
                  <AiraVisual className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-gold-400/15 bg-white px-3.5 py-3 shadow-card">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-forest-900/40"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {!typing && (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2.5 pt-1"
          >
            <div className="grid grid-cols-2 gap-2.5">
              {step.options.map((opt) => {
                const selected = selection.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={cn(
                      "relative flex min-h-[52px] items-center rounded-2xl border-2 px-3.5 py-2.5 text-left text-[13.5px] font-medium leading-snug transition-all",
                      selected
                        ? "border-gold-500 bg-gold-500/10 text-forest-900 shadow-card"
                        : "border-forest-900/10 bg-white text-forest-900 hover:border-gold-400/40 hover:shadow-card"
                    )}
                  >
                    <span className="pr-5">{opt.label}</span>
                    <span
                      className={cn(
                        "absolute right-2.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border transition-colors",
                        selected ? "border-gold-500 bg-gold-500 text-white" : "border-forest-900/20 bg-white"
                      )}
                    >
                      {selected && <Check className="h-2.5 w-2.5" />}
                    </span>
                  </button>
                );
              })}
            </div>
            {voiceSupported && (
              <p className="text-center text-[11px] text-forest-900/35">
                Or tap &ldquo;Talk to Aira&rdquo; below and just say your answer
              </p>
            )}
            {step.multi && (
              <p className="text-xs text-forest-900/40">
                {selection.length}/{step.maxSelect} selected
              </p>
            )}
            <button
              onClick={handleContinue}
              disabled={selection.length === 0}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 py-3.5 text-[15px] font-semibold text-forest-950 shadow-elevated transition-opacity disabled:opacity-40"
            >
              {isLast ? "Build my profile" : "Send"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </div>
    </ScreenShell>
  );
}
