"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, Sparkles, ArrowRight } from "lucide-react";
import { ScreenShell } from "@/components/screen-shell";
import { LiveViewerBadge } from "@/components/urgency-badge";
import { Button } from "@/components/ui/button";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { PROJECT, PROJECTS, PROJECT_STARTING_PRICE, projectDemand } from "@/lib/data";
import { rankProjects } from "@/lib/project-match";
import { track } from "@/lib/analytics";
import { formatLakh } from "@/lib/utils";

// One unified, browsable list built from real HoABL projects (same source
// as lib/data.ts's PROJECT/PROJECTS — names, locations and images sourced
// from hoabl.com). Every card continues the same interactive journey —
// Aero Estate's starting price is real (from hoabl.com), the other 5 are
// illustrative demo pricing (HoABL doesn't publish it), shown as such.
const BASE_LISTING = [
  {
    id: PROJECT.id,
    name: PROJECT.name,
    location: PROJECT.location,
    description: PROJECT.tagline,
    image: PROJECT.heroImage!,
    price: formatLakh(PROJECT_STARTING_PRICE[PROJECT.id]),
    illustrativePrice: false,
  },
  ...PROJECTS.map((p) => ({
    ...p,
    price: formatLakh(PROJECT_STARTING_PRICE[p.id]),
    illustrativePrice: true,
  })),
];

export function Screen16SelectProject() {
  const { selectProject: setSelectedProject, goTo, buyerProfile } = useJourney();
  const { speak } = useAira();

  // Recommendation and score come from the same matching engine that just
  // ran on the AI-processing screen, not a hardcoded "always Aero Estate".
  const ranked = useMemo(() => rankProjects(buyerProfile), [buyerProfile]);
  const scoreById = useMemo(() => new Map(ranked.map((r) => [r.project.id, r.score])), [ranked]);
  const topId = ranked[0]?.project.id;

  const LISTING = useMemo(
    () =>
      BASE_LISTING.map((p) => ({ ...p, recommended: p.id === topId, score: scoreById.get(p.id) ?? 0 })).sort(
        (a, b) => b.score - a.score
      ),
    [topId, scoreById]
  );
  const featured = LISTING[0];
  const others = LISTING.slice(1);

  useEffect(() => {
    speak(
      `Based on what you told me, ${featured.name} looks like the strongest match — but feel free to explore any of these.`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectProject = (id: string) => {
    const item = LISTING.find((p) => p.id === id);
    if (!item) return;
    track("project_selected", { projectId: id });
    setSelectedProject(id);
    goTo("project-match");
  };

  useVoiceCommands(LISTING.map((p) => ({ labels: [p.name], action: () => selectProject(p.id) })));

  return (
    <ScreenShell showStages={false} title="Select a project">
      <div className="flex h-full flex-col overflow-y-auto no-scrollbar px-5 pb-5 pt-4">
        <h1 className="font-serif text-2xl leading-tight text-forest-900">Choose where to explore</h1>
        <p className="mt-1 text-sm text-forest-900/50">All real HoABL projects — Aira has one matched to your profile.</p>

        {/* Featured recommendation — deliberately much bigger than the rest */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => selectProject(featured.id)}
          className="mt-4 block w-full shrink-0 overflow-hidden rounded-2xl border-2 border-gold-500 bg-white text-left shadow-elevated"
        >
          <div className="relative h-44 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={featured.image} alt={featured.name} className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/15 to-transparent" />
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-gold-500 px-2.5 py-1 text-[11px] font-bold text-forest-950 shadow-card">
              <Sparkles className="h-3 w-3" /> Aira&rsquo;s top recommendation
            </span>
            {featured.illustrativePrice && (
              <span className="absolute right-3 top-3 rounded-full bg-forest-950/70 px-2 py-0.5 text-[9px] font-medium text-ivory-100 backdrop-blur">
                Demo pricing
              </span>
            )}
            <div className="absolute inset-x-3 bottom-3">
              <p className="font-serif text-2xl leading-tight text-ivory-50">{featured.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ivory-100/80">
                <MapPin className="h-3 w-3 shrink-0" /> {featured.location}
              </p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm text-forest-900/65">{featured.description}</p>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-forest-800/70">{featured.score}% profile fit</span>
              <DemandSignal projectId={featured.id} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-lg font-semibold text-gold-600">
                From {featured.price}
                {featured.illustrativePrice && (
                  <span className="ml-1 text-[11px] font-normal text-forest-900/35">(illustrative)</span>
                )}
              </p>
              <Button size="sm" className="shrink-0 gap-1">
                Explore <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </motion.button>

        {/* Everything else — compact list view, shown by default */}
        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-forest-900/40">
          Other projects
        </p>
        <div className="flex-1 space-y-2 pb-2">
          {others.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => selectProject(p.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-forest-900/8 bg-white p-2.5 text-left shadow-card"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-forest-900">{p.name}</p>
                <p className="flex items-center gap-1 truncate text-xs text-forest-900/50">
                  <MapPin className="h-3 w-3 shrink-0" /> {p.location}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gold-600">
                    From {p.price}
                    {p.illustrativePrice && <span className="ml-1 font-normal text-forest-900/35">(illustrative)</span>}
                  </p>
                  <span className="shrink-0 text-[10px] font-medium text-forest-800/60">{p.score}% fit</span>
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
