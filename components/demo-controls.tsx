"use client";

import React, { useState } from "react";
import { Settings, RotateCcw, X } from "lucide-react";
import { useJourney } from "@/lib/journey-context";

export function DemoControls() {
  const [open, setOpen] = useState(false);
  const { dispatch, currentScreen } = useJourney();

  return (
    <div className="absolute bottom-3 left-3 z-30">
      {open && (
        <div className="mb-2 w-52 rounded-xl border border-forest-900/10 bg-white/95 p-3 text-xs shadow-elevated backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-forest-900">Demo Mode</span>
            <button onClick={() => setOpen(false)} aria-label="Close demo controls">
              <X className="h-3.5 w-3.5 text-forest-900/50" />
            </button>
          </div>
          <p className="mb-2 text-forest-900/50">Screen: {currentScreen}</p>
          <button
            onClick={() => dispatch({ type: "RESET" })}
            className="flex w-full items-center gap-1.5 rounded-lg bg-forest-900/5 px-2.5 py-1.5 font-medium text-forest-800 hover:bg-forest-900/10"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset demo
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-900/60 text-ivory-100 opacity-40 hover:opacity-100"
        aria-label="Demo controls"
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>
  );
}
