"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Check, PhoneCall, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { track } from "@/lib/analytics";

export function Screen14AdvisorHandoff() {
  const { advisorContext } = useJourney();
  const { speak } = useAira();

  useEffect(() => {
    speak("You're in great hands from here. I've shared everything we've covered with your advisor.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectAdvisor = () => {
    track("advisor_handoff_clicked", { context: advisorContext });
  };

  useVoiceCommands([{ labels: ["connect", "connect me to an advisor", "yes", "talk to advisor"], action: connectAdvisor }]);

  const items = [
    { label: "Buyer profile", done: Boolean(advisorContext.buyerProfile.purpose) },
    { label: "Project viewed", done: Boolean(advisorContext.projectViewed) },
    { label: "Pockets viewed & shortlisted", done: advisorContext.pocketsViewed.length > 0 },
    { label: "KYC verified", done: advisorContext.kycStatus === "verified" },
    { label: "Token payment completed", done: advisorContext.tokenPaymentStatus === "completed" },
  ];

  return (
    <ScreenShell showStages title="Advisor handoff">
      <div className="flex h-full flex-col overflow-y-auto no-scrollbar px-5 pb-6 pt-6 text-center">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif text-2xl text-forest-900">Talk to my HoABL advisor</h1>
          <p className="mt-2 text-sm text-forest-900/60">
            We&rsquo;ll connect you with a sales advisor who already has your complete context.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 rounded-xl2 border border-forest-900/8 bg-white p-4 text-left shadow-card"
        >
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-forest-900/40">
            Your shared context
          </p>
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.label} className="flex items-center gap-2.5 text-sm text-forest-900/80">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-800/10 text-forest-800">
                  <Check className="h-3 w-3" />
                </span>
                {it.label}
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="mt-4 rounded-xl border border-gold-500/25 bg-gold-50 p-3 text-sm text-gold-700">
          No need to repeat everything. Your advisor is already up to speed.
        </div>

        <div className="mt-auto space-y-3 pt-6">
          <Button size="lg" className="w-full" onClick={connectAdvisor}>
            <PhoneCall className="h-4 w-4" /> Connect me to an advisor &rarr;
          </Button>
          <button className="mx-auto flex items-center gap-1.5 text-sm font-medium text-forest-900/55 hover:text-forest-900">
            <CalendarClock className="h-3.5 w-3.5" /> Schedule a call instead
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}
