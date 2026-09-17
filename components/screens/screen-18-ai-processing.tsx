"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Wallet, MapPin, CalendarClock, Gauge, Square, TrendingUp } from "lucide-react";
import { ScreenShell } from "@/components/screen-shell";
import { AiGlobe } from "@/components/ai-processing/ai-globe";
import { OrbitRings, RingConfig } from "@/components/ai-processing/orbit-rings";
import { ProfileNode, RingDot, ProfileNodeData } from "@/components/ai-processing/profile-node";
import { ellipsePoint } from "@/lib/orbit-geometry";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { topProjectMatch } from "@/lib/project-match";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const CX = 140;
const CY = 145;
const RINGS: RingConfig[] = [
  { rx: 106, ry: 122, rotDeg: -18, opacity: 0.4, duration: 24, dotCount: 5 },
  { rx: 126, ry: 98, rotDeg: 24, opacity: 0.32, duration: 30, reverse: true, dotCount: 5 },
];

const STAGE_CAPTIONS = [
  "Understanding your preferences",
  "Mapping your priorities",
  "Evaluating suitable projects",
  "Checking available land characteristics",
  "Finding your strongest matches",
  "Aira has found your matches",
];

const STEPS = ["Analyzing your profile", "Matching suitable projects", "Preparing personalized results"];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function capitalize(v: string | null) {
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : "—";
}

function plotLabel(v: string | null) {
  const map: Record<string, string> = {
    corner: "Corner plot",
    larger: "Larger plot",
    interior: "Privacy / interior",
    standard: "No strong pref.",
  };
  return v ? map[v] || v : "—";
}

// Anchors each node to one of the two rings at a fixed angle. Only the
// active node ever renders its full labeled pill — the rest stay as plain
// dots — so the globe never shows more than one label at a time.
const NODE_ANCHORS: { key: string; ring: 0 | 1; angle: number }[] = [
  { key: "purpose", ring: 0, angle: -100 },
  { key: "budget", ring: 1, angle: -45 },
  { key: "horizon", ring: 0, angle: 8 },
  { key: "location", ring: 1, angle: 58 },
  { key: "plot", ring: 0, angle: 115 },
  { key: "risk", ring: 1, angle: 165 },
  { key: "expected", ring: 0, angle: -155 },
];

export function Screen18AiProcessing() {
  const { buyerProfile, dispatch, next } = useJourney();
  const { speak } = useAira();
  const [stageIdx, setStageIdx] = useState(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [doneKeys, setDoneKeys] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(0);
  const stepIdx = stageIdx < 2 ? 0 : stageIdx < 4 ? 1 : 2;

  const nodes: ProfileNodeData[] = useMemo(
    () => [
      { key: "purpose", label: "Purpose", value: capitalize(buyerProfile.purpose), icon: Briefcase },
      { key: "budget", label: "Budget", value: buyerProfile.budgetLabel || "—", icon: Wallet },
      { key: "location", label: "Location", value: buyerProfile.location || "—", icon: MapPin },
      { key: "horizon", label: "Horizon", value: buyerProfile.horizon || "—", icon: CalendarClock },
      { key: "risk", label: "Risk comfort", value: capitalize(buyerProfile.riskComfort), icon: Gauge },
      { key: "plot", label: "Plot preference", value: plotLabel(buyerProfile.plotPreference), icon: Square },
      { key: "expected", label: "Usage", value: buyerProfile.expectedPurpose || "—", icon: TrendingUp },
    ],
    [buyerProfile]
  );
  const nodesByKey = useMemo(() => Object.fromEntries(nodes.map((n) => [n.key, n])), [nodes]);

  // Computed once, up front — the "processing" is a visual performance of
  // work that's actually instant; the score itself is real and deterministic.
  const match = useMemo(() => topProjectMatch(buyerProfile), [buyerProfile]);

  useEffect(() => {
    let cancelled = false;
    track("ai_processing_started");

    (async () => {
      setStageIdx(0);
      speak("Give me a moment while I match your profile against HoABL's projects.");

      for (let i = 0; i < NODE_ANCHORS.length; i++) {
        if (cancelled) return;
        await wait(320);
        if (cancelled) return;
        const key = NODE_ANCHORS[i].key;
        setActiveKey(key);
        setDoneKeys((prev) => [...prev, key]);
      }
      if (cancelled) return;
      await wait(300);
      setActiveKey(null);

      if (cancelled) return;
      setStageIdx(1);
      setIntensity(0.3);
      await wait(1000);

      if (cancelled) return;
      setStageIdx(2);
      setIntensity(0.5);
      await wait(1300);

      if (cancelled) return;
      setStageIdx(3);
      setActiveKey("plot");
      await wait(1000);

      if (cancelled) return;
      setStageIdx(4);
      setActiveKey(null);
      setIntensity(0.75);
      await wait(1000);

      if (cancelled) return;
      setStageIdx(5);
      setIntensity(1);
      speak(`I've matched you with ${match.project.name} — let's take a look.`);
      await wait(1300);

      if (cancelled) return;
      track("ai_processing_completed", { topMatchId: match.project.id, score: match.score });
      dispatch({ type: "SELECT_PROJECT", id: match.project.id });
      next();
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenShell showBack={false} showStages={false} title="AI matching">
      <div
        className="relative flex h-full flex-col items-center justify-center gap-6 overflow-y-auto no-scrollbar px-6 py-6"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #1c0f30 0%, #100819 55%, #0a0512 100%)" }}
      >
        {/* Globe + orbit rings + profile nodes */}
        <div className="relative mx-auto h-[280px] w-full max-w-[280px] shrink-0">
          <OrbitRings cx={CX} cy={CY} rings={RINGS} />
          <div className="absolute z-20" style={{ left: CX, top: CY, transform: "translate(-50%, -50%)" }}>
            <AiGlobe intensity={intensity} />
          </div>

          {/* Center status overlay */}
          <div
            className="pointer-events-none absolute z-10 flex flex-col items-center gap-1.5 text-center"
            style={{ left: CX, top: CY, transform: "translate(-50%, -50%)", width: 130 }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={stepIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="font-serif text-sm leading-tight text-ivory-50"
              >
                {STEPS[stepIdx]}
              </motion.p>
            </AnimatePresence>
            <span className="h-px w-5 bg-gold-400/70" />
          </div>

          {NODE_ANCHORS.map((anchor) => {
            const ring = RINGS[anchor.ring];
            const p = ellipsePoint(CX, CY, ring.rx, ring.ry, ring.rotDeg, anchor.angle);
            const node = nodesByKey[anchor.key];
            if (!node) return null;
            const isActive = activeKey === anchor.key;
            return isActive ? (
              <ProfileNode
                key={anchor.key}
                data={node}
                x={p.x}
                y={p.y}
                align={p.x < CX ? "left" : "right"}
                active
                done={doneKeys.includes(anchor.key)}
                delay={0}
              />
            ) : (
              <RingDot key={anchor.key} x={p.x} y={p.y} done={doneKeys.includes(anchor.key)} />
            );
          })}
        </div>

        {/* Stage caption + progress */}
        <div className="w-full max-w-[240px] shrink-0 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={stageIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium text-ivory-100/90"
            >
              {STAGE_CAPTIONS[stageIdx]}
            </motion.p>
          </AnimatePresence>
          <div className="mt-3 flex items-center gap-1.5">
            {STAGE_CAPTIONS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i <= stageIdx ? "bg-gold-400" : "bg-white/10"
                )}
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-ivory-100/35">This may take a few seconds&hellip;</p>
        </div>
      </div>
    </ScreenShell>
  );
}
