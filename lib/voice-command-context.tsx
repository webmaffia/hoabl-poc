"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export interface VoiceCommand {
  /** One or more phrases that should trigger this command (e.g. an option's label plus synonyms). */
  labels: string[];
  action: () => void;
}

export type InteractionMode = "talk" | "chat";

interface VoiceContextValue {
  /** Whether the browser supports speech recognition at all (Safari/Firefox largely don't). */
  supported: boolean;
  listening: boolean;
  /** The most recent thing the user said (by voice or typed chat), for on-screen feedback. */
  heard: string | null;
  toggleListening: () => void;
  /** Feed typed chat text through the same matching engine voice recognition uses. */
  submitText: (text: string) => void;
  /** Screens call this (via useVoiceCommands) to register what they can respond to while mounted. */
  registerCommands: (commands: VoiceCommand[]) => () => void;
  /**
   * "talk" (Aira full-screen, voice-driven) is the default presentation;
   * "chat" is an opt-in secondary mode for typing instead — shared between
   * the CTA bar and the avatar widget so both stay in sync.
   */
  mode: InteractionMode;
  setMode: (mode: InteractionMode) => void;
  /**
   * Whether Aira's avatar is shown expanded, in the same bottom-half split
   * used by chat (see app/page.tsx) rather than as a full-screen overlay.
   * Lives here so both the CTA bar and the floating widget can read/set it.
   */
  avatarExpanded: boolean;
  setAvatarExpanded: (expanded: boolean) => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

/** Score how well a spoken phrase matches a command label: substring match beats partial word overlap. */
function matchScore(heard: string, label: string): number {
  const h = normalize(heard);
  const l = normalize(label);
  if (!h || !l) return 0;
  if (h === l) return 1000;
  if (h.includes(l) || l.includes(h)) return 100 + l.length;
  const hWords = new Set(h.split(/\s+/));
  const lWords = l.split(/\s+/);
  const overlap = lWords.filter((w) => hWords.has(w)).length;
  return overlap / lWords.length >= 0.6 ? overlap : 0;
}

export function VoiceCommandProvider({ children }: { children: React.ReactNode }) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const [mode, setMode] = useState<InteractionMode>("talk");
  const [avatarExpanded, setAvatarExpanded] = useState(false);

  const recognitionRef = useRef<any>(null);
  const commandsRef = useRef<VoiceCommand[]>([]);

  const registerCommands = useCallback((commands: VoiceCommand[]) => {
    commandsRef.current = commands;
    return () => {
      // Guard against an out-of-order unmount cleanup clearing a newer
      // screen's just-registered commands (defensive — this app's
      // AnimatePresence mode="wait" shouldn't overlap screens anyway).
      if (commandsRef.current === commands) commandsRef.current = [];
    };
  }, []);

  const handleTranscript = useCallback((text: string) => {
    setHeard(text);
    let best: VoiceCommand | null = null;
    let bestScore = 0;
    for (const cmd of commandsRef.current) {
      for (const label of cmd.labels) {
        const score = matchScore(text, label);
        if (score > bestScore) {
          bestScore = score;
          best = cmd;
        }
      }
    }
    if (best) best.action();
  }, []);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";
    recognition.onresult = (e: any) => {
      const text = e.results[e.results.length - 1][0].transcript;
      handleTranscript(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
    };
  }, [handleTranscript]);

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      setHeard(null);
      try {
        recognition.start();
        setListening(true);
      } catch {
        /* already started — ignore */
      }
    }
  }, [listening]);

  const submitText = useCallback(
    (text: string) => {
      if (text.trim()) handleTranscript(text.trim());
    },
    [handleTranscript]
  );

  return (
    <VoiceContext.Provider
      value={{
        supported,
        listening,
        heard,
        toggleListening,
        submitText,
        registerCommands,
        mode,
        setMode,
        avatarExpanded,
        setAvatarExpanded,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be used within a VoiceCommandProvider");
  return ctx;
}

/**
 * Register the given voice commands for as long as the calling screen is
 * mounted. Deliberately re-registers on every render (no dependency array)
 * rather than only when label text changes: a command's `action` closure
 * often captures per-render state (e.g. "which step am I on"), and only
 * re-running when labels change would leave that closure stale — the
 * command would keep acting on whatever state existed when the screen first
 * mounted. registerCommands() is a cheap ref assignment, so re-running it
 * every render costs nothing meaningful.
 */
export function useVoiceCommands(commands: VoiceCommand[]) {
  const ctx = useContext(VoiceContext);

  useEffect(() => {
    if (!ctx) return;
    return ctx.registerCommands(commands);
  });
}
