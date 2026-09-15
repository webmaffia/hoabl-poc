"use client";

import { motion } from "framer-motion";
import { useAira } from "@/lib/aira-context";
import { AiraVisual } from "./aira-visual";
import { cn } from "@/lib/utils";

interface AiraCardProps {
  width?: number;
  height?: number;
  className?: string;
}

/** A vertical (portrait-oriented), ringed presentation of Aira's live/fallback avatar — used by the draggable floating widget. */
export function AiraCard({ width = 84, height = 128, className }: AiraCardProps) {
  const { status, isSpeaking } = useAira();

  return (
    <div className={cn("relative shrink-0", className)} style={{ width, height }}>
      <div
        className={cn(
          "h-full w-full overflow-hidden rounded-2xl border-2 border-gold-400/70 bg-gradient-to-br from-forest-700 to-forest-900 shadow-elevated",
          isSpeaking && "ring-4 ring-gold-400/30"
        )}
      >
        <AiraVisual className="h-full w-full object-cover" />
      </div>
      {isSpeaking && (
        <motion.span
          className="absolute inset-0 rounded-2xl border-2 border-gold-400"
          animate={{ opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <span
        className={cn(
          "absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full ring-2 ring-forest-950",
          status === "live" ? "bg-emerald-400" : status === "connecting" ? "bg-gold-400 animate-pulse" : "bg-forest-400/60"
        )}
      />
    </div>
  );
}
