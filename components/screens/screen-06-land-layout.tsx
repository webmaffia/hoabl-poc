"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Check, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { POCKETS } from "@/lib/data";
import { track } from "@/lib/analytics";

const POCKET_ZONES = [
  { name: "North Pocket", cls: "left-[12%] top-[10%] w-[38%] h-[34%] bg-forest-600/70" },
  { name: "Central Park", cls: "left-[34%] top-[38%] w-[34%] h-[30%] bg-gold-500/60" },
  { name: "East Pocket", cls: "left-[62%] top-[16%] w-[32%] h-[46%] bg-forest-700/70" },
  { name: "West Pocket", cls: "left-[4%] top-[46%] w-[28%] h-[44%] bg-forest-500/70" },
];

const UNLOCKS = [
  "Detailed land layout",
  "Exact plot information",
  "Available plots",
  "Pocket-level analysis",
  "Shortlisting",
  "Compare pockets",
  "Aira's profile-based guidance",
];

export function Screen06LandLayout() {
  const { next } = useJourney();
  const { speak } = useAira();
  const limitedCount = POCKETS.filter((p) => p.availability === "limited").length;
  const soldCount = POCKETS.filter((p) => p.availability === "sold").length;

  useEffect(() => {
    speak("Here's the full layout. A few pockets are moving faster than others — I'll flag those as we go.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const proceed = () => {
    track("land_layout_previewed");
    next();
  };

  useVoiceCommands([{ labels: ["unlock", "continue", "next", "unlock detailed selection"], action: proceed }]);

  return (
    <ScreenShell showStages={false} title="Land layout">
      <div className="flex h-full flex-col px-5 pb-5 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">See what you&rsquo;ll unlock</p>
        <h1 className="mt-0.5 font-serif text-2xl text-forest-900">Land Layout &amp; Preview</h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mt-4 h-52 overflow-hidden rounded-xl2 bg-ivory-200 border border-forest-900/8"
        >
          {POCKET_ZONES.map((z) => (
            <div
              key={z.name}
              className={`absolute rounded-lg ${z.cls} flex items-center justify-center p-1 text-center`}
            >
              <span className="text-[10px] font-semibold leading-tight text-white drop-shadow">{z.name}</span>
            </div>
          ))}
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-forest-900/80 px-2 py-1 text-[10px] font-medium text-ivory-100">
            <Lock className="h-2.5 w-2.5" /> Plot-level view locked
          </div>
        </motion.div>

        <div className="mt-4 flex-1 overflow-y-auto no-scrollbar">
          {(limitedCount > 0 || soldCount > 0) && (
            <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-gold-500/25 bg-gold-50 px-3.5 py-2.5 text-xs font-medium text-gold-700">
              <Flame className="h-3.5 w-3.5" />
              {soldCount > 0 && `${soldCount} pocket${soldCount > 1 ? "s" : ""} already sold out. `}
              {limitedCount > 0 && `${limitedCount} pocket${limitedCount > 1 ? "s" : ""} at limited availability.`}
            </div>
          )}
          <div className="rounded-xl border border-forest-900/8 bg-white p-3.5 shadow-card">
            <p className="text-sm text-forest-900/75">
              Detailed plot selection unlocks after the refundable token + KYC.
            </p>
          </div>

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-forest-900/40">
            What you&rsquo;ll get
          </p>
          <ul className="space-y-2">
            {UNLOCKS.map((u) => (
              <li key={u} className="flex items-center gap-2.5 rounded-xl border border-forest-900/8 bg-white px-3.5 py-2.5 text-sm text-forest-900/85 shadow-card">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-800/10 text-forest-800">
                  <Check className="h-3 w-3" />
                </span>
                {u}
              </li>
            ))}
          </ul>
        </div>

        <Button size="lg" className="mt-4 w-full" onClick={proceed}>
          Unlock detailed selection &rarr;
        </Button>
      </div>
    </ScreenShell>
  );
}
