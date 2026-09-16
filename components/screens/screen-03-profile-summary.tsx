"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { track } from "@/lib/analytics";

const PRIORITY_LABELS: Record<string, string> = {
  accessibility: "Better accessibility",
  larger_plot: "Larger plot",
  corner_plot: "Corner plot",
  privacy: "Privacy",
  amenities: "Near amenities",
};

export function Screen03ProfileSummary() {
  const { buyerProfile, next, goTo } = useJourney();
  const { speak } = useAira();

  useEffect(() => {
    speak("Here's the profile I've built for you. Take a look, and let me know if anything needs a tweak.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const proceed = () => {
    track("project_recommended");
    next();
  };

  useVoiceCommands([
    { labels: ["continue", "next", "see my project match", "yes", "looks good"], action: proceed },
    { labels: ["edit", "edit my answers", "go back", "back"], action: () => goTo("buyer-profile") },
  ]);

  const rows = [
    { label: "Primary purpose", value: capitalize(buyerProfile.purpose) },
    { label: "Budget", value: buyerProfile.budgetLabel },
    { label: "Investment horizon", value: buyerProfile.horizon },
    { label: "Preferred location", value: buyerProfile.location },
    { label: "Plot preference", value: plotLabel(buyerProfile.plotPreference) },
    { label: "Risk comfort", value: capitalize(buyerProfile.riskComfort) },
    { label: "Expected purpose", value: buyerProfile.expectedPurpose },
    {
      label: "What matters most",
      value: buyerProfile.priorities.map((p) => PRIORITY_LABELS[p] || p).join(", ") || "—",
    },
  ];

  return (
    <ScreenShell showStages={false} title="Your profile">
      <div className="flex h-full flex-col px-5 pb-6 pt-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
            A quick summary
          </p>
          <h1 className="mt-1 font-serif text-[26px] leading-tight text-forest-900">
            Your Land-Buying Profile
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-5 flex-1 overflow-hidden rounded-xl2 border border-forest-900/8 bg-white shadow-card"
        >
          <ul className="divide-y divide-forest-900/6">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-sm text-forest-900/50">{row.label}</span>
                <span className="text-right text-[15px] font-medium text-forest-900">{row.value || "—"}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="mt-6 space-y-3">
          <Button size="lg" className="w-full" onClick={proceed}>
            Explore matched projects &rarr;
          </Button>
          <button
            onClick={() => goTo("buyer-profile")}
            className="mx-auto flex items-center gap-1.5 text-sm font-medium text-forest-900/60 hover:text-forest-900"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit my answers
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}

function capitalize(v: string | null) {
  if (!v) return null;
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function plotLabel(v: string | null) {
  const map: Record<string, string> = {
    corner: "Corner plot",
    larger: "Larger plot",
    interior: "Privacy / interior plot",
    standard: "No strong preference",
  };
  return v ? map[v] || v : null;
}
