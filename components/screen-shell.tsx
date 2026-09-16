"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import { useJourney, SCREEN_ORDER, ScreenId } from "@/lib/journey-context";
import { cn } from "@/lib/utils";
import { HOABL_LOGO_URL } from "@/lib/brand";

const STAGES: { label: string; screens: ScreenId[] }[] = [
  {
    label: "Understanding",
    screens: ["welcome", "buyer-profile", "profile-summary", "select-project", "project-match", "project-walkthrough", "land-layout"],
  },
  {
    label: "Selection",
    screens: ["pocket-finder", "pocket-map", "pocket-detail", "compare-pockets"],
  },
  { label: "Decision", screens: ["decision-confidence", "identity-capture", "token-kyc", "access-unlocked"] },
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
    <div className="relative flex h-full flex-col overflow-hidden bg-ivory-100">
      {/* Land-themed decoration (topographic contour lines — on-brand for a
          land advisor, more distinctive than a generic dot grid) layered
          with brand-color glows, a diagonal gold accent, and a huge, barely
          visible "HoABL" wordmark watermark. All decorative (aria-hidden),
          sits behind everything. */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 z-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <pattern id="hoablContours" width="130" height="130" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
            <path d="M-10 18 Q22 -4 55 18 T120 18 T185 18" fill="none" stroke="#151519" strokeOpacity="0.045" strokeWidth="1.4" />
            <path d="M-10 55 Q22 33 55 55 T120 55 T185 55" fill="none" stroke="#AC8336" strokeOpacity="0.09" strokeWidth="1.4" />
            <path d="M-10 92 Q22 70 55 92 T120 92 T185 92" fill="none" stroke="#151519" strokeOpacity="0.045" strokeWidth="1.4" />
            <path d="M-10 122 Q22 100 55 122 T120 122 T185 122" fill="none" stroke="#AC8336" strokeOpacity="0.06" strokeWidth="1.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hoablContours)" />
      </svg>

      <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 z-0 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 z-0 h-72 w-72 rounded-full bg-forest-700/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute right-2 top-1/3 z-0 h-40 w-40 rounded-full bg-gold-500/10 blur-2xl" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-8 z-0 h-16 w-72 rotate-[-18deg] bg-gradient-to-r from-transparent via-gold-400/20 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-12 z-0 select-none whitespace-nowrap font-serif text-[120px] font-bold leading-none text-forest-900/[0.035]"
        style={{ transform: "rotate(-8deg)" }}
      >
        HoABL
      </div>

      <div className="relative z-10 flex items-center justify-start bg-forest-900 px-4 py-3 shadow-card">
        {/* The real hoabl.com wordmark is white ink, so it needs a dark
            ground behind it — a full-width plum strip, matching how HoABL
            presents this logo on their own site, rather than inverting it
            to black. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HOABL_LOGO_URL} alt="The House of Abhinandan Lodha" className="h-6 w-auto" />
      </div>

      <div className="relative z-10 flex items-center gap-2 border-b border-forest-900/8 bg-ivory-50/80 px-4 pb-2.5 pt-3 backdrop-blur-sm">
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
      <div className="no-scrollbar relative z-10 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
