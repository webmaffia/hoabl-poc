"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minimize2, Send } from "lucide-react";
import { useVoice } from "@/lib/voice-command-context";
import { useAira } from "@/lib/aira-context";
import { AiraVisual } from "./aira-visual";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = ["What's the price?", "Which pocket suits me?", "Is this refundable?", "Talk to an advisor"];

export interface ChatMsg {
  id: string;
  from: "aira" | "user";
  text: string;
}

/**
 * Chat mode's presentation: a full-screen takeover (see app/page.tsx), same
 * as the opening profiling questions — not a small dock — since it's opt-in
 * only once the user explicitly switches via the CTA bar's Chat button.
 * Minimizing docks Aira back into the small bottom-right widget rather than
 * just re-showing the previous split, matching how the expanded avatar's own
 * minimize (X) button behaves.
 */
export function AiraChatDock() {
  const { mode, setMode, setAvatarExpanded, supported, submitText } = useVoice();
  const { caption, status } = useAira();
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

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, from: "user", text: text.trim() }]);
    submitText(text.trim());
    setDraft("");
  };

  // Docks Aira back into the small floating bottom-right widget — same
  // destination as the expanded avatar's minimize button — rather than just
  // leaving chat for whatever was showing before.
  const minimize = () => {
    setMode("talk");
    setAvatarExpanded(false);
  };

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="relative flex h-full w-full flex-col overflow-hidden border-t border-gold-400/30 bg-forest-950"
    >
      {/* Same full-bleed "video call" presentation as the opening profiling
          questions (see Screen02BuyerProfile) — Aira's live feed fills the
          backdrop instead of a small circular icon, so chat still feels like
          talking to her, not a plain text widget. */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden">
        <AiraVisual className="absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-forest-950/70 via-forest-950/10 to-forest-950" />
        <div className="absolute inset-x-3 top-2.5 flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
          </span>
          <span className="text-xs font-semibold text-ivory-50">Aira</span>
          <span className="text-[10px] text-ivory-100/60">{status === "live" ? "AI Land Advisor" : "Connecting…"}</span>
          <div className="ml-auto flex items-center gap-1.5">
            {supported && (
              <button
                type="button"
                onClick={() => setMode("talk")}
                className="rounded-full bg-forest-950/60 px-2.5 py-1 text-[11px] font-medium text-ivory-100/85 backdrop-blur hover:bg-forest-950/80"
              >
                Switch to talk
              </button>
            )}
            <button
              type="button"
              onClick={minimize}
              aria-label="Minimize Aira"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-950/60 text-ivory-100 backdrop-blur hover:bg-forest-950/80"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div ref={listRef} className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-3.5 pb-2 pt-3">
        {messages.length === 0 && (
          <p className="px-1 text-[12px] leading-snug text-ivory-100/50">
            Ask me anything — pricing, a specific pocket, KYC, whatever&rsquo;s on your mind.
          </p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug shadow-elevated backdrop-blur",
                m.from === "user"
                  ? "ml-auto rounded-br-sm bg-gradient-to-r from-gold-500 to-gold-600 text-forest-950"
                  : "rounded-bl-sm bg-forest-900/70 text-ivory-50"
              )}
            >
              {m.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {messages.length === 0 && (
        <div className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto px-3.5 pb-2">
          {STARTER_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="shrink-0 rounded-full border border-ivory-100/15 bg-forest-900/50 px-3 py-1.5 text-[11.5px] font-medium text-ivory-100/85 hover:border-gold-400/50"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2 border-t border-white/10 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(draft);
          }}
          placeholder="Ask Aira anything…"
          style={{ colorScheme: "dark" }}
          className="min-w-0 flex-1 rounded-full bg-forest-800 px-4 py-2.5 text-base text-ivory-100 outline-none placeholder:text-ivory-100/40 focus:bg-forest-700"
        />
        <button
          type="button"
          onClick={() => send(draft)}
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
