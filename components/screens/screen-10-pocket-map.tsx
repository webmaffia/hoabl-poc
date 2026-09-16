"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ScreenShell } from "@/components/screen-shell";
import { ScarcityBadge } from "@/components/urgency-badge";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { POCKETS } from "@/lib/data";
import { rankPockets, suitabilityTier } from "@/lib/recommendation";
import { track } from "@/lib/analytics";
import { cn, formatLakh } from "@/lib/utils";

type Tab = "matches" | "all" | "infra";

const TIER_COLOR: Record<string, string> = {
  Recommended: "bg-forest-700 ring-forest-700",
  "Good fit": "bg-gold-500 ring-gold-500",
  Alternative: "bg-forest-900/40 ring-forest-900/40",
};

export function Screen10PocketMap() {
  const { buyerProfile, pocketPreferences, dispatch, goTo } = useJourney();
  const { speak } = useAira();
  const [tab, setTab] = useState<Tab>("matches");

  const ranked = useMemo(
    () => rankPockets(POCKETS, buyerProfile, pocketPreferences),
    [buyerProfile, pocketPreferences]
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
  const visible = tab === "matches" ? ranked.filter((r) => topIds.includes(r.pocket.id)) : ranked;

  const handleSelect = (id: string) => {
    dispatch({ type: "SET_ACTIVE_POCKET", id });
    dispatch({ type: "VIEW_POCKET", id });
    track("pocket_viewed", { pocketId: id });
    goTo("pocket-detail");
  };

  useVoiceCommands(
    POCKETS.filter((p) => p.availability !== "sold").map((p) => ({
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
              ["infra", "Infrastructure"],
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

        <div className="relative mt-4 h-56 shrink-0 overflow-hidden rounded-xl2 border border-forest-900/8 bg-gradient-to-br from-ivory-200 to-ivory-300">
          {tab === "infra" && (
            <>
              <div className="absolute left-0 top-[8%] h-1 w-full bg-forest-800/25" />
              <div className="absolute left-[48%] top-0 h-full w-1 bg-forest-800/15" />
              <span className="absolute left-1 top-[10%] text-[9px] text-forest-900/40">Main road</span>
            </>
          )}
          {POCKETS.map((pocket) => {
            const score = ranked.find((r) => r.pocket.id === pocket.id)?.score ?? 0;
            const tier = suitabilityTier(score);
            const isVisible = visible.some((r) => r.pocket.id === pocket.id);
            const isSold = pocket.availability === "sold";
            return (
              <motion.button
                key={pocket.id}
                onClick={() => handleSelect(pocket.id)}
                disabled={!isVisible}
                whileTap={{ scale: 0.92 }}
                style={{ left: `${pocket.coordinates.x}%`, top: `${pocket.coordinates.y}%` }}
                className={cn(
                  "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-opacity",
                  !isVisible && "opacity-25"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow ring-2 ring-white",
                    isSold ? "bg-red-400" : TIER_COLOR[tier]
                  )}
                >
                  {pocket.name.split(" ")[1]}
                </span>
                <span className="mt-0.5 rounded bg-white/90 px-1 text-[9px] font-medium text-forest-900">
                  {isSold ? "Sold" : formatLakh(pocket.price)}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-forest-900/60">
          <LegendDot color="bg-forest-700" label="Recommended" />
          <LegendDot color="bg-gold-500" label="Good fit" />
          <LegendDot color="bg-forest-900/40" label="Alternative" />
          <LegendDot color="bg-red-400" label="Not available" />
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
                  pocket.availability === "sold" ? "bg-red-400" : TIER_COLOR[suitabilityTier(score)]
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
