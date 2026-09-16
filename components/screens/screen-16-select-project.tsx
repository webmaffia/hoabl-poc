"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Sparkles } from "lucide-react";
import { ScreenShell } from "@/components/screen-shell";
import { LiveViewerBadge } from "@/components/urgency-badge";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { PROJECT, PROJECTS, PROJECT_STARTING_PRICE, projectDemand } from "@/lib/data";
import { track } from "@/lib/analytics";
import { cn, formatLakh } from "@/lib/utils";

type Filter = "all" | "recommended";

// One unified, browsable list built from real HoABL projects (same source
// as lib/data.ts's PROJECT/PROJECTS — names, locations and images sourced
// from hoabl.com). Every card continues the same interactive journey —
// Aero Estate's starting price is real (from hoabl.com), the other 5 are
// illustrative demo pricing (HoABL doesn't publish it), shown as such.
const LISTING = [
  {
    id: PROJECT.id,
    name: PROJECT.name,
    location: PROJECT.location,
    description: PROJECT.tagline,
    image: PROJECT.heroImage!,
    price: formatLakh(PROJECT_STARTING_PRICE[PROJECT.id]),
    illustrativePrice: false,
    recommended: true,
  },
  ...PROJECTS.map((p) => ({
    ...p,
    price: formatLakh(PROJECT_STARTING_PRICE[p.id]),
    illustrativePrice: true,
    recommended: false,
  })),
];

export function Screen16SelectProject() {
  const { selectProject: setSelectedProject, goTo } = useJourney();
  const { speak } = useAira();
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    speak(
      `Based on what you told me, ${PROJECT.name} looks like the strongest match — but feel free to explore any of these.`
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
    track("project_selected", { projectId: id });
    setSelectedProject(id);
    goTo("project-match");
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
                {p.illustrativePrice && (
                  <span className="absolute right-2 top-2 rounded-full bg-forest-950/70 px-2 py-0.5 text-[9px] font-medium text-ivory-100 backdrop-blur">
                    Demo pricing
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <p className="text-sm font-semibold text-forest-900">{p.name}</p>
                <p className="flex items-center gap-1 text-xs text-forest-900/50">
                  <MapPin className="h-3 w-3 shrink-0" /> {p.location}
                </p>
                <p className="mt-1.5 text-xs text-forest-900/60">{p.description}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gold-600">
                    From {p.price}
                    {p.illustrativePrice && <span className="ml-1 text-[10px] font-normal text-forest-900/35">(illustrative)</span>}
                  </p>
                  <DemandSignal projectId={p.id} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

// Prefers a real, honest scarcity signal (pockets already sold, from this
// project's own data) over a generic viewer count — falls back to the
// viewer badge only when there's nothing scarce to report yet.
function DemandSignal({ projectId }: { projectId: string }) {
  const demand = projectDemand(projectId);
  if (demand.sold > 0) {
    return (
      <span className="shrink-0 text-[10px] font-semibold text-red-500">
        {demand.sold}/{demand.total} pockets booked
      </span>
    );
  }
  return <LiveViewerBadge seed={projectId} className="shrink-0" />;
}
