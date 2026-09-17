"use client";

import { cn } from "@/lib/utils";

export interface ProfileNodeData {
  key: string;
  label: string;
  value: string;
  icon: React.ElementType;
}

/**
 * A compact, always-visible label for one buyer-profile answer. Kept small
 * and consistently laid out (icon-then-text, never mirrored) because these
 * nodes continuously orbit — a fixed left/right text alignment would only
 * look right for half of each rotation.
 */
export function ProfileNode({ data, active, done }: { data: ProfileNodeData; active: boolean; done: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 backdrop-blur-sm transition-all duration-300",
        active
          ? "scale-105 border-gold-300 bg-gold-500/20 shadow-[0_0_16px_2px_rgba(212,175,90,0.45)]"
          : done
          ? "border-gold-400/25 bg-forest-950/75"
          : "border-white/10 bg-forest-950/60"
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          active
            ? "bg-gradient-to-br from-gold-300 to-gold-500 text-forest-950"
            : "bg-gradient-to-br from-white/15 to-white/5 text-gold-200"
        )}
      >
        <data.icon className="h-2.5 w-2.5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[7px] font-semibold uppercase tracking-wide text-ivory-100/45">{data.label}</span>
        <span className="text-[10px] font-medium text-ivory-50">{data.value}</span>
      </span>
    </div>
  );
}
