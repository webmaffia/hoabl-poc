"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Wallet, MapPin, CalendarClock, Gauge, Square, TrendingUp, Sparkles } from "lucide-react";
import { ScreenShell } from "@/components/screen-shell";
import { AiraVisual } from "@/components/aira-visual";
import { AiGlobe } from "@/components/ai-processing/ai-globe";
import { OrbitRings, RingConfig } from "@/components/ai-processing/orbit-rings";
import { ProfileNode, ProfileNodeData } from "@/components/ai-processing/profile-node";
import { ellipsePoint } from "@/lib/orbit-geometry";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { topProjectMatch } from "@/lib/project-match";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const CX = 150;
const CY = 155;
const RINGS: RingConfig[] = [
  { rx: 116, ry: 132, rotDeg: -18, opacity: 0.45, duration: 24, dotCount: 7 },
  { rx: 136, ry: 106, rotDeg: 24, opacity: 0.38, duration: 30, reverse: true, dotCount: 7 },
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

const NODE_UNDERSTOOD: Record<string, string> = {
  purpose: "Investment purpose understood",
  budget: "Budget preference understood",
  location: "Location preference understood",
  horizon: "Horizon preference understood",
  risk: "Risk comfort understood",
  plot: "Plot preference understood",
  expected: "Usage preference understood",
};

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

// Anchors each node to one of the two rings at a fixed angle (matching the
// reference layout) — nodes stay put; the small particles on the ring are
// what carry the sense of motion.
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
        await wait(300);
        if (cancelled) return;
        const key = NODE_ANCHORS[i].key;
        setActiveKey(key);
        setDoneKeys((prev) => [...prev, key]);
      }
      if (cancelled) return;
      await wait(250);
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
        className="relative flex h-full flex-col overflow-y-auto no-scrollbar px-5 pb-6 pt-5"
        style={{ background: "radial-gradient(ellipse at 50% 20%, #1c0f30 0%, #100819 55%, #0a0512 100%)" }}
      >
        {/* Aira's intro line */}
        <div className="flex shrink-0 items-start gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-gold-400/60">
            <AiraVisual className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-gold-400/15 bg-white/5 px-3.5 py-2.5 backdrop-blur-sm">
            <p className="text-[11px] font-semibold text-gold-300">Aira</p>
            <p className="mt-0.5 text-[13px] leading-snug text-ivory-100/85">
              Great, I&rsquo;ve got your inputs. Now I&rsquo;m analyzing multiple factors to find the most suitable
              projects for you&hellip;
            </p>
          </div>
        </div>

        {/* Globe + orbit rings + profile nodes */}
        <div className="relative mx-auto mt-4 h-[300px] w-full max-w-[300px] shrink-0">
          <OrbitRings cx={CX} cy={CY} rings={RINGS} />
          <div className="absolute z-20" style={{ left: CX, top: CY, transform: "translate(-50%, -50%)" }}>
            <AiGlobe intensity={intensity} />
          </div>

          {/* Center status overlay */}
          <div
            className="pointer-events-none absolute z-30 flex flex-col items-center gap-1.5 text-center"
            style={{ left: CX, top: CY, transform: "translate(-50%, -50%)", width: 150 }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={stepIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="font-serif text-[15px] leading-tight text-ivory-50"
              >
                {STEPS[stepIdx]}
              </motion.p>
            </AnimatePresence>
            <span className="h-px w-6 bg-gold-400/70" />
            <AnimatePresence mode="wait">
              <motion.p
                key={stageIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[8px] font-semibold uppercase tracking-[0.18em] text-ivory-100/50"
              >
                {STAGE_CAPTIONS[stageIdx]}
              </motion.p>
            </AnimatePresence>
          </div>

          {NODE_ANCHORS.map((anchor, i) => {
            const ring = RINGS[anchor.ring];
            const p = ellipsePoint(CX, CY, ring.rx, ring.ry, ring.rotDeg, anchor.angle);
            const node = nodesByKey[anchor.key];
            if (!node) return null;
            return (
              <ProfileNode
                key={anchor.key}
                data={node}
                x={p.x}
                y={p.y}
                align={p.x < CX ? "left" : "right"}
                active={activeKey === anchor.key}
                done={doneKeys.includes(anchor.key)}
                delay={i * 0.06}
              />
            );
          })}
        </div>

        {/* 3-step progress */}
        <div className="mt-4 shrink-0 rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
          <div className="flex items-center">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                      i < stepIdx
                        ? "border-gold-400 bg-gold-400"
                        : i === stepIdx
                        ? "border-gold-400 shadow-[0_0_0_3px_rgba(212,175,90,0.25)]"
                        : "border-white/20"
                    )}
                  />
                  <span
                    className={cn(
                      "w-20 text-center text-[10px] font-medium leading-tight",
                      i === stepIdx ? "text-ivory-50" : "text-ivory-100/40"
                    )}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("mx-1 mb-4 h-px flex-1", i < stepIdx ? "bg-gold-400/60" : "bg-white/10")} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom detail card */}
        <div className="mb-2 mt-3 flex shrink-0 items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-3.5 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-300">
            <Sparkles className="h-4 w-4" />
          </span>
          <p className="min-w-0 flex-1 text-[11px] leading-snug text-ivory-100/70">
            Aira is evaluating location potential, connectivity, development plans, amenities and pocket suitability
            based on your preferences.
          </p>
          <div className="flex shrink-0 items-center gap-1 rounded-2xl bg-white/10 px-2.5 py-2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-ivory-100/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}
