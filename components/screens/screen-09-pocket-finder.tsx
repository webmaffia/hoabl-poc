"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Route,
  Square,
  Maximize2,
  Landmark,
  Eye,
  Lock,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { questionWithOptions } from "@/lib/speech";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { PocketPreferenceTag } from "@/lib/types";

const OPTIONS: { value: PocketPreferenceTag; label: string; icon: React.ElementType }[] = [
  { value: "road_access", label: "Easy road access", icon: Route },
  { value: "corner_plot", label: "Corner plot", icon: Square },
  { value: "larger_plot", label: "Larger plot", icon: Maximize2 },
  { value: "near_amenity", label: "Near amenity", icon: Landmark },
  { value: "better_view", label: "Better view", icon: Eye },
  { value: "more_privacy", label: "More privacy", icon: Lock },
  { value: "investment_potential", label: "Investment potential", icon: TrendingUp },
  { value: "lower_entry_price", label: "Lower entry price", icon: Wallet },
];

const MAX = 3;

export function Screen09PocketFinder() {
  const { next, dispatch } = useJourney();
  const { speak } = useAira();
  const [selected, setSelected] = useState<PocketPreferenceTag[]>([]);

  useEffect(() => {
    speak(
      `Let's find your ideal pocket. ${questionWithOptions(
        "What matters most to you in a plot?",
        OPTIONS.map((o) => o.label),
        true
      )}`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (value: PocketPreferenceTag) => {
    setSelected((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= MAX) return prev;
      return [...prev, value];
    });
  };

  const handleFind = () => {
    dispatch({ type: "SET_POCKET_PREFERENCES", prefs: selected });
    track("pocket_finder_started");
    track("pocket_preference_selected", { preferences: selected });
    next();
  };

  return (
    <ScreenShell showStages={false} title="Pocket finder">
      <div className="flex h-full flex-col px-5 pb-5 pt-5">
        <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-2xl leading-tight text-forest-900">
          What matters most to you in a plot?
        </motion.h1>
        <p className="mt-1 text-sm text-forest-900/50">Choose up to {MAX} options.</p>

        <div className="mt-5 grid flex-1 grid-cols-2 gap-2.5 overflow-y-auto no-scrollbar pb-2">
          {OPTIONS.map((opt) => {
            const active = selected.includes(opt.value);
            const disabled = !active && selected.length >= MAX;
            return (
              <button
                key={opt.value}
                disabled={disabled}
                onClick={() => toggle(opt.value)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-colors",
                  active
                    ? "border-forest-800 bg-forest-800 text-ivory-100"
                    : disabled
                    ? "border-forest-900/8 bg-forest-900/[0.02] text-forest-900/30"
                    : "border-forest-900/10 bg-white text-forest-900 hover:border-forest-800/40"
                )}
              >
                <opt.icon className={cn("h-4 w-4", active ? "text-gold-300" : "text-forest-800")} />
                <span className="text-[13px] font-medium leading-snug">{opt.label}</span>
              </button>
            );
          })}
        </div>

        <Button size="lg" className="mt-2 w-full" disabled={selected.length === 0} onClick={handleFind}>
          Find matching pockets &rarr;
        </Button>
      </div>
    </ScreenShell>
  );
}
