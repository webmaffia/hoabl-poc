"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ShieldCheck, BadgeCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiraVisual } from "@/components/aira-visual";
import { LiveViewerBadge } from "@/components/urgency-badge";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { HOABL_LOGO_URL } from "@/lib/brand";
import { PROJECT, PROJECTS } from "@/lib/data";

// Real HoABL project photography (sampled from hoabl.com's own asset bucket,
// same source as the rest of the app) cycling as a full-screen backdrop —
// rather than one static hero image.
const SLIDER_IMAGES = [PROJECT.heroImage!, ...PROJECTS.map((p) => p.image)];
const SLIDE_DURATION_MS = 4500;

function BackgroundSlider() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % SLIDER_IMAGES.length), SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence>
        <motion.img
          key={SLIDER_IMAGES[idx]}
          // eslint-disable-next-line @next/next/no-img-element
          src={SLIDER_IMAGES[idx]}
          alt=""
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
    </div>
  );
}

const BENEFITS = [
  "Understand the project clearly",
  "Explore the right project",
  "Find suitable pockets",
  "Make a confident decision",
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Verified Projects" },
  { icon: BadgeCheck, label: "RERA Registered" },
  { icon: Smartphone, label: "100% Digital" },
];

export function Screen01Welcome() {
  const { next } = useJourney();
  const { speak, status, isSpeaking } = useAira();

  useEffect(() => {
    speak(
      "I'll understand what you're looking for, explore the relevant project with you, and help you evaluate the right pocket."
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = () => {
    track("sales_call_completed");
    track("aira_started");
    next();
  };

  useVoiceCommands([{ labels: ["start", "start with aira", "begin", "let's start", "yes"], action: handleStart }]);

  return (
    <div className="relative flex h-full flex-col overflow-y-auto bg-forest-950 text-ivory-100">
      {/* Full-screen, cycling project photography as the backdrop — Aira is a
          small live badge here rather than filling the whole frame, so this
          reads as "HoABL's site" first and "a video call" second. */}
      <BackgroundSlider />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/70 to-forest-950/20" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-forest-950/70 via-transparent to-transparent" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HOABL_LOGO_URL} alt="The House of Abhinandan Lodha" className="h-9 w-auto" />
            <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-gold-300/90">
              AI Land Advisor
            </div>
          </div>

          <div
            className={cn(
              "relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-gold-400/70 bg-forest-800",
              isSpeaking && "ring-2 ring-gold-400/50"
            )}
            role="img"
            aria-label={status === "live" ? "Aira is live" : "Aira, your AI advisor"}
          >
            <AiraVisual className="h-full w-full object-cover" />
            <span
              className={cn(
                "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-forest-950",
                status === "live" ? "bg-emerald-400" : status === "connecting" ? "animate-pulse bg-gold-400" : "bg-ivory-100/40"
              )}
            />
          </div>
        </div>

        <div className="mt-auto px-5 pb-6 pt-16">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-300">
            Land for a better tomorrow
          </div>
          <h1 className="text-balance font-serif text-[28px] font-bold leading-[1.1] text-ivory-50">
            A small step. A bigger tomorrow.
          </h1>
          <p className="mt-2 max-w-[280px] text-[13px] leading-snug text-ivory-100/80">
            Aira, your AI land advisor, guides you to the right plot &mdash; verified projects, 100% online, simple and
            clear.
          </p>

          <div className="mt-4 flex gap-2">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-forest-950/60 px-2 py-2.5 text-center backdrop-blur"
              >
                <Icon className="h-4 w-4 text-gold-400" />
                <span className="text-[10px] font-medium leading-tight text-ivory-100/85">{label}</span>
              </div>
            ))}
          </div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-5 space-y-3"
          >
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-[15px] text-ivory-100/85">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
                  <Check className="h-3 w-3" />
                </span>
                {b}
              </li>
            ))}
          </motion.ul>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-center gap-2">
              <LiveViewerBadge seed="landing" className="bg-white/10 text-ivory-100/80" />
              <span className="text-xs text-ivory-100/50">exploring HoABL land right now</span>
            </div>
            <Button variant="gold" size="lg" className="w-full" onClick={handleStart}>
              Start with Aira &rarr;
            </Button>
            <p className="mt-3 text-center text-xs text-ivory-100/45">
              Takes ~2 minutes &middot; no commitment, just clarity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
