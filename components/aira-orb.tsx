"use client";

import { motion } from "framer-motion";
import { useAira } from "@/lib/aira-context";
import { AiraVisual } from "./aira-visual";
import { cn } from "@/lib/utils";

interface AiraOrbProps {
  /** Diameter in pixels. */
  size?: number;
  showStatusDot?: boolean;
  className?: string;
}

/** A sized, ringed presentation of Aira's live/fallback avatar — reused at small (header panel) and large (screen hero) scale. */
export function AiraOrb({ size = 56, showStatusDot = true, className }: AiraOrbProps) {
  const { status, isSpeaking } = useAira();

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <div
        className={cn(
          "h-full w-full overflow-hidden rounded-full border-2 border-gold-400/70 bg-gradient-to-br from-forest-700 to-forest-900",
          isSpeaking && "ring-4 ring-gold-400/30"
        )}
      >
        <AiraVisual className="h-full w-full object-cover" />
      </div>
      {isSpeaking && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-gold-400"
          animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {showStatusDot && (
        <span
          className={cn(
            "absolute rounded-full ring-2 ring-forest-950",
            status === "live" ? "bg-emerald-400" : status === "connecting" ? "bg-gold-400 animate-pulse" : "bg-forest-400/60"
          )}
          style={{ width: size * 0.22, height: size * 0.22, bottom: -1, right: -1 }}
        />
      )}
    </div>
  );
}
