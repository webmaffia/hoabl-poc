"use client";

import { useEffect, useState } from "react";
import { Eye, Flame } from "lucide-react";
import { baseViewerCount } from "@/lib/urgency";
import { cn } from "@/lib/utils";
import { Pocket } from "@/lib/types";

/** Demo-only "N people viewing" signal, gently ticking to feel live. */
export function LiveViewerBadge({ seed, className }: { seed: string; className?: string }) {
  const [count, setCount] = useState(() => baseViewerCount(seed));

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => {
        const delta = Math.random() < 0.5 ? -1 : 1;
        return Math.min(9, Math.max(1, c + delta));
      });
    }, 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-forest-900/6 px-2 py-0.5 text-[11px] font-medium text-forest-900/60",
        className
      )}
      title="Illustrative demo signal"
    >
      <Eye className="h-3 w-3" /> {count} viewing now
    </span>
  );
}

/** Demand badge driven by the pocket's real availability state — not fabricated. */
export function ScarcityBadge({ pocket, className }: { pocket: Pocket; className?: string }) {
  if (pocket.availability === "sold") {
    return (
      <span className={cn("inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-500", className)}>
        Sold out
      </span>
    );
  }
  if (pocket.availability === "limited") {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-gold-50 px-2 py-0.5 text-[11px] font-semibold text-gold-600", className)}>
        <Flame className="h-3 w-3" /> Only {pocket.plotsLeft ?? "a few"} plots left
      </span>
    );
  }
  return null;
}
