"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Maximize2 } from "lucide-react";
import { useVoice } from "@/lib/voice-command-context";
import { AiraCard } from "./aira-card";
import { cn } from "@/lib/utils";

/**
 * Aira's collapsed presence — a fixed floating widget (bottom-right, not
 * draggable), mounted once for the whole journey (see app/page.tsx) so the
 * live HeyGen session (when configured) is never torn down and reconnected
 * between screens.
 *
 * "Talk" is the default mode: tapping the card, or starting to talk via the
 * <AiraCtaBar /> mic, expands her into the same 50/50 bottom-half split used
 * by chat (see <AiraExpandedPanel /> in app/page.tsx) rather than a
 * full-screen overlay — so this widget renders nothing while expanded, and
 * nothing at all in "chat" mode, which has its own dock.
 */
export function AiraPanel() {
  const { listening, mode, avatarExpanded, setAvatarExpanded } = useVoice();

  useEffect(() => {
    if (listening) setAvatarExpanded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  if (mode === "chat" || avatarExpanded) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <motion.div initial={false} className="pointer-events-auto absolute bottom-20 right-4 w-fit">
        <div className="relative">
          <button
            type="button"
            onClick={() => setAvatarExpanded(true)}
            aria-label="Expand Aira"
            className="block"
          >
            <AiraCard className={cn(listening && "ring-4 ring-red-400/40")} />
            <span className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-forest-950/70 text-ivory-100/90 backdrop-blur">
              <Maximize2 className="h-2.5 w-2.5" />
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
