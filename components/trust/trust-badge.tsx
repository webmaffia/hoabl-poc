import React from "react";
import { ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrustKind = "verified" | "interpretation" | "confirm";

const config: Record<TrustKind, { label: string; icon: React.ElementType; classes: string }> = {
  verified: {
    label: "Verified",
    icon: ShieldCheck,
    classes: "bg-forest-800/8 text-forest-800 border-forest-800/15",
  },
  interpretation: {
    label: "Aira's interpretation",
    icon: Sparkles,
    classes: "bg-gold-50 text-gold-600 border-gold-500/25",
  },
  confirm: {
    label: "Confirm with HoABL",
    icon: AlertCircle,
    classes: "bg-forest-900/5 text-forest-700 border-forest-900/10",
  },
};

export function TrustBadge({ kind, className }: { kind: TrustKind; className?: string }) {
  const { label, icon: Icon, classes } = config[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        classes,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
