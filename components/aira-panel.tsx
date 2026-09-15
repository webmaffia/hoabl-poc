"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GripHorizontal, Sparkles } from "lucide-react";
import { useAira } from "@/lib/aira-context";
import { AiraCard } from "./aira-card";

/**
 * Aira's persistent, always-on presence — a draggable, vertical floating
 * widget, mounted once for the whole journey (see app/page.tsx) so the live
 * HeyGen session (when configured) is never torn down and reconnected
 * between screens. Falls back to an animated local portrait automatically
 * when no HeyGen session is live.
 */
export function AiraPanel() {
  const { status, caption } = useAira();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    // Fully pointer-events-none on the outer layer: only the draggable card
    // itself should capture pointer events, so it never steals clicks meant
    // for whatever's underneath it (confirmed this happens if the whole
    // overlay is interactive — it silently blocked the "Start with Aira"
    // button). containerRef bounds the drag to the visible phone screen.
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-30">
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.05}
        dragConstraints={containerRef}
        whileDrag={{ scale: 1.05 }}
        initial={false}
        className="pointer-events-auto absolute bottom-24 right-4 flex w-fit cursor-grab touch-none flex-col items-end gap-2 active:cursor-grabbing"
      >
        <AnimatePresence>
          {caption && (
            <motion.div
              key={caption}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="max-w-[210px] rounded-2xl rounded-br-sm bg-forest-950/95 px-3.5 py-2.5 shadow-elevated backdrop-blur"
            >
              <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-gold-400">
                <Sparkles className="h-3 w-3" /> Aira
                <StatusPill status={status} />
              </div>
              <p className="text-[12px] leading-snug text-ivory-100/90">{caption}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <div className="pointer-events-none absolute -top-1.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-forest-950/80 px-1 py-0.5">
            <GripHorizontal className="h-2.5 w-2.5 text-ivory-100/60" />
          </div>
          <AiraCard />
        </div>
      </motion.div>
    </div>
  );
}

function StatusPill({ status }: { status: "connecting" | "live" | "fallback" }) {
  if (status === "live") {
    return <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">Live</span>;
  }
  if (status === "connecting") {
    return <span className="rounded-full bg-gold-400/15 px-1.5 py-0.5 text-[9px] font-medium text-gold-400">Connecting…</span>;
  }
  return <span className="rounded-full bg-ivory-100/10 px-1.5 py-0.5 text-[9px] font-medium text-ivory-100/50">Demo avatar</span>;
}
