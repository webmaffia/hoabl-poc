"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";
import { useVoice } from "@/lib/voice-command-context";
import { useAira } from "@/lib/aira-context";
import { AiraVisual } from "./aira-visual";
import { cn } from "@/lib/utils";

export interface ChatMsg {
  id: string;
  from: "aira" | "user";
  text: string;
}

/**
 * Chat mode's presentation: a 50/50 split with the rest of the screen (see
 * app/page.tsx) rather than an overlay on top of it. Opt-in secondary mode —
 * "talk" (Aira full-screen) is the default; this only shows once the user
 * explicitly switches via the CTA bar's Chat button.
 */
export function AiraChatDock() {
  const { mode, setMode, supported, submitText } = useVoice();
  const { caption } = useAira();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!caption) return;
    setMessages((prev) => [...prev, { id: `a-${Date.now()}`, from: "aira", text: caption }]);
  }, [caption]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  if (mode !== "chat") return null;

  const send = () => {
    if (!draft.trim()) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, from: "user", text: draft.trim() }]);
    submitText(draft.trim());
    setDraft("");
  };

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex h-full w-full flex-col overflow-hidden border-t border-gold-400/30 bg-forest-950"
    >
      <div className="flex items-center gap-2 px-3.5 pb-2 pt-3">
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-gold-400/70">
          <AiraVisual className="h-full w-full object-cover" />
        </div>
        <span className="flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
        </span>
        <span className="text-xs font-semibold text-ivory-100">Aira</span>
        <button
          type="button"
          onClick={() => setMode("talk")}
          className="ml-auto rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-ivory-100/80 hover:bg-white/15"
        >
          {supported ? "Switch to talk" : "Back to avatar"}
        </button>
      </div>

      <div ref={listRef} className="no-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3.5 pb-2">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-1.5 text-[12px] leading-snug",
                m.from === "user"
                  ? "ml-auto rounded-br-sm bg-forest-700/80 text-ivory-100"
                  : "rounded-bl-sm bg-white/10 text-ivory-100/90"
              )}
            >
              <span className="font-semibold text-gold-300">{m.from === "aira" ? "Aira" : "You"}: </span>
              {m.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-white/10 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Type a message…"
          style={{ colorScheme: "dark" }}
          className="min-w-0 flex-1 rounded-full bg-forest-800 px-4 py-2.5 text-sm text-ivory-100 outline-none placeholder:text-ivory-100/40 focus:bg-forest-700"
        />
        <button
          type="button"
          onClick={send}
          disabled={!draft.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500 text-forest-950 disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
