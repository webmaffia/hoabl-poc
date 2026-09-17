"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { TrustBadge } from "@/components/trust/trust-badge";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { track } from "@/lib/analytics";
import { PROJECT, PROJECTS } from "@/lib/data";
import { topProjectMatch } from "@/lib/project-match";
import { cn } from "@/lib/utils";

// The full "why this fits you" breakdown now lives entirely in the
// walkthrough that follows this screen — repeating it here (as we used to,
// with a 5-card list) made two consecutive screens show the same project
// facts twice. This screen's job is just: confirm the pick, offer a quick
// out to switch, then move on.
const FIT_SUMMARY = "Budget, horizon, location and plot preferences all line up with what you told Aira.";

export function Screen04ProjectMatch() {
  const { next, selectedProject, selectProject, buyerProfile } = useJourney();
  const { speak } = useAira();
  const [showOthers, setShowOthers] = useState(false);
  const match = topProjectMatch(buyerProfile);
  const isRecommended = selectedProject.id === match.project.id;

  useEffect(() => {
    speak(
      isRecommended
        ? `Based on everything you told me, ${selectedProject.name} is the strongest match I found for your profile.`
        : `Here's ${selectedProject.name} — the project you picked.`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject.id]);

  const proceed = () => {
    track("project_walkthrough_started");
    next();
  };

  const switchProject = (id: string) => {
    selectProject(id);
    setShowOthers(false);
  };

  useVoiceCommands([
    { labels: ["explore", "continue", "next", "explore with aira", "yes"], action: proceed },
    { labels: ["see other projects", "other projects"], action: () => setShowOthers((v) => !v) },
  ]);

  return (
    <ScreenShell showStages={false} title="Project match">
      <div className="flex h-full flex-col px-5 pb-6 pt-5">
        <motion.div key={selectedProject.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
            {isRecommended ? "Aira recommends" : "You selected"}
          </p>
          <h1 className="mt-1 font-serif text-[30px] leading-tight text-forest-900">{selectedProject.name}</h1>
          {isRecommended && (
            <span className="mt-2 inline-block rounded-full bg-forest-800 px-3 py-1 text-xs font-semibold text-ivory-100">
              Best match for your profile
            </span>
          )}
        </motion.div>

        <motion.div
          key={`hero-${selectedProject.id}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative mt-4 h-36 overflow-hidden rounded-xl2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedProject.heroImage} alt={selectedProject.name} className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950/70 via-forest-950/10 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-xs text-ivory-100 backdrop-blur">
            <MapPin className="h-3 w-3" /> {selectedProject.location}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-5 flex items-start gap-3 rounded-xl2 border border-forest-900/8 bg-white p-4 shadow-card"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-600">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-forest-900">Why this fits you</h3>
              <TrustBadge kind="interpretation" />
            </div>
            <p className="text-sm text-forest-900/65">{FIT_SUMMARY}</p>
          </div>
        </motion.div>

        <div className="mt-4 flex-1" />

        <div className="mt-4 space-y-2.5">
          <Button size="lg" className="w-full" onClick={proceed}>
            Explore with Aira &rarr;
          </Button>
          <button
            onClick={() => setShowOthers((v) => !v)}
            className="mx-auto flex items-center gap-1 text-sm font-medium text-forest-900/50 hover:text-forest-900"
          >
            See other projects
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showOthers && "rotate-180")} />
          </button>

          <AnimatePresence initial={false}>
            {showOthers && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pb-1 pt-1">
                  {[{ id: PROJECT.id, name: PROJECT.name, location: PROJECT.location, image: PROJECT.heroImage! }, ...PROJECTS]
                    .filter((p) => p.id !== selectedProject.id)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => switchProject(p.id)}
                        className="flex w-full items-center gap-3 rounded-xl border border-forest-900/8 bg-white p-2.5 text-left shadow-card"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={p.name} draggable={false} className="h-full w-full select-none object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-forest-900">{p.name}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-forest-900/50">
                            <MapPin className="h-3 w-3 shrink-0" /> {p.location}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ScreenShell>
  );
}
