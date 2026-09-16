"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import { useVoice } from "@/lib/voice-command-context";
import { useAira } from "@/lib/aira-context";
import { AiraCard } from "./aira-card";
import { AiraVisual } from "./aira-visual";
import { cn } from "@/lib/utils";

/**
 * Aira's presence — a fixed floating widget (bottom-right, not draggable),
 * mounted once for the whole journey (see app/page.tsx) so the live HeyGen
 * session (when configured) is never torn down and reconnected between
 * screens. Falls back to an animated local portrait automatically when no
 * HeyGen session is live.
 *
 * "Talk" is the default mode: tapping the card, or starting to talk via the
 * <AiraCtaBar /> mic, expands her to fill the whole screen. Renders nothing
 * in "chat" mode — that's the opt-in secondary mode, handled by the
 * separate <AiraChatDock /> (50/50 split panel).
 */
export function AiraPanel() {
  const { listening, mode } = useVoice();
  const { status } = useAira();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (listening) setExpanded(true);
  }, [listening]);

  if (mode === "chat") return null;

  return (
    // Fully pointer-events-none on the outer layer: only the widget itself
    // should capture pointer events, so it never steals clicks meant for
    // whatever's underneath it (confirmed this happens if the whole overlay
    // is interactive — it silently blocked the "Start with Aira" button).
    <div className="pointer-events-none absolute inset-0 z-30">
      <motion.div
        initial={false}
        className={cn(
          "pointer-events-auto absolute",
          // Collapsed: sits above the <AiraCtaBar /> (bottom-4, ~52px tall)
          // rather than behind/under it, with clearance so it never overlaps
          // a screen's own bottom CTA either.
          expanded ? "inset-0 z-40" : "bottom-20 right-4 w-fit"
        )}
      >
        {expanded ? (
          <div className="relative h-full w-full overflow-hidden bg-forest-950">
            <AiraVisual className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-forest-950/40" />

            <div className="absolute inset-x-4 top-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 rounded-full bg-forest-950/70 px-3 py-1.5 backdrop-blur">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    status === "live" ? "bg-emerald-400" : status === "connecting" ? "animate-pulse bg-gold-400" : "bg-ivory-100/40"
                  )}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-ivory-100/80">
                  {status === "live" ? "Aira is live" : status === "connecting" ? "Connecting to Aira…" : "Aira · demo avatar"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Minimize Aira"
                className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-forest-950/70 text-ivory-100 backdrop-blur hover:bg-forest-950/90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label="Show Aira full screen"
              className="block"
            >
              <AiraCard className={cn(listening && "ring-4 ring-red-400/40")} />
              <span className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-forest-950/70 text-ivory-100/90 backdrop-blur">
                <Maximize2 className="h-2.5 w-2.5" />
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
