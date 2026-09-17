"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProfileNodeData {
  key: string;
  label: string;
  value: string;
  icon: React.ElementType;
}

/** A plain marker for a node that isn't currently active — keeps the ring
 * from being cluttered with 7 text labels at once; only the active node
 * expands into a full labeled pill. */
export function RingDot({ x, y, done }: { x: number; y: number; done: boolean }) {
  return (
    <span
      className={cn(
        "absolute z-30 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-300",
        done ? "border-gold-300 bg-gold-400" : "border-white/25 bg-white/10"
      )}
      style={{ left: x, top: y, boxShadow: done ? "0 0 6px 2px rgba(212,175,90,0.55)" : "none" }}
    />
  );
}

export function ProfileNode({
  data,
  x,
  y,
  align,
  active,
  done,
  delay,
}: {
  data: ProfileNodeData;
  x: number;
  y: number;
  align: "left" | "right";
  active: boolean;
  done: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 240, damping: 20 }}
      className="absolute z-40"
      style={{
        left: x,
        top: y,
        transform: `translate(${align === "left" ? "-100%" : "0%"}, -50%)`,
      }}
    >
      <div
        className={cn(
          "flex items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-1.5 backdrop-blur-sm transition-colors duration-300",
          align === "left" && "flex-row-reverse",
          active
            ? "border-gold-300 bg-gold-500/20 shadow-[0_0_18px_2px_rgba(212,175,90,0.4)]"
            : done
            ? "border-gold-400/25 bg-forest-950/70"
            : "border-white/10 bg-forest-950/60"
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
            active ? "border-gold-300 bg-gold-400 text-forest-950" : "border-gold-400/30 bg-white/5 text-gold-200"
          )}
        >
          {done && !active ? <Check className="h-3 w-3" /> : <data.icon className="h-3 w-3" />}
        </span>
        <span className={cn("flex flex-col leading-tight", align === "left" && "items-end text-right")}>
          <span className="text-[8px] font-semibold uppercase tracking-wide text-ivory-100/45">{data.label}</span>
          <span className="text-[11px] font-medium text-ivory-50">{data.value}</span>
        </span>
      </div>
    </motion.div>
  );
}
