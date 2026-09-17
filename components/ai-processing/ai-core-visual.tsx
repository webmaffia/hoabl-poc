"use client";

import { cn } from "@/lib/utils";

// Static ring geometry — deliberately not tied to buyer-profile data (that's
// what the orbiting node cards are for). Each ring gets its own radius,
// duration and spin direction so nothing feels synchronized/mechanical.
const RINGS = [
  { w: 168, h: 62, duration: 9, reverse: false, opacity: 0.55, dot: true },
  { w: 202, h: 78, duration: 13, reverse: true, opacity: 0.4, dot: true },
  { w: 236, h: 96, duration: 17, reverse: false, opacity: 0.28, dot: true },
  { w: 268, h: 112, duration: 21, reverse: true, opacity: 0.18, dot: false },
];

export function AiCoreVisual({ pulsing = true, intensity = 0 }: { pulsing?: boolean; intensity?: number }) {
  return (
    <div className="relative flex h-[300px] w-full items-center justify-center">
      {RINGS.map((ring, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            width: ring.w,
            height: ring.h,
            animation: `aira-ring-spin ${ring.duration}s linear infinite ${ring.reverse ? "reverse" : "normal"}`,
          }}
        >
          <div
            className="relative h-full w-full rounded-full border"
            style={{
              borderColor: `rgba(212, 175, 90, ${ring.opacity})`,
              boxShadow: `0 0 ${10 + intensity * 14}px rgba(212, 175, 90, ${ring.opacity * 0.5 + intensity * 0.25})`,
            }}
          >
            {ring.dot && (
              <span
                className="absolute -top-[3px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gold-300"
                style={{ boxShadow: "0 0 6px 2px rgba(212,175,90,0.8)" }}
              />
            )}
          </div>
        </div>
      ))}

      {/* Central AI core */}
      <div
        className={cn("relative h-32 w-32 rounded-full", pulsing && "animate-[aira-core-pulse_3.2s_ease-in-out_infinite]")}
        style={{
          background:
            "radial-gradient(circle at 34% 28%, #4d2c78 0%, #2b1548 42%, #170a28 78%, #0c0616 100%)",
          boxShadow: `0 0 ${50 + intensity * 40}px ${8 + intensity * 10}px rgba(126, 74, 201, ${0.32 + intensity * 0.18}), inset 0 0 26px rgba(255,255,255,0.08), inset -12px -12px 30px rgba(0,0,0,0.55)`,
        }}
      >
        <div
          className="absolute inset-[10px] rounded-full opacity-50"
          style={{
            background: "conic-gradient(from 0deg, transparent, rgba(212,175,90,0.35), transparent 55%)",
            animation: "aira-core-sheen 6s linear infinite",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="font-serif text-[15px] font-semibold tracking-[0.32em] text-gold-200">AIRA</span>
          <span
            className="h-1 w-1 rounded-full bg-gold-300"
            style={{ animation: "aira-core-blink 1.8s ease-in-out infinite" }}
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes aira-ring-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes aira-core-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.035);
          }
        }
        @keyframes aira-core-sheen {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes aira-core-blink {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
