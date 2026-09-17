"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Wallet, MapPin, CalendarClock, Gauge, Square, TrendingUp, Sparkles } from "lucide-react";
import { ScreenShell } from "@/components/screen-shell";
import { AiCoreVisual } from "@/components/ai-processing/ai-core-visual";
import { OrbitNode, OrbitNodeData } from "@/components/ai-processing/orbit-node";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { seedFromString } from "@/lib/urgency";
import { topProjectMatch } from "@/lib/project-match";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface OrbitConfig {
  radiusX: number;
  radiusY: number;
  speed: number;
  direction: 1 | -1;
  phase: number;
  vOffset: number;
}

const STAGE_CAPTIONS = [
  "Understanding your preferences",
  "Mapping your priorities",
  "Evaluating suitable projects",
  "Checking available land characteristics",
  "Finding your strongest matches",
  "Aira has found your matches",
];

const NODE_UNDERSTOOD: Record<string, string> = {
  purpose: "Investment purpose understood",
  budget: "Budget preference understood",
  location: "Location preference understood",
  horizon: "Horizon preference understood",
  risk: "Risk comfort understood",
  plot: "Plot preference understood",
  expected: "Expected purpose understood",
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

// Builds each node's orbit geometry once (deterministically, from a hash of
// its own label) rather than re-randomizing on every render — so the motion
// is stable for the lifetime of this screen but still feels organic and
// non-synchronized across nodes.
function buildOrbitConfig(seedKey: string, index: number): OrbitConfig {
  const seed = seedFromString(seedKey);
  const radiusX = 108 + (seed % 6) * 14 + (index % 2) * 8; // ~108–182
  const radiusY = radiusX * (0.3 + ((seed >> 3) % 5) * 0.025);
  const speed = 0.1 + ((seed >> 5) % 9) * 0.014; // ~0.1–0.21 rad/s
  const direction: 1 | -1 = seed % 2 === 0 ? 1 : -1;
  const phase = ((seed >> 2) % 628) / 100; // 0–2π
  const vOffset = ((index % 3) - 1) * 6;
  return { radiusX, radiusY, speed, direction, phase, vOffset };
}

export function Screen18AiProcessing() {
  const { buyerProfile, dispatch, next } = useJourney();
  const { speak } = useAira();
  const [stageIdx, setStageIdx] = useState(0);
  const [status, setStatus] = useState(STAGE_CAPTIONS[0]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [doneKeys, setDoneKeys] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(0);

  const nodes: OrbitNodeData[] = useMemo(
    () => [
      { key: "purpose", label: "Purpose", value: capitalize(buyerProfile.purpose), icon: Briefcase },
      { key: "budget", label: "Budget", value: buyerProfile.budgetLabel || "—", icon: Wallet },
      { key: "location", label: "Location", value: buyerProfile.location || "—", icon: MapPin },
      { key: "horizon", label: "Horizon", value: buyerProfile.horizon || "—", icon: CalendarClock },
      { key: "risk", label: "Risk", value: capitalize(buyerProfile.riskComfort), icon: Gauge },
      { key: "plot", label: "Plot", value: plotLabel(buyerProfile.plotPreference), icon: Square },
      { key: "expected", label: "Expected use", value: buyerProfile.expectedPurpose || "—", icon: TrendingUp },
    ],
    [buyerProfile]
  );

  const orbitConfigs = useMemo(() => nodes.map((n, i) => buildOrbitConfig(n.key, i)), [nodes]);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Computed once, up front — the "processing" is a visual performance of
  // work that's actually instant; the score itself is real and deterministic.
  const match = useMemo(() => topProjectMatch(buyerProfile), [buyerProfile]);

  // Imperative rAF loop: mutates each node's transform/opacity/z-index
  // directly via ref, so ~7 floating cards can move continuously without
  // driving a React re-render every frame.
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      orbitConfigs.forEach((cfg, i) => {
        const el = nodeRefs.current[i];
        if (!el) return;
        const angle = cfg.phase + cfg.direction * cfg.speed * t;
        const x = Math.cos(angle) * cfg.radiusX;
        const y = Math.sin(angle) * cfg.radiusY + cfg.vOffset;
        const depth = (Math.sin(angle) + 1) / 2;
        const scale = 0.72 + depth * 0.42;
        const opacity = 0.5 + depth * 0.5;
        el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${scale})`;
        el.style.opacity = String(opacity);
        el.style.zIndex = String(10 + Math.round(depth * 20));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [orbitConfigs]);

  // The stage/status/highlight timeline — a scripted ~7.5s sequence, not an
  // indefinite loader, ending in an automatic transition to the project list.
  useEffect(() => {
    let cancelled = false;
    track("ai_processing_started");

    (async () => {
      setStageIdx(0);
      setStatus(STAGE_CAPTIONS[0]);
      speak("Give me a moment while I match your profile against HoABL's projects.");

      for (let i = 0; i < nodes.length; i++) {
        if (cancelled) return;
        await wait(300);
        if (cancelled) return;
        setActiveKey(nodes[i].key);
        setStatus(NODE_UNDERSTOOD[nodes[i].key] || `${nodes[i].label} understood`);
        setDoneKeys((prev) => [...prev, nodes[i].key]);
      }
      if (cancelled) return;
      await wait(250);
      setActiveKey(null);

      if (cancelled) return;
      setStageIdx(1);
      setStatus(STAGE_CAPTIONS[1]);
      setIntensity(0.3);
      await wait(1000);

      if (cancelled) return;
      setStageIdx(2);
      setStatus(STAGE_CAPTIONS[2]);
      setIntensity(0.5);
      await wait(1300);

      if (cancelled) return;
      setStageIdx(3);
      setStatus(STAGE_CAPTIONS[3]);
      setActiveKey("plot");
      await wait(1000);

      if (cancelled) return;
      setStageIdx(4);
      setStatus(STAGE_CAPTIONS[4]);
      setActiveKey(null);
      setIntensity(0.75);
      await wait(1000);

      if (cancelled) return;
      setStageIdx(5);
      setStatus(STAGE_CAPTIONS[5]);
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
        className="relative flex h-full flex-col items-center overflow-hidden px-5 pb-6 pt-6"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #1c0f30 0%, #100819 60%, #0a0512 100%)" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-400/80">Aira is analyzing</p>
        <h1 className="mt-1 text-center font-serif text-xl text-ivory-50">Finding your suitable project</h1>

        <div className="relative mt-2 w-full flex-1">
          <AiCoreVisual intensity={intensity} />
          {nodes.map((node, i) => (
            <OrbitNode
              key={node.key}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              data={node}
              active={activeKey === node.key}
              done={doneKeys.includes(node.key)}
            />
          ))}
        </div>

        <div className="mb-2 flex items-center gap-1.5">
          {STAGE_CAPTIONS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === stageIdx ? "w-5 bg-gold-400" : i < stageIdx ? "w-1.5 bg-gold-400/50" : "w-1.5 bg-white/15"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={status}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 text-center text-sm font-medium text-ivory-100/90"
          >
            {stageIdx === STAGE_CAPTIONS.length - 1 && <Sparkles className="h-3.5 w-3.5 text-gold-300" />}
            {status}
          </motion.p>
        </AnimatePresence>
      </div>
    </ScreenShell>
  );
}
