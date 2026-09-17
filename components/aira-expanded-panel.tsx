"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useVoice } from "@/lib/voice-command-context";
import { useAira } from "@/lib/aira-context";
import { AiraVisual } from "./aira-visual";
import { cn } from "@/lib/utils";

/**
 * Aira's expanded avatar view — presented as a 50/50 split with the rest of
 * the screen (same pattern as <AiraChatDock />), not a full-screen overlay,
 * so the underlying screen stays visible above it.
 */
export function AiraExpandedPanel() {
  const { setAvatarExpanded } = useVoice();
  const { status } = useAira();

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="relative h-full w-full overflow-hidden border-t border-gold-400/30 bg-forest-950"
    >
      <AiraVisual className="h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-forest-950/40" />

      <div className="absolute inset-x-3 top-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 rounded-full bg-forest-950/70 px-3 py-1.5 backdrop-blur">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              status === "live" ? "bg-emerald-400" : status === "connecting" ? "animate-pulse bg-gold-400" : "bg-ivory-100/40"
            )}
          />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ivory-100/80">
            {status === "live" ? "Aira is live" : status === "connecting" ? "Connecting to Aira…" : "Aira · demo avatar"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAvatarExpanded(false)}
          aria-label="Minimize Aira"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-950/70 text-ivory-100 backdrop-blur hover:bg-forest-950/90"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
