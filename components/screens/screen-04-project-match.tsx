"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { TrustBadge } from "@/components/trust/trust-badge";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { track } from "@/lib/analytics";
import { PROJECT } from "@/lib/data";

const REASONS = [
  {
    n: "01",
    title: "Budget fit",
    body: "Available plots align with your stated budget range.",
    kind: "interpretation" as const,
  },
  {
    n: "02",
    title: "Horizon fit",
    body: "The project's development timeline is relevant to your stated investment horizon.",
    kind: "interpretation" as const,
  },
  {
    n: "03",
    title: "Location fit",
    body: "Connectivity to the surrounding corridor aligns with your stated priorities.",
    kind: "interpretation" as const,
  },
  {
    n: "04",
    title: "Plot fit",
    body: "Available pockets include layouts matching your preferred plot characteristics.",
    kind: "interpretation" as const,
  },
  {
    n: "05",
    title: "Risk fit",
    body: "Project information and current limitations are presented transparently before you decide.",
    kind: "interpretation" as const,
  },
];

export function Screen04ProjectMatch() {
  const { next } = useJourney();
  const { speak } = useAira();

  useEffect(() => {
    speak(`Based on everything you told me, ${PROJECT.name} is the strongest match I found for your profile.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenShell showStages={false} title="Project match">
      <div className="flex h-full flex-col px-5 pb-6 pt-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Aira recommends</p>
          <h1 className="mt-1 font-serif text-[30px] leading-tight text-forest-900">{PROJECT.name}</h1>
          <span className="mt-2 inline-block rounded-full bg-forest-800 px-3 py-1 text-xs font-semibold text-ivory-100">
            Best match for your profile
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative mt-4 h-36 overflow-hidden rounded-xl2 bg-gradient-to-br from-forest-600 via-forest-800 to-forest-950"
        >
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-xs text-ivory-100 backdrop-blur">
            <MapPin className="h-3 w-3" /> {PROJECT.location}
          </div>
        </motion.div>

        <div className="mt-5 flex-1 overflow-y-auto no-scrollbar">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-forest-900/40">
            Why this project fits you
          </p>
          <div className="space-y-3">
            {REASONS.map((r, i) => (
              <motion.div
                key={r.n}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="rounded-xl border border-forest-900/8 bg-white p-3.5 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <span className="font-serif text-lg text-gold-500">{r.n}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-forest-900">{r.title}</h3>
                      <TrustBadge kind={r.kind} />
                    </div>
                    <p className="text-sm text-forest-900/65">{r.body}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              track("project_walkthrough_started");
              next();
            }}
          >
            Explore with Aira &rarr;
          </Button>
          <button className="mx-auto block text-sm font-medium text-forest-900/50 hover:text-forest-900">
            See other projects
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}
