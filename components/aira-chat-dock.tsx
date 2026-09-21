"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minimize2, Send } from "lucide-react";
import { useVoice } from "@/lib/voice-command-context";
import { useAira } from "@/lib/aira-context";
import { useJourney } from "@/lib/journey-context";
import { answerQuestion } from "@/lib/aira-qa";
import { AiraVisual } from "./aira-visual";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = ["What's the price?", "Which pocket suits me?", "Is this refundable?", "Talk to an advisor"];

export interface ChatMsg {
  id: string;
  from: "aira" | "user";
  text: string;
}

/**
 * Chat mode's presentation: a full-screen "video call" takeover (see
 * app/page.tsx) — Aira's live feed fills the whole frame, the same way
 * Screen02BuyerProfile presents her for the opening profiling questions,
 * with message bubbles overlaid near the bottom rather than a small video
 * strip above a plain list.
 *
 * Deliberately does NOT listen to the shared aira-context `caption` — that
 * value also changes from whatever the screen *behind* this overlay happens
 * to be narrating (its own mount effects, timers, etc.), which isn't a
 * response to anything the user typed here and made the transcript look
 * like it was answering a different conversation. Every message shown here
 * is instead generated directly from what the user actually sent, using the
 * same context-aware answer engine as voice mode's fallback.
 */
export function AiraChatDock() {
  const { mode, setMode, setAvatarExpanded, supported } = useVoice();
  const { status, speak } = useAira();
  const { buyerProfile, selectedProject, projectPockets, pocketPreferences, activePocketId } = useJourney();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  if (mode !== "chat") return null;

  const send = (text: string) => {
    const question = text.trim();
    if (!question) return;
    setDraft("");
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, from: "user", text: question }]);

    const answer = answerQuestion(question, {
      buyerProfile,
      selectedProject,
      projectPockets,
      pocketPreferences,
      activePocketId,
    });
    setMessages((prev) => [...prev, { id: `a-${Date.now()}`, from: "aira", text: answer }]);
    speak(answer);
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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="relative h-full w-full overflow-hidden bg-forest-950"
    >
      <AiraVisual className="absolute inset-0 h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-forest-950/80 via-transparent to-forest-950/90" />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
        <span className="flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
        </span>
        <div className="text-center">
          <div className="text-[15px] font-semibold text-ivory-50">Aira</div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-ivory-100/70">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                status === "live" ? "bg-emerald-400" : status === "connecting" ? "animate-pulse bg-gold-400" : "bg-ivory-100/40"
              )}
            />
            {status === "live" ? "Live" : status === "connecting" ? "Connecting…" : "AI Land Advisor"}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {supported && (
            <button
              type="button"
              onClick={() => setMode("talk")}
              className="rounded-full bg-forest-950/60 px-2.5 py-1.5 text-[11px] font-medium text-ivory-100/85 backdrop-blur hover:bg-forest-950/80"
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

      {/* Bottom overlay: message stack + starter prompts + input, all on top of Aira's live feed rather than below it. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 px-4 pb-4">
        <div ref={listRef} className="no-scrollbar max-h-[46vh] space-y-2 overflow-y-auto pb-1">
          {messages.length === 0 && (
            <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-forest-950/70 px-4 py-3 text-[13px] leading-snug text-ivory-100/80 shadow-elevated backdrop-blur">
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
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-snug shadow-elevated backdrop-blur",
                  m.from === "user"
                    ? "ml-auto rounded-br-sm bg-gradient-to-r from-gold-500 to-gold-600 text-forest-950"
                    : "rounded-bl-sm bg-forest-950/70 text-ivory-50"
                )}
              >
                {m.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {messages.length === 0 && (
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="shrink-0 rounded-full border border-ivory-100/25 bg-forest-950/50 px-3 py-1.5 text-[11.5px] font-medium text-ivory-50 backdrop-blur hover:border-gold-400/50"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send(draft);
            }}
            placeholder="Ask Aira anything…"
            style={{ colorScheme: "dark" }}
            className="min-w-0 flex-1 rounded-full border border-ivory-100/15 bg-forest-950/60 px-4 py-2.5 text-base text-ivory-100 outline-none backdrop-blur placeholder:text-ivory-100/40 focus:border-gold-400/50"
          />
          <button
            type="button"
            onClick={() => send(draft)}
            disabled={!draft.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-forest-950 shadow-elevated disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
