import React from "react";
import { ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { TrustBadge } from "./trust-badge";

export function VerifiedInfo({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="rounded-xl border border-forest-800/12 bg-forest-800/[0.03] p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-forest-800" />
        <span className="text-xs font-semibold uppercase tracking-wide text-forest-800">
          Verified project information
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-forest-900/60">{item.label}</span>
            <span className="font-medium text-forest-900">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AIInterpretation({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gold-500/25 bg-gold-50 p-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-gold-600" />
        <span className="text-xs font-semibold uppercase tracking-wide text-gold-600">
          Aira's interpretation
        </span>
      </div>
      <div className="text-sm text-forest-900/85">{children}</div>
    </div>
  );
}

export function ConfirmWithHoabl({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl border border-forest-900/10 bg-ivory-100 p-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <AlertCircle className="h-3.5 w-3.5 text-forest-700" />
        <span className="text-xs font-semibold uppercase tracking-wide text-forest-700">
          Confirm with your HoABL advisor
        </span>
      </div>
      <ul className="space-y-1 text-sm text-forest-900/70">
        {items.map((item) => (
          <li key={item} className="flex gap-1.5">
            <span>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { TrustBadge };
