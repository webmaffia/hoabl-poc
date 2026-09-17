"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Wallet, TrendingUp } from "lucide-react";
import { ScreenShell } from "@/components/screen-shell";
import { AiGlobe } from "@/components/ai-processing/ai-globe";
import { OrbitRings, RingConfig } from "@/components/ai-processing/orbit-rings";
import { ProfileNode, ProfileNodeData } from "@/components/ai-processing/profile-node";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { topProjectMatch } from "@/lib/project-match";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const CX = 160;
const CY = 160;
const LABEL_RADIUS = 128;
const ORBIT_DURATION = 90; // seconds per revolution — slow and continuous, all labels moving together

// Decorative only — sized a little tighter than the label ring so they read
// as an inner orbital backdrop rather than the thing carrying the labels.
// Sized up a bit from the original 7-node version — with only 3 profile
// nodes now, the wider rings keep the globe from feeling lost in empty space.
const RINGS: RingConfig[] = [
  { rx: 102, ry: 118, rotDeg: -18, opacity: 0.4, duration: 22, dotCount: 6 },
  { rx: 120, ry: 94, rotDeg: 24, opacity: 0.32, duration: 28, reverse: true, dotCount: 6 },
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

const NODE_ORDER = ["purpose", "budget", "expected"];

export function Screen18AiProcessing() {
  const { buyerProfile, dispatch, next } = useJourney();
  const { speak } = useAira();
  const [stageIdx, setStageIdx] = useState(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [doneKeys, setDoneKeys] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(0);
  const stepIdx = stageIdx < 2 ? 0 : stageIdx < 4 ? 1 : 2;

  const nodesByKey: Record<string, ProfileNodeData> = useMemo(
    () => ({
      purpose: { key: "purpose", label: "Purpose", value: capitalize(buyerProfile.purpose), icon: Briefcase },
      budget: { key: "budget", label: "Budget", value: buyerProfile.budgetLabel || "—", icon: Wallet },
      expected: { key: "expected", label: "Usage", value: buyerProfile.expectedPurpose || "—", icon: TrendingUp },
    }),
    [buyerProfile]
  );

  // Computed once, up front — the "processing" is a visual performance of
  // work that's actually instant; the score itself is real and deterministic.
  const match = useMemo(() => topProjectMatch(buyerProfile), [buyerProfile]);

  useEffect(() => {
    let cancelled = false;
    track("ai_processing_started");

    (async () => {
      setStageIdx(0);
      speak("Give me a moment while I match your profile against HoABL's projects.");

      for (let i = 0; i < NODE_ORDER.length; i++) {
        if (cancelled) return;
        await wait(320);
        if (cancelled) return;
        const key = NODE_ORDER[i];
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
      setActiveKey("expected");
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
        className="relative flex h-full flex-col items-center justify-center gap-6 overflow-y-auto no-scrollbar px-4 py-6"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #1c0f30 0%, #100819 55%, #0a0512 100%)" }}
      >
        {/* Globe + orbit rings + all 7 profile labels, slowly orbiting together */}
        <div className="relative mx-auto h-[320px] w-[320px] shrink-0">
          <OrbitRings cx={CX} cy={CY} rings={RINGS} />
          <div className="absolute z-20" style={{ left: CX, top: CY, transform: "translate(-50%, -50%)" }}>
            <AiGlobe intensity={intensity} size={116} />
          </div>

          {/* Center status overlay — must sit above the globe (z-20) */}
          <div
            className="pointer-events-none absolute z-30 flex flex-col items-center gap-1.5 text-center"
            style={{ left: CX, top: CY, transform: "translate(-50%, -50%)", width: 100 }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={stepIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="font-serif text-[13px] leading-tight text-ivory-50"
              >
                {STEPS[stepIdx]}
              </motion.p>
            </AnimatePresence>
            <span className="h-px w-5 bg-gold-400/70" />
            <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-gold-300/80">
              Aira analyzing&hellip;
            </p>
          </div>

          {/* Orbiting label ring — outer div rotates all 3 nodes together
              around (CX, CY); each node's own inner wrapper counter-rotates
              at the same rate so the pill text stays upright throughout. */}
          <div className="absolute left-0 top-0" style={{ left: CX, top: CY, width: 0, height: 0, zIndex: 40 }}>
            <div
              className="absolute left-0 top-0"
              style={{ animation: `aira-label-orbit ${ORBIT_DURATION}s linear infinite` }}
            >
              {/* Spokes connecting the globe to each node — with only 3 nodes
                  spread wide around the ring, these read as the thing
                  "linking" the profile answers to Aira's analysis, rather
                  than leaving the extra space between them empty. */}
              <svg
                className="pointer-events-none absolute overflow-visible"
                style={{ left: -LABEL_RADIUS, top: -LABEL_RADIUS, width: LABEL_RADIUS * 2, height: LABEL_RADIUS * 2 }}
                viewBox={`${-LABEL_RADIUS} ${-LABEL_RADIUS} ${LABEL_RADIUS * 2} ${LABEL_RADIUS * 2}`}
              >
                <defs>
                  <linearGradient id="spokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d4af5a" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#d4af5a" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {NODE_ORDER.map((key, i) => {
                  const angle = -90 + i * (360 / NODE_ORDER.length);
                  const rad = (angle * Math.PI) / 180;
                  const x = Math.cos(rad) * LABEL_RADIUS;
                  const y = Math.sin(rad) * LABEL_RADIUS;
                  const lit = activeKey === key || doneKeys.includes(key);
                  return (
                    <line
                      key={key}
                      x1={0}
                      y1={0}
                      x2={x}
                      y2={y}
                      stroke="url(#spokeGradient)"
                      strokeWidth={lit ? 1.25 : 0.75}
                      strokeDasharray="2 5"
                      opacity={lit ? 0.9 : 0.35}
                      className="transition-opacity duration-500"
                    />
                  );
                })}
              </svg>

              {NODE_ORDER.map((key, i) => {
                const angle = -90 + i * (360 / NODE_ORDER.length);
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * LABEL_RADIUS;
                const y = Math.sin(rad) * LABEL_RADIUS;
                const node = nodesByKey[key];
                if (!node) return null;
                return (
                  <div
                    key={key}
                    className="absolute left-0 top-0"
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                  >
                    <div
                      style={{
                        animation: `aira-label-counter-orbit ${ORBIT_DURATION}s linear infinite`,
                      }}
                    >
                      <ProfileNode data={node} active={activeKey === key} done={doneKeys.includes(key)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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

        <style jsx global>{`
          @keyframes aira-label-orbit {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes aira-label-counter-orbit {
            from {
              transform: translate(-50%, -50%) rotate(0deg);
            }
            to {
              transform: translate(-50%, -50%) rotate(-360deg);
            }
          }
        `}</style>
      </div>
    </ScreenShell>
  );
}
