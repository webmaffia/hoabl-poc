"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  MapPin,
  Signpost,
  Building2,
  Sparkles,
  LayoutGrid,
  PuzzleIcon,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { VerifiedInfo, ConfirmWithHoabl } from "@/components/trust/trust-sections";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { PROJECT } from "@/lib/data";
import { Project } from "@/lib/types";

type Accent = "forest" | "gold";

interface Section {
  id: string;
  label: string;
  caption: string;
  icon: React.ElementType;
  accent: Accent;
  verified: { label: string; value: string }[];
  confirm: string[];
}

const ACCENT_CLASSES: Record<Accent, { chip: string; icon: string; ring: string }> = {
  forest: { chip: "bg-forest-800/10 text-forest-800", icon: "bg-forest-800 text-ivory-50", ring: "border-forest-800/15" },
  gold: { chip: "bg-gold-500/15 text-gold-600", icon: "bg-gold-500 text-forest-950", ring: "border-gold-500/25" },
};

// Aero Estate is the only project with real, sourced facts beyond starting
// price — its specific figures (NMIA distance, developer entity, etc.) only
// show up when it's the one selected; other projects fall back to what's
// actually known for them (just the illustrative starting price) rather
// than borrowing Aero Estate's facts.
function buildSections(project: Project): Section[] {
  const isFeatured = project.id === PROJECT.id;
  return [
    {
      id: "location",
      label: "Location",
      icon: MapPin,
      accent: "forest",
      caption: "Your priority was accessibility, so let's start with how the project connects to the surrounding area.",
      verified: [
        { label: "Location", value: project.location },
        ...(isFeatured
          ? [
              { label: "Distance to NMIA", value: "~40 minutes" },
              { label: "Position", value: "Equidistant between Mumbai and Pune" },
            ]
          : []),
      ],
      confirm: ["Exact road route and drive time in traffic", "Local infrastructure build-out timeline"],
    },
    {
      id: "connectivity",
      label: "Connectivity",
      icon: Signpost,
      accent: "gold",
      caption: "Here's how the project links to the wider region today.",
      verified: isFeatured
        ? [
            { label: "Airport", value: "Navi Mumbai International Airport — operational" },
            { label: "Regional standing", value: "#1 of 8 national micro-markets, per Colliers (as cited by HoABL)" },
          ]
        : [],
      confirm: isFeatured ? ["Upcoming highway/expressway specifics"] : ["Regional connectivity specifics"],
    },
    {
      id: "development",
      label: "Development",
      icon: Building2,
      accent: "forest",
      caption: "This is the broader vision the developer has shared for the region.",
      verified: [
        ...(isFeatured ? [{ label: "Committed regional capital", value: "₹3,00,000 crore (as cited by HoABL)" }] : []),
        { label: "Developer", value: "House of Abhinandan Lodha Estate Holdings Pvt Ltd" },
      ],
      confirm: ["Master-plan phase-wise handover dates", "Future commercial zoning"],
    },
    {
      id: "amenities",
      label: "Amenities",
      icon: Sparkles,
      accent: "gold",
      caption: "Since amenities mattered to you, here's what's confirmed so far.",
      verified: project.verified,
      confirm: ["Full on-site amenity list", "Maintenance charges post-handover"],
    },
    {
      id: "layout",
      label: "Land layout",
      icon: LayoutGrid,
      accent: "forest",
      caption: "Here's an illustrative pocket layout, to show how plots typically get organized — not this project's actual released plan.",
      verified: [
        { label: "Pockets shown", value: "8 illustrative pockets (demo layout)" },
        { label: "Plot sizes shown", value: "1,500 – 2,100 sq.ft. (demo layout)" },
      ],
      confirm: ["This project's actual plot-by-plot layout and pricing (unlocks after token + KYC)"],
    },
    {
      id: "pocket-logic",
      label: "Pocket logic",
      icon: PuzzleIcon,
      accent: "gold",
      caption: "Each pocket balances access, privacy, view and price differently — there's no single 'best' pocket, only the best fit for you.",
      verified: [{ label: "Pocket criteria", value: "Road access, privacy, amenity proximity, view, price" }],
      confirm: ["Final pocket-wise release schedule"],
    },
    {
      id: "consider",
      label: "Consider",
      icon: ShieldCheck,
      accent: "forest",
      caption: "A few things worth knowing before you go further.",
      verified: [
        { label: "Booking process", value: "Browse and shortlist freely — refundable token + KYC once you've chosen a pocket" },
      ],
      confirm: project.needsConfirmation,
    },
  ];
}

export function Screen05ProjectWalkthrough() {
  const { next, selectedProject } = useJourney();
  const { speak } = useAira();
  const [idx, setIdx] = useState(0);
  const sections = useMemo(() => buildSections(selectedProject), [selectedProject]);
  const section = sections[idx];
  const isLast = idx === sections.length - 1;
  const accent = ACCENT_CLASSES[section.accent];

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
    ...sections.map((s, i) => ({ labels: [s.label], action: () => setIdx(i) })),
  ]);

  return (
    <ScreenShell showStages={false} title="Project walkthrough">
      <div className="flex h-full flex-col px-5 pb-5 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Explore {selectedProject.name}</p>
        <h1 className="mt-0.5 font-serif text-2xl text-forest-900">with Aira</h1>

        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIdx(i)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                i === idx
                  ? "border-forest-800 bg-forest-800 text-ivory-100"
                  : i < idx
                  ? "border-forest-800/30 bg-forest-800/8 text-forest-800"
                  : "border-forest-900/10 bg-white text-forest-900/50"
              )}
            >
              {i < idx ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
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
              <div className={cn("flex items-start gap-3 rounded-xl2 border bg-white p-3.5 shadow-card", accent.ring)}>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", accent.icon)}>
                  <section.icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className={cn("mb-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", accent.chip)}>
                    {section.label}
                  </p>
                  <p className="text-sm text-forest-900/75">{section.caption}</p>
                </div>
              </div>

              {section.id === "location" && (
                <>
                  {selectedProject.heroImage && (
                    <div className="relative h-32 overflow-hidden rounded-xl2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedProject.heroImage} alt={selectedProject.name} className="h-full w-full object-cover" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-xs text-ivory-100 backdrop-blur">
                        <MapPin className="h-3 w-3" /> {selectedProject.location}
                      </div>
                    </div>
                  )}
                  <div className="overflow-hidden rounded-xl2 border border-forest-900/8 shadow-card">
                    <iframe
                      title={`${selectedProject.name} location map`}
                      src={`https://www.google.com/maps?q=${encodeURIComponent(selectedProject.location)}&output=embed`}
                      className="h-40 w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <p className="text-[11px] text-forest-900/40">
                    Map centered on the stated location — verify exact plot boundaries with your HoABL advisor.
                  </p>
                </>
              )}

              {section.id === "layout" && <ProjectMapPreview />}

              <VerifiedInfo items={section.verified} />
              <ConfirmWithHoabl items={section.confirm} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-forest-900/40">
          <span>{idx + 1} / {sections.length} explored</span>
        </div>
        <Button size="lg" className="mt-2 w-full" onClick={handleContinue}>
          {isLast ? "Find your pocket →" : "Next"}
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
