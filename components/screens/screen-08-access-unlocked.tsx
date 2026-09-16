"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const STEPS = ["KYC verification", "Payment processing", "Payment successful", "Access unlocked"];

export function Screen08AccessUnlocked() {
  const { next, dispatch } = useJourney();
  const { speak } = useAira();
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    speak("Verifying your KYC and processing the token payment — just a moment.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stepIdx >= STEPS.length - 1) {
      const t = setTimeout(() => {
        dispatch({ type: "SET_PAYMENT", status: "completed" });
        track("token_payment_completed");
        track("access_unlocked");
        setDone(true);
        speak("You're all set! Your detailed land selection is unlocked — let's find your pocket.");
      }, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStepIdx((i) => i + 1), 750);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  useVoiceCommands(done ? [{ labels: ["continue", "next", "find my pocket"], action: next }] : []);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-ivory-100 px-6 text-center">
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="processing" exit={{ opacity: 0 }} className="w-full max-w-xs">
            <div className="mb-8 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-800/8">
                <Loader2 className="h-7 w-7 animate-spin text-forest-800" />
              </div>
            </div>
            <ul className="space-y-3 text-left">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                      i < stepIdx
                        ? "bg-forest-800 text-white"
                        : i === stepIdx
                        ? "bg-gold-400 text-white"
                        : "bg-forest-900/8 text-forest-900/30"
                    )}
                  >
                    {i < stepIdx ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      i <= stepIdx ? "font-medium text-forest-900" : "text-forest-900/35"
                    )}
                  >
                    {s}
                    {i === stepIdx && <span className="animate-pulse">&hellip;</span>}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="w-full max-w-xs"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500 text-white shadow-elevated">
              <PartyPopper className="h-7 w-7" />
            </div>
            <h1 className="font-serif text-2xl text-forest-900">You&rsquo;re all set!</h1>
            <p className="mt-2 text-sm text-forest-900/60">
              Your detailed land selection is now unlocked.
            </p>

            <ul className="mt-5 space-y-2 text-left">
              {["KYC verified", "Payment successful", "Full project access unlocked"].map((s) => (
                <li key={s} className="flex items-center gap-2.5 rounded-xl border border-forest-900/8 bg-white px-3.5 py-2.5 text-sm font-medium text-forest-900 shadow-card">
                  <Check className="h-4 w-4 text-forest-800" /> {s}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[11px] text-forest-900/40">
              Demo transaction — no real payment processed.
            </p>

            <Button size="lg" className="mt-6 w-full" onClick={next}>
              Find my pocket &rarr;
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
