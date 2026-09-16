"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, PartyPopper, Landmark, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { POCKETS, getPocketById } from "@/lib/data";
import { rankPockets } from "@/lib/recommendation";
import { track } from "@/lib/analytics";
import { cn, formatINR, formatLakh, computeEmi } from "@/lib/utils";

const STEPS = ["KYC verification", "Payment processing", "Payment successful", "Pocket secured"];
const TOKEN_PAID = 45000;
const TENURES = [5, 10, 15];

export function Screen08AccessUnlocked() {
  const { next, dispatch, activePocketId, buyerProfile, pocketPreferences } = useJourney();
  const { speak } = useAira();
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [payingRemaining, setPayingRemaining] = useState(false);
  const [useEmi, setUseEmi] = useState(false);
  const [tenure, setTenure] = useState(10);
  const [remainingPaid, setRemainingPaid] = useState(false);

  const ranked = useMemo(() => rankPockets(POCKETS, buyerProfile, pocketPreferences), [buyerProfile, pocketPreferences]);
  const pocket = getPocketById(activePocketId || "") || ranked[0]?.pocket || POCKETS[0];
  const remaining = Math.max(pocket.price - TOKEN_PAID, 0);
  const emi = computeEmi(remaining, 9.5, tenure);

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
        speak("You're all set! Your pocket is secured — let's connect you with your advisor.");
      }, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStepIdx((i) => i + 1), 750);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  const payRemaining = () => {
    track("remaining_payment_completed", { method: useEmi ? "emi" : "full", tenure: useEmi ? tenure : undefined });
    setRemainingPaid(true);
  };

  useVoiceCommands(
    done
      ? remainingPaid
        ? [{ labels: ["continue", "next", "meet my advisor"], action: next }]
        : [
            { labels: ["talk to advisor", "advisor", "continue", "next"], action: next },
            { labels: ["pay remaining amount", "pay remaining", "pay now"], action: () => setPayingRemaining(true) },
          ]
      : []
  );

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
              Your chosen pocket is now secured.
            </p>

            <ul className="mt-5 space-y-2 text-left">
              {["KYC verified", "Payment successful", "Pocket secured"].map((s) => (
                <li key={s} className="flex items-center gap-2.5 rounded-xl border border-forest-900/8 bg-white px-3.5 py-2.5 text-sm font-medium text-forest-900 shadow-card">
                  <Check className="h-4 w-4 text-forest-800" /> {s}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[11px] text-forest-900/40">
              Demo transaction — no real payment processed.
            </p>

            <AnimatePresence mode="wait" initial={false}>
              {!payingRemaining ? (
                <motion.div key="choice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 space-y-2.5">
                  <Button variant="gold" size="lg" className="w-full" onClick={() => setPayingRemaining(true)}>
                    Pay remaining amount &rarr;
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={next}>
                    Talk to advisor instead
                  </Button>
                </motion.div>
              ) : !remainingPaid ? (
                <motion.div key="pay" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-left">
                  <div className="rounded-xl2 border border-forest-900/8 bg-white p-4 shadow-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-forest-900/45">
                        Remaining balance
                      </span>
                      <span className="font-serif text-lg text-forest-900">{formatINR(remaining)}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-forest-900/40">
                      {formatLakh(pocket.price)} total &middot; {formatINR(TOKEN_PAID)} token already paid
                    </p>

                    <div className="mt-3 flex rounded-full bg-forest-900/5 p-1">
                      <button
                        onClick={() => setUseEmi(false)}
                        className={cn(
                          "flex-1 rounded-full py-1.5 text-xs font-medium transition-colors",
                          !useEmi ? "bg-white text-forest-900 shadow-card" : "text-forest-900/45"
                        )}
                      >
                        Pay in full
                      </button>
                      <button
                        onClick={() => setUseEmi(true)}
                        className={cn(
                          "flex-1 rounded-full py-1.5 text-xs font-medium transition-colors",
                          useEmi ? "bg-white text-forest-900 shadow-card" : "text-forest-900/45"
                        )}
                      >
                        EMI via finance partner
                      </button>
                    </div>

                    {useEmi && (
                      <div className="mt-3">
                        <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-forest-800/5 px-2.5 py-2 text-[11px] font-medium text-forest-800">
                          <Landmark className="h-3.5 w-3.5" /> Finance partner (demo) &middot; 9.5% indicative rate
                        </div>
                        <div className="flex gap-1.5">
                          {TENURES.map((y) => (
                            <button
                              key={y}
                              onClick={() => setTenure(y)}
                              className={cn(
                                "flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors",
                                tenure === y
                                  ? "border-forest-800 bg-forest-800 text-ivory-100"
                                  : "border-forest-900/10 bg-white text-forest-900/70"
                              )}
                            >
                              {y} yrs
                            </button>
                          ))}
                        </div>
                        <div className="mt-2.5 flex items-center justify-between rounded-lg bg-forest-900/5 px-3 py-2.5">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-forest-900/70">
                            <Wallet className="h-3.5 w-3.5" /> Indicative EMI
                          </span>
                          <span className="font-serif text-lg text-forest-900">
                            {formatINR(emi)}
                            <span className="font-sans text-xs font-normal text-forest-900/50">/mo</span>
                          </span>
                        </div>
                        <p className="mt-1.5 text-[10px] text-forest-900/35">
                          Indicative only — not a loan approval or an offer. Rates vary by lender and profile.
                        </p>
                      </div>
                    )}
                  </div>

                  <Button size="lg" className="mt-3 w-full" onClick={payRemaining}>
                    {useEmi ? `Apply for EMI — ${formatINR(emi)}/mo →` : `Pay ${formatINR(remaining)} now →`}
                  </Button>
                  <button
                    onClick={() => setPayingRemaining(false)}
                    className="mx-auto mt-2 block text-xs font-medium text-forest-900/45 hover:text-forest-900"
                  >
                    Back
                  </button>
                </motion.div>
              ) : (
                <motion.div key="paid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-left">
                  <div className="flex items-center gap-2.5 rounded-xl border border-forest-800/15 bg-forest-800/5 px-3.5 py-3">
                    <Check className="h-4 w-4 shrink-0 text-forest-800" />
                    <p className="text-sm font-medium text-forest-900">
                      {useEmi ? "EMI application submitted." : "Remaining balance paid."} Your advisor will confirm next
                      steps.
                    </p>
                  </div>
                  <Button size="lg" className="mt-4 w-full" onClick={next}>
                    Meet your advisor &rarr;
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
