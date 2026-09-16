"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { VerifiedInfo, ConfirmWithHoabl } from "@/components/trust/trust-sections";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { PROJECT } from "@/lib/data";

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
      { label: "Location", value: PROJECT.location },
      { label: "Distance to NMIA", value: "~40 minutes" },
      { label: "Position", value: "Equidistant between Mumbai and Pune" },
    ],
    confirm: ["Exact road route and drive time in traffic", "Local infrastructure build-out timeline"],
  },
  {
    id: "connectivity",
    label: "Connectivity",
    caption: "Here's how the project links to the wider region today.",
    verified: [
      { label: "Airport", value: "Navi Mumbai International Airport — operational" },
      { label: "Regional standing", value: "#1 of 8 national micro-markets, per Colliers (as cited by HoABL)" },
    ],
    confirm: ["Upcoming highway/expressway specifics"],
  },
  {
    id: "development",
    label: "Development vision",
    caption: "This is the broader vision the developer has shared for the region.",
    verified: [
      { label: "Committed regional capital", value: "₹3,00,000 crore (as cited by HoABL)" },
      { label: "Developer", value: "House of Abhinandan Lodha Estate Holdings Pvt Ltd" },
    ],
    confirm: ["Master-plan phase-wise handover dates", "Future commercial zoning"],
  },
  {
    id: "amenities",
    label: "Amenities & pricing",
    caption: "Since amenities mattered to you, here's what's confirmed so far.",
    verified: [
      { label: "Plot size offered", value: "148 sq.m. (~1,600 sq.ft.)" },
      { label: "Starting price", value: "₹99.99 Lakh (all-in)" },
    ],
    confirm: ["Full on-site amenity list", "Maintenance charges post-handover"],
  },
  {
    id: "layout",
    label: "Land layout",
    caption: "Here's an illustrative pocket layout, to show how plots typically get organized — not this project's actual released plan.",
    verified: [
      { label: "Pockets shown", value: "4 illustrative pockets (demo layout)" },
      { label: "Plot sizes shown", value: "1,500 – 2,100 sq.ft. (demo layout)" },
    ],
    confirm: ["This project's actual plot-by-plot layout and pricing (unlocks after token + KYC)"],
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
      { label: "Booking process", value: "Browse and shortlist freely — refundable token + KYC once you've chosen a pocket" },
    ],
    confirm: ["RERA registration number", "Final legal documentation", "Possession timelines"],
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

  useVoiceCommands([
    { labels: ["next", "continue"], action: handleContinue },
    ...SECTIONS.map((s, i) => ({ labels: [s.label], action: () => setIdx(i) })),
  ]);

  return (
    <ScreenShell showStages={false} title="Project walkthrough">
      <div className="flex h-full flex-col px-5 pb-5 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Explore {PROJECT.name}</p>
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
