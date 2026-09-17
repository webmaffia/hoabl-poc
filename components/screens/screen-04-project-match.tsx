"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Sparkles } from "lucide-react";
import { ScreenShell } from "@/components/screen-shell";
import { TrustBadge } from "@/components/trust/trust-badge";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { track } from "@/lib/analytics";
import { PROJECT, PROJECTS } from "@/lib/data";
import { topProjectMatch } from "@/lib/project-match";

// The full "why this fits you" breakdown now lives entirely in the
// walkthrough that follows this screen — repeating it here (as we used to,
// with a 5-card list) made two consecutive screens show the same project
// facts twice. This screen's job is just: confirm the pick, offer a quick
// out to switch, then move on.
const FIT_SUMMARY = "Budget, horizon, location and plot preferences all line up with what you told Aira.";

export function Screen04ProjectMatch() {
  const { next, selectedProject, selectProject, buyerProfile } = useJourney();
  const { speak } = useAira();
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
    track("project_walkthrough_started");
    next();
  };

  useVoiceCommands([
    { labels: ["explore", "continue", "next", "explore with aira", "yes"], action: proceed },
  ]);

  return (
    <ScreenShell showStages={false} title="Project match">
      <div className="flex h-full flex-col overflow-y-auto no-scrollbar px-5 pb-5 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
          {isRecommended ? "Aira recommends" : "You selected"}
        </p>

        <motion.button
          key={selectedProject.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={proceed}
          className="mt-2 block w-full shrink-0 overflow-hidden rounded-2xl border-2 border-gold-500 bg-white text-left shadow-elevated"
        >
          <div className="relative h-44 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedProject.heroImage} alt={selectedProject.name} className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/15 to-transparent" />
            {isRecommended && (
              <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-gold-500 px-2.5 py-1 text-[11px] font-bold text-forest-950 shadow-card">
                <Sparkles className="h-3 w-3" /> Best match for your profile
              </span>
            )}
            <div className="absolute inset-x-3 bottom-3">
              <p className="font-serif text-2xl leading-tight text-ivory-50">{selectedProject.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ivory-100/80">
                <MapPin className="h-3 w-3 shrink-0" /> {selectedProject.location}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4">
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
          </div>
        </motion.button>

        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-forest-900/40">
          Other projects
        </p>
        <div className="flex-1 space-y-2 pb-2">
          {[{ id: PROJECT.id, name: PROJECT.name, location: PROJECT.location, image: PROJECT.heroImage! }, ...PROJECTS]
            .filter((p) => p.id !== selectedProject.id)
            .map((p) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => switchProject(p.id)}
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
                </div>
              </motion.button>
            ))}
        </div>
      </div>
    </ScreenShell>
  );
}
