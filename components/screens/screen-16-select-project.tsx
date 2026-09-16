"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Sparkles } from "lucide-react";
import { ScreenShell } from "@/components/screen-shell";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { PROJECT, PROJECTS } from "@/lib/data";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Filter = "all" | "recommended";

// One unified, browsable list built from real HoABL projects (same source
// as lib/data.ts's PROJECT/PROJECTS — names, locations and images sourced
// from hoabl.com). Only the featured project (PROJECT / Aero Estate) has
// pocket-level data in this demo, so it's the only card that continues the
// interactive journey — the rest are real but browse-only here, and say so
// rather than pretending to go further than the demo actually supports.
const STARTING_PRICE = PROJECT.verified.find((v) => v.label === "Starting price")?.value;

const LISTING = [
  {
    id: PROJECT.id,
    name: PROJECT.name,
    location: PROJECT.location,
    description: PROJECT.tagline,
    image: PROJECT.heroImage!,
    price: STARTING_PRICE,
    recommended: true,
    interactive: true,
  },
  ...PROJECTS.map((p) => ({
    ...p,
    price: undefined as string | undefined,
    recommended: false,
    interactive: false,
  })),
];

export function Screen16SelectProject() {
  const { goTo } = useJourney();
  const { speak } = useAira();
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    speak(
      `Based on what you told me, ${PROJECT.name} looks like the strongest match — but feel free to browse the others too.`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(
    () => (filter === "recommended" ? LISTING.filter((p) => p.recommended) : LISTING),
    [filter]
  );

  const selectProject = (id: string) => {
    const item = LISTING.find((p) => p.id === id);
    if (!item) return;
    track("project_selected", { projectId: id, interactive: item.interactive });
    if (item.interactive) {
      goTo("project-match");
      return;
    }
    speak(
      `${item.name} is a real HoABL project, but this demo's interactive plot-level walkthrough is only built for ${PROJECT.name} — let's continue with that one.`
    );
  };

  useVoiceCommands([
    { labels: ["all", "show all"], action: () => setFilter("all") },
    { labels: ["recommended", "recommended for you"], action: () => setFilter("recommended") },
    ...LISTING.map((p) => ({ labels: [p.name], action: () => selectProject(p.id) })),
  ]);

  return (
    <ScreenShell showStages={false} title="Select a project">
      <div className="flex h-full flex-col px-5 pb-5 pt-4">
        <h1 className="font-serif text-2xl leading-tight text-forest-900">Choose where to explore</h1>
        <p className="mt-1 text-sm text-forest-900/50">All real HoABL projects — Aira has one matched to your profile.</p>

        <div className="mt-3 flex gap-1.5 rounded-full bg-forest-900/5 p-1">
          {(
            [
              ["all", "All projects"],
              ["recommended", "Recommended for you"],
            ] as [Filter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "flex-1 rounded-full py-1.5 text-xs font-medium transition-colors",
                filter === value ? "bg-white text-forest-900 shadow-card" : "text-forest-900/45"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex-1 space-y-3 overflow-y-auto no-scrollbar pb-2">
          {visible.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => selectProject(p.id)}
              className={cn(
                "block w-full overflow-hidden rounded-xl2 border bg-white text-left shadow-card transition-colors",
                p.recommended ? "border-gold-500/50" : "border-forest-900/8"
              )}
            >
              <div className="relative h-28 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950/60 via-transparent to-transparent" />
                {p.recommended && (
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-semibold text-forest-950">
                    <Sparkles className="h-2.5 w-2.5" /> Recommended
                  </span>
                )}
                {!p.interactive && (
                  <span className="absolute right-2 top-2 rounded-full bg-forest-950/70 px-2 py-0.5 text-[9px] font-medium text-ivory-100 backdrop-blur">
                    Browse only
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <p className="text-sm font-semibold text-forest-900">{p.name}</p>
                <p className="flex items-center gap-1 text-xs text-forest-900/50">
                  <MapPin className="h-3 w-3 shrink-0" /> {p.location}
                </p>
                <p className="mt-1.5 text-xs text-forest-900/60">{p.description}</p>
                <p className="mt-2 text-sm font-semibold text-gold-600">
                  {p.price ? `From ${p.price.replace(" (all-in)", "")}` : "Price on request"}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}
