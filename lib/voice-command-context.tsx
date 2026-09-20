"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAira } from "./aira-context";
import { useJourney } from "./journey-context";
import { answerQuestion, QaContext } from "./aira-qa";

export interface VoiceCommand {
  /** One or more phrases that should trigger this command (e.g. an option's label plus synonyms). */
  labels: string[];
  action: (heard: string) => void;
  /** Optional custom matcher, checked before label-based fuzzy matching — for
   * open-ended answers a fixed label list can't cover (e.g. "40", "40L", "40
   * lakh" all meaning the same budget bucket). When any registered command's
   * `test` matches, it wins outright regardless of label scores. */
  test?: (heard: string) => boolean;
}

export type InteractionMode = "talk" | "chat";

interface VoiceContextValue {
  /** Whether the browser supports speech recognition at all (Safari/Firefox largely don't). */
  supported: boolean;
  listening: boolean;
  /** The most recent thing the user said (by voice or typed chat), for on-screen feedback. */
  heard: string | null;
  /** Why the mic last failed (permission denied, no speech detected, etc.) — surfaced in the UI instead of failing silently. */
  micError: string | null;
  toggleListening: () => void;
  /** Proactively triggers the browser's mic permission prompt (e.g. on the
   * welcome screen) so it's already granted by the time the user taps "Talk
   * to Aira" later, instead of interrupting them mid-flow. */
  requestMicPermission: () => void;
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
  /**
   * Whether a screen is presenting Aira as a full-screen "video call" (see
   * Screen02BuyerProfile's question flow) rather than the small floating
   * bottom-right widget. Lives here so app/page.tsx can hide that widget
   * for the duration — otherwise it would float redundantly on top of the
   * full-screen avatar the screen itself is already showing.
   */
  callActive: boolean;
  setCallActive: (active: boolean) => void;
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
  const [micError, setMicError] = useState<string | null>(null);
  const [mode, setMode] = useState<InteractionMode>("talk");
  const [avatarExpanded, setAvatarExpanded] = useState(false);
  const [callActive, setCallActive] = useState(false);

  const recognitionRef = useRef<any>(null);
  const commandsRef = useRef<VoiceCommand[]>([]);

  // "Latest ref" pattern: handleTranscript below is a stable useCallback with
  // no dependencies (recreating it would tear down and rebuild the
  // SpeechRecognition instance — see its effect). These refs let it always
  // read the current speak() and journey context without needing to be
  // recreated whenever the buyer's profile, project or pocket changes.
  const { speak } = useAira();
  const journey = useJourney();
  const speakRef = useRef(speak);
  speakRef.current = speak;
  const qaContextRef = useRef<QaContext>({
    buyerProfile: journey.buyerProfile,
    selectedProject: journey.selectedProject,
    projectPockets: journey.projectPockets,
    pocketPreferences: journey.pocketPreferences,
    activePocketId: journey.activePocketId,
  });
  qaContextRef.current = {
    buyerProfile: journey.buyerProfile,
    selectedProject: journey.selectedProject,
    projectPockets: journey.projectPockets,
    pocketPreferences: journey.pocketPreferences,
    activePocketId: journey.activePocketId,
  };

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

    const testMatch = commandsRef.current.find((cmd) => cmd.test?.(text));
    if (testMatch) {
      testMatch.action(text);
      return;
    }

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
    if (best) {
      best.action(text);
      return;
    }

    // Nothing on the current screen recognizes this as a command — treat it
    // as an actual question instead of staying silent, and answer it using
    // the buyer's live context (budget, selected project, focused pocket…).
    speakRef.current(answerQuestion(text, qaContextRef.current));
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
      setMicError(null);
      handleTranscript(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = (e: any) => {
      // eslint-disable-next-line no-console
      console.error("[Voice] SpeechRecognition error:", e.error);
      const messages: Record<string, string> = {
        "not-allowed": "Mic access is blocked — allow microphone permission for this site and try again.",
        "service-not-allowed": "Mic access is blocked — allow microphone permission for this site and try again.",
        "no-speech": "Didn't catch that — try again.",
        "audio-capture": "No microphone found on this device.",
        network: "Voice recognition needs an internet connection.",
      };
      setMicError(messages[e.error] || "Voice recognition failed — try again.");
      setListening(false);
    };
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
      // getUserMedia/SpeechRecognition are only available in a "secure
      // context" — https, or http on localhost. Opening the app over plain
      // http via a LAN IP (e.g. testing on a phone) silently fails with the
      // browser's generic "not-allowed" error, which looks identical to the
      // user having denied mic access — so we catch it separately here with
      // an actionable message instead of the confusing default one.
      if (typeof window !== "undefined" && window.isSecureContext === false) {
        setMicError("Voice needs a secure connection — open this over HTTPS (or localhost) to use the mic.");
        return;
      }
      setHeard(null);
      setMicError(null);
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

  const requestMicPermission = useCallback(() => {
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      setMicError("Voice needs a secure connection — open this over HTTPS (or localhost) to use the mic.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) return;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => stream.getTracks().forEach((t) => t.stop()))
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[Voice] Mic permission request failed:", err);
        if (err?.name === "NotAllowedError") {
          setMicError("Mic access is blocked — allow microphone permission for this site and try again.");
        } else if (err?.name === "NotFoundError") {
          setMicError("No microphone found on this device.");
        }
      });
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        supported,
        listening,
        heard,
        micError,
        toggleListening,
        requestMicPermission,
        submitText,
        registerCommands,
        mode,
        setMode,
        avatarExpanded,
        setAvatarExpanded,
        callActive,
        setCallActive,
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
