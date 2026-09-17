"use client";

import { forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrbitNodeData {
  key: string;
  label: string;
  value: string;
  icon: React.ElementType;
}

/**
 * A single floating buyer-profile label. Position/scale/opacity are driven
 * imperatively (via the forwarded ref's inline style, updated every animation
 * frame by the parent screen) rather than through React state, so the ~7
 * nodes can move continuously without re-rendering the tree every frame.
 */
export const OrbitNode = forwardRef<HTMLDivElement, { data: OrbitNodeData; active: boolean; done: boolean }>(
  function OrbitNode({ data, active, done }, ref) {
    return (
      <div
        ref={ref}
        className="pointer-events-none absolute left-1/2 top-1/2 will-change-transform"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div
          className={cn(
            "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 backdrop-blur-sm transition-colors duration-300",
            active
              ? "border-gold-300 bg-gold-500/20 shadow-[0_0_16px_2px_rgba(212,175,90,0.45)]"
              : done
              ? "border-gold-400/30 bg-white/10"
              : "border-white/10 bg-white/5"
          )}
        >
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              active ? "bg-gold-400 text-forest-950" : "bg-white/10 text-gold-200"
            )}
          >
            {done && !active ? <Check className="h-3 w-3" /> : <data.icon className="h-3 w-3" />}
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[8px] font-semibold uppercase tracking-wide text-ivory-100/50">{data.label}</span>
            <span className="text-[11px] font-medium text-ivory-50">{data.value}</span>
          </span>
        </div>
      </div>
    );
  }
);
