"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { VerifiedInfo, ConfirmWithHoabl } from "@/components/trust/trust-sections";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  label: string;
  caption: string;
  verified: { label: string; value: string }[];
  confirm: string[];
}

const SECTIONS: Section[] = [
  {
    id: "location",
    label: "Location",
    caption: "Your priority was accessibility, so let's start with how the project connects to the surrounding area.",
    verified: [
      { label: "Location", value: "Shamshabad, Hyderabad" },
      { label: "Distance to ORR", value: "~6 km (demo)" },
      { label: "Nearest airport", value: "~14 km (demo)" },
    ],
    confirm: ["Live traffic conditions", "Future road-widening plans"],
  },
  {
    id: "connectivity",
    label: "Connectivity",
    caption: "Here's how the project links to the wider road network today.",
    verified: [
      { label: "Main access road", value: "4-lane arterial (demo)" },
      { label: "Nearest highway junction", value: "~5 km (demo)" },
    ],
    confirm: ["Upcoming metro extension timelines"],
  },
  {
    id: "development",
    label: "Development vision",
    caption: "This is the broader vision the developer has shared for the corridor.",
    verified: [
      { label: "Master plan status", value: "Approved layout on file (demo)" },
      { label: "Phase", value: "Phase 1 of 3 (demo)" },
    ],
    confirm: ["Exact phase-wise handover dates", "Future commercial zoning"],
  },
  {
    id: "amenities",
    label: "Amenities & infrastructure",
    caption: "Since amenities mattered to you, here's what's planned nearby.",
    verified: [
      { label: "Planned central park", value: "6 acres (demo)" },
      { label: "Internal roads", value: "30–40 ft wide (demo)" },
      { label: "Utilities", value: "Underground power, water line planned (demo)" },
    ],
    confirm: ["Amenity construction timeline", "Maintenance charges post-handover"],
  },
  {
    id: "layout",
    label: "Land layout",
    caption: "The layout is organized into four pockets, each with a different character.",
    verified: [
      { label: "Total pockets", value: "4 (North, Central Park, East, West)" },
      { label: "Plot sizes", value: "1,200 – 3,000 sq.ft. (demo)" },
    ],
    confirm: ["Exact plot-by-plot pricing (unlocks after token + KYC)"],
  },
  {
    id: "pocket-logic",
    label: "Pocket logic",
    caption: "Each pocket balances access, privacy, view and price differently — there's no single 'best' pocket, only the best fit for you.",
    verified: [
      { label: "Pocket criteria", value: "Road access, privacy, amenity proximity, view, price" },
    ],
    confirm: ["Final pocket-wise release schedule"],
  },
  {
    id: "consider",
    label: "Things to consider",
    caption: "A few things worth knowing before you go further.",
    verified: [
      { label: "Booking process", value: "Refundable token + KYC before plot selection" },
    ],
    confirm: ["Applicable statutory charges", "Final legal documentation", "Possession timelines"],
  },
];

export function Screen05ProjectWalkthrough() {
  const { next } = useJourney();
  const { speak } = useAira();
  const [idx, setIdx] = useState(0);
  const section = SECTIONS[idx];
  const isLast = idx === SECTIONS.length - 1;

  useEffect(() => {
    speak(section.caption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id]);

  const handleContinue = () => {
    if (isLast) {
      track("project_walkthrough_completed");
      next();
      return;
    }
    setIdx((i) => i + 1);
  };

  return (
    <ScreenShell showStages={false} title="Project walkthrough">
      <div className="flex h-full flex-col px-5 pb-5 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Explore Project X</p>
        <h1 className="mt-0.5 font-serif text-2xl text-forest-900">with Aira</h1>

        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIdx(i)}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                i === idx
                  ? "border-forest-800 bg-forest-800 text-ivory-100"
                  : i < idx
                  ? "border-forest-800/30 bg-forest-800/8 text-forest-800"
                  : "border-forest-900/10 bg-white text-forest-900/50"
              )}
            >
              {i < idx && <Check className="h-2.5 w-2.5" />}
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex-1 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {section.id === "location" || section.id === "layout" ? (
                <ProjectMapPreview />
              ) : null}

              <VerifiedInfo items={section.verified} />
              <ConfirmWithHoabl items={section.confirm} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-forest-900/40">
          <span>{idx + 1} / {SECTIONS.length} explored</span>
        </div>
        <Button size="lg" className="mt-2 w-full" onClick={handleContinue}>
          {isLast ? "Continue to layout preview →" : "Next"}
        </Button>
      </div>
    </ScreenShell>
  );
}

function ProjectMapPreview() {
  return (
    <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-br from-forest-700 to-forest-900">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 13px, rgba(255,255,255,0.4) 14px), repeating-linear-gradient(90deg, transparent, transparent 13px, rgba(255,255,255,0.4) 14px)",
      }} />
      <div className="absolute bottom-2 left-2 rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-ivory-100 backdrop-blur">
        Illustrative layout — demo
      </div>
    </div>
  );
}
