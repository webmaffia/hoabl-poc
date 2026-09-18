"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Compass, MousePointerClick, Minus, Plus } from "lucide-react";
import { ScreenShell } from "@/components/screen-shell";
import { ScarcityBadge } from "@/components/urgency-badge";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { rankPockets, suitabilityTier } from "@/lib/recommendation";
import { track } from "@/lib/analytics";
import { cn, formatLakh } from "@/lib/utils";

type Tab = "matches" | "all";
type Budget = "all" | "lt20" | "20-35" | "35-50" | "gt50";

const BUDGETS: { value: Budget; label: string; test: (price: number) => boolean }[] = [
  { value: "all", label: "Any budget", test: () => true },
  { value: "lt20", label: "Up to ₹20L", test: (p) => p <= 2000000 },
  { value: "20-35", label: "₹20L–₹35L", test: (p) => p > 2000000 && p <= 3500000 },
  { value: "35-50", label: "₹35L–₹50L", test: (p) => p > 3500000 && p <= 5000000 },
  { value: "gt50", label: "Above ₹50L", test: (p) => p > 5000000 },
];

const TIER_COLOR: Record<string, string> = {
  Recommended: "bg-forest-700 ring-forest-700",
  "Good fit": "bg-gold-500 ring-gold-500",
  Alternative: "bg-forest-900/40 ring-forest-900/40",
};

const TIER_TILE: Record<string, string> = {
  Recommended: "border-forest-900 bg-forest-700 text-ivory-50",
  "Good fit": "border-gold-600 bg-gold-500 text-forest-950",
  Alternative: "border-forest-900/30 bg-forest-900/40 text-ivory-50",
};

// Aerial land photo, used as the map's backdrop instead of a flat gradient.
// Local asset — saved at public/pocket-map-bg.png.
const MAP_BACKGROUND_URL = "/pocket-map-bg.png";

export function Screen10PocketMap() {
  const { buyerProfile, pocketPreferences, dispatch, goTo, projectPockets } = useJourney();
  const { speak } = useAira();
  const [tab, setTab] = useState<Tab>("matches");
  const [budget, setBudget] = useState<Budget>("all");
  const budgetTest = BUDGETS.find((b) => b.value === budget)!.test;

  const ranked = useMemo(
    () => rankPockets(projectPockets, buyerProfile, pocketPreferences),
    [projectPockets, buyerProfile, pocketPreferences]
  );

  useEffect(() => {
    const top = ranked[0]?.pocket;
    speak(
      top
        ? `Based on your preferences, ${top.name} and a couple of others look like strong matches. Tap any pocket to see the details.`
        : "Here's the full map — tap any pocket to see the details."
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topIds = ranked.slice(0, 3).map((r) => r.pocket.id);
  const visible = (tab === "matches" ? ranked.filter((r) => topIds.includes(r.pocket.id)) : ranked).filter((r) =>
    budgetTest(r.pocket.price)
  );

  const handleSelect = (id: string) => {
    dispatch({ type: "SET_ACTIVE_POCKET", id });
    dispatch({ type: "VIEW_POCKET", id });
    track("pocket_viewed", { pocketId: id });
    goTo("pocket-detail");
  };

  useVoiceCommands(
    projectPockets.filter((p) => p.availability !== "sold").map((p) => ({
      labels: [p.name],
      action: () => handleSelect(p.id),
    }))
  );

  return (
    <ScreenShell showStages={false} title="Pocket map">
      <div className="flex h-full flex-col px-5 pb-5 pt-4">
        <div className="flex gap-1.5 rounded-full bg-forest-900/5 p-1">
          {(
            [
              ["matches", "My matches"],
              ["all", "All pockets"],
            ] as [Tab, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={cn(
                "flex-1 rounded-full py-1.5 text-xs font-medium transition-colors",
                tab === value ? "bg-white text-forest-900 shadow-card" : "text-forest-900/45"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
          {BUDGETS.map((b) => (
            <button
              key={b.value}
              onClick={() => setBudget(b.value)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                budget === b.value
                  ? "border-forest-800 bg-forest-800 text-ivory-100"
                  : "border-forest-900/10 bg-white text-forest-900/60"
              )}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-forest-900/60">
          <MousePointerClick className="h-3.5 w-3.5 text-gold-500" />
          Select your pocket &mdash; tap a tile on the map below
        </div>

        <div className="relative mt-2 shrink-0 overflow-hidden rounded-xl2 border border-forest-900/10 p-3 shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MAP_BACKGROUND_URL} alt="" className="absolute inset-0 h-full w-full object-cover" />

          <div className="relative mb-2 flex items-center justify-between">
            <span className="rounded bg-forest-950/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ivory-100 backdrop-blur-sm">
              30 ft road
            </span>
            <div className="flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-md border border-forest-900/15 bg-white/90 text-forest-900/50">
                <Compass className="h-3 w-3" />
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-md border border-forest-900/15 bg-white/90 text-forest-900/50">
                <Plus className="h-3 w-3" />
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-md border border-forest-900/15 bg-white/90 text-forest-900/50">
                <Minus className="h-3 w-3" />
              </span>
            </div>
          </div>

          <div className="relative grid grid-cols-4 gap-2">
            {projectPockets.map((pocket) => {
              const score = ranked.find((r) => r.pocket.id === pocket.id)?.score ?? 0;
              const tier = suitabilityTier(score);
              const isVisible = visible.some((r) => r.pocket.id === pocket.id);
              const isSold = pocket.availability === "sold";
              return (
                <motion.button
                  key={pocket.id}
                  onClick={() => handleSelect(pocket.id)}
                  disabled={!isVisible}
                  whileTap={{ scale: 0.94 }}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border-2 transition-opacity",
                    !isVisible && "opacity-30",
                    isSold ? "border-red-600 bg-red-500 text-white" : TIER_TILE[tier]
                  )}
                >
                  <span className="text-[12px] font-bold">{pocket.name.split(" ")[1]}</span>
                  <span className="text-[10px] font-semibold opacity-90">{isSold ? "Sold" : formatLakh(pocket.price)}</span>
                </motion.button>
              );
            })}
          </div>

          <p className="relative mt-2 text-center">
            <span className="rounded bg-forest-950/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ivory-100 backdrop-blur-sm">
              30 ft road
            </span>
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-forest-900/60">
          <LegendDot color="bg-forest-700" label="Recommended" />
          <LegendDot color="bg-gold-500" label="Good fit" />
          <LegendDot color="bg-forest-900/40" label="Alternative" />
          <LegendDot color="bg-red-500" label="Not available" />
        </div>

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto no-scrollbar pb-2">
          {visible.map(({ pocket, score }) => (
            <button
              key={pocket.id}
              onClick={() => handleSelect(pocket.id)}
              className="flex w-full items-center justify-between rounded-xl border border-forest-900/8 bg-white px-3.5 py-3 text-left shadow-card"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-forest-900">{pocket.name}</p>
                  <ScarcityBadge pocket={pocket} />
                </div>
                <p className="text-xs text-forest-900/45">{pocket.zone} &middot; {formatLakh(pocket.price)} &middot; {pocket.sizeSqft} sq.ft.</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[10px] font-semibold text-white",
                  pocket.availability === "sold" ? "bg-red-500" : TIER_COLOR[suitabilityTier(score)]
                )}
              >
                {pocket.availability === "sold" ? "Sold" : `${score}/100`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-full", color)} /> {label}
    </span>
  );
}
