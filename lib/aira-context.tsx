"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { fetchHeygenToken } from "./heygen";

export type AiraStatus = "connecting" | "live" | "fallback";

interface AiraContextValue {
  status: AiraStatus;
  caption: string;
  isSpeaking: boolean;
  /** Register a <video> element to receive the live track (supports more than one at once — e.g. the persistent header panel and a screen's hero avatar). */
  attachVideo: (el: HTMLVideoElement | null) => void;
  /** Unregister a previously-attached element (call on unmount). */
  detachVideo: (el: HTMLVideoElement | null) => void;
  speak: (text: string) => void;
  /** Cuts off whatever Aira is currently saying — used both when a new
   * line needs to start immediately (so she never lags behind the screen
   * the user has already moved on to) and by an explicit "stop" control. */
  stopSpeaking: () => void;
}

const AiraContext = createContext<AiraContextValue | null>(null);

// Rough reading-pace estimate for the local fallback's simulated speaking state.
const MS_PER_CHAR = 45;
const MIN_SPEAK_MS = 1400;
const MAX_SPEAK_MS = 6000;

export function AiraProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AiraStatus>("connecting");
  const [caption, setCaption] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const sessionRef = useRef<any>(null);
  const startedRef = useRef(false);
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elementsRef = useRef<Set<HTMLVideoElement>>(new Set());
  const gestureOccurredRef = useRef(false);
  // The most recent speak() text that arrived while the session was still
  // "connecting" (not yet "live") — HeyGen's session.repeat() was never
  // actually called for it, so it must be replayed once the session goes
  // live, or that line is silently lost (this was happening for screen 1's
  // opening line on every load, since connecting takes several seconds).
  const pendingSpeechRef = useRef<string | null>(null);

  const attachToAll = useCallback(() => {
    if (!sessionRef.current) return;
    elementsRef.current.forEach((el) => {
      try {
        sessionRef.current.attach(el);
      } catch {
        /* element may not be mounted anymore */
      }
    });
  }, []);

  useEffect(() => {
    // Aira starts speaking on screen 1 before the user has clicked anything,
    // so browsers block that first line's audio (autoplay-with-sound
    // policy) even though the video track plays fine. Unmute on every user
    // gesture (not just the first) — deliberately NOT { once: true }: if the
    // gesture happens before the HeyGen session finishes connecting (it can
    // take 5-12s), there are no video elements registered yet, a one-shot
    // listener would fire on nothing and never run again, and every screen
    // after that would stay silent for the rest of the session.
    function unlockAudio() {
      gestureOccurredRef.current = true;
      elementsRef.current.forEach((el) => {
        el.muted = false;
        el.play().catch(() => {});
      });
    }
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    // Guards against React 18 Strict Mode's dev-only double-invoke of this
    // effect (mount -> cleanup -> mount, synchronously, before any awaits
    // resolve). startedRef persists across that double-invoke (same ref
    // object), so the *second* invocation's connect() call is skipped here
    // — meaning the FIRST invocation's connect() is the one that must be
    // allowed to run to completion. Deliberately no per-invocation
    // "cancelled" flag: that would let the Strict Mode phantom cleanup
    // (which fires immediately after the first mount) abort the very
    // connect() call this ref exists to protect.
    if (startedRef.current) return;
    startedRef.current = true;

    async function connect() {
      const token = await fetchHeygenToken();
      if (!token) {
        setStatus("fallback");
        return;
      }

      try {
        const mod = await import("@heygen/liveavatar-web-sdk");
        const { LiveAvatarSession, SessionEvent, AgentEventsEnum } = mod;

        const session = new LiveAvatarSession(token);
        sessionRef.current = session;

        session.on(SessionEvent.SESSION_STREAM_READY, () => attachToAll());
        session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => setIsSpeaking(true));
        session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => setIsSpeaking(false));
        session.on(SessionEvent.SESSION_DISCONNECTED, () => setStatus("fallback"));

        await session.start();

        setStatus("live");
        attachToAll();
        if (pendingSpeechRef.current) {
          try {
            session.repeat(pendingSpeechRef.current);
          } catch {
            /* ignore — nothing more we can do here */
          }
          pendingSpeechRef.current = null;
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[Aira] HeyGen LiveAvatar session failed, falling back:", err);
        setStatus("fallback");
      }
    }

    connect();

    // This provider wraps the whole app and is not expected to unmount
    // during normal use, so real teardown here is best-effort only.
    return () => {
      sessionRef.current?.stop?.().catch(() => {});
    };
  }, []);

  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return;
    elementsRef.current.add(el);
    if (gestureOccurredRef.current) el.muted = false;
    if (sessionRef.current) {
      try {
        sessionRef.current.attach(el);
      } catch {
        /* session not ready yet — attachToAll() will retry on stream-ready */
      }
    }
  }, []);

  const detachVideo = useCallback((el: HTMLVideoElement | null) => {
    if (el) elementsRef.current.delete(el);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (speakTimerRef.current) {
      clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
    pendingSpeechRef.current = null;
    setIsSpeaking(false);
    if (sessionRef.current) {
      try {
        sessionRef.current.interrupt();
      } catch {
        /* nothing more we can do here */
      }
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      setCaption(text);
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current);

      if (status === "live" && sessionRef.current) {
        try {
          // HeyGen queues repeat() calls rather than replacing the current
          // line — without interrupting first, answering a question before
          // Aira finishes the previous one queues both up, so she keeps
          // talking about an earlier question after the user has already
          // moved on. Interrupting first keeps her in sync with the screen.
          sessionRef.current.interrupt();
          sessionRef.current.repeat(text);
        } catch {
          /* live speak failed — caption still updated above */
        }
        return;
      }

      if (status === "connecting") {
        // Session isn't live yet — remember this line so it can be replayed
        // the moment the session connects, instead of being silently lost.
        pendingSpeechRef.current = text;
      }

      // Fallback: simulate a speaking state so the local portrait still feels alive.
      const duration = Math.min(MAX_SPEAK_MS, Math.max(MIN_SPEAK_MS, text.length * MS_PER_CHAR));
      setIsSpeaking(true);
      speakTimerRef.current = setTimeout(() => setIsSpeaking(false), duration);
    },
    [status]
  );

  return (
    <AiraContext.Provider value={{ status, caption, isSpeaking, attachVideo, detachVideo, speak, stopSpeaking }}>
      {children}
    </AiraContext.Provider>
  );
}

export function useAira() {
  const ctx = useContext(AiraContext);
  if (!ctx) throw new Error("useAira must be used within an AiraProvider");
  return ctx;
}
