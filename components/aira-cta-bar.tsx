"use client";

import { motion } from "framer-motion";
import { Mic, MessageCircle, VolumeX } from "lucide-react";
import { useVoice } from "@/lib/voice-command-context";
import { useAira } from "@/lib/aira-context";
import { cn } from "@/lib/utils";

/**
 * A fixed, non-draggable pill toolbar pinned to the bottom of every screen.
 * "Talk" is the default, primary action — tapping it (or just starting to
 * talk) expands Aira to full screen (see aira-panel.tsx). "Chat" is a
 * secondary, opt-in switch to a typed 50/50 split view (aira-chat-dock.tsx)
 * for when voice isn't convenient — never the default. A "stop" control
 * appears here (rather than on individual screens) whenever Aira is
 * actually talking, so it's available everywhere in the app, not just one
 * screen.
 */
export function AiraCtaBar() {
  const { supported, listening, mode, setMode, toggleListening } = useVoice();
  const { isSpeaking, stopSpeaking } = useAira();

  const handleMicTap = () => {
    if (mode !== "talk") setMode("talk");
    toggleListening();
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-forest-950/90 p-1 shadow-elevated backdrop-blur">
        {isSpeaking && (
          <button
            type="button"
            onClick={stopSpeaking}
            aria-label="Stop Aira talking"
            className="flex items-center gap-1.5 rounded-full bg-forest-800 px-3 py-2 text-[13px] font-medium text-ivory-100 hover:bg-forest-700"
          >
            <VolumeX className="h-4 w-4 shrink-0" />
          </button>
        )}
        {supported && (
          <button
            type="button"
            onClick={handleMicTap}
            aria-label="Talk to Aira"
            aria-pressed={mode === "talk" && listening}
            className={cn(
              "relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
              mode === "talk" && listening ? "bg-red-500 text-white" : "bg-forest-800 text-ivory-100"
            )}
          >
            {mode === "talk" && listening && (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-red-400"
                animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <Mic className="h-4 w-4 shrink-0" />
            {mode === "talk" && listening ? "Listening…" : "Talk to Aira"}
          </button>
        )}

        <button
          type="button"
          onClick={() => setMode("chat")}
          aria-label="Chat with Aira instead"
          aria-pressed={mode === "chat"}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
            mode === "chat" ? "bg-gold-500 text-forest-950" : "bg-forest-800 text-ivory-100"
          )}
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          Chat
        </button>
      </div>
    </div>
  );
}
