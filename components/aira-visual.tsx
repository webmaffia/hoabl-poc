"use client";

import { useEffect, useRef } from "react";
import { useAira } from "@/lib/aira-context";

/**
 * The raw video-or-portrait content for Aira's avatar. Registers its own
 * <video> element with the shared HeyGen session (see lib/aira-context.tsx),
 * so more than one AiraVisual can be on screen at once (e.g. the persistent
 * header panel and a screen's larger hero avatar) and both show the same
 * live feed.
 */
export function AiraVisual({ className }: { className?: string }) {
  const { status, attachVideo, detachVideo } = useAira();
  const videoEl = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoEl.current;
    if (status === "live" && el) attachVideo(el);
    return () => detachVideo(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (status !== "live") {
    return <AiraPortrait className={className} />;
  }

  return <video ref={videoEl} autoPlay playsInline className={className ?? "h-full w-full object-cover"} />;
}

export function AiraPortrait({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={className ?? "h-full w-full"}
      role="img"
      aria-label="Aira, AI land advisor"
    >
      <defs>
        <radialGradient id="airaBgShared" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#3B1F5C" />
          <stop offset="100%" stopColor="#0A0310" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#airaBgShared)" />
      <circle cx="50" cy="42" r="20" fill="#F8F6F2" />
      <path d="M50 20c12 0 20 9 20 20 0 3-1 6-2 8-2-6-8-9-18-9s-16 3-18 9c-1-2-2-5-2-8 0-11 8-20 20-20z" fill="#241536" />
      <path d="M18 92c3-16 15-26 32-26s29 10 32 26" fill="#AC8336" opacity="0.9" />
      <path d="M18 92c3-16 15-24 32-24s29 8 32 24" fill="#0A0310" opacity="0.35" />
    </svg>
  );
}
