"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import { useJourney, SCREEN_ORDER, ScreenId } from "@/lib/journey-context";
import { cn } from "@/lib/utils";

const STAGES: { label: string; screens: ScreenId[] }[] = [
  {
    label: "Understanding",
    screens: ["welcome", "buyer-profile", "profile-summary", "project-match", "project-walkthrough", "land-layout"],
  },
  {
    label: "Selection",
    screens: ["token-kyc", "access-unlocked", "pocket-finder", "pocket-map", "pocket-detail", "compare-pockets"],
  },
  { label: "Decision", screens: ["decision-confidence"] },
  { label: "Advisor", screens: ["advisor-handoff"] },
];

export function ScreenShell({
  children,
  showBack = true,
  showStages = true,
  title,
}: {
  children: React.ReactNode;
  showBack?: boolean;
  showStages?: boolean;
  title?: string;
}) {
  const { currentScreen, back, screenIndex } = useJourney();
  const stageIdx = STAGES.findIndex((s) => s.screens.includes(currentScreen));

  return (
    <div className="flex h-full flex-col bg-ivory-100">
      <div className="flex items-center gap-2 border-b border-forest-900/8 bg-ivory-50 px-4 pb-2.5 pt-3">
        {showBack && screenIndex > 0 ? (
          <button
            onClick={back}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-forest-900/60 hover:bg-forest-900/5"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <div className="w-7" />
        )}
        {showStages && (
          <div className="flex flex-1 items-center gap-1.5">
            {STAGES.map((stage, i) => (
              <div key={stage.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "h-1 w-full rounded-full",
                    i < stageIdx ? "bg-gold-500" : i === stageIdx ? "bg-gold-400" : "bg-forest-900/10"
                  )}
                />
                <span
                  className={cn(
                    "text-[9px] font-medium uppercase tracking-wide",
                    i === stageIdx ? "text-forest-900" : "text-forest-900/30"
                  )}
                >
                  {stage.label}
                </span>
              </div>
            ))}
          </div>
        )}
        {!showStages && title && (
          <span className="flex-1 text-center text-sm font-semibold text-forest-900">{title}</span>
        )}
        {!showStages && !title && <div className="flex-1" />}
        <div className="w-7" />
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
