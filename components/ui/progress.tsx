import React from "react";
import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-forest-900/10 overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-gold-500 transition-all duration-500 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
