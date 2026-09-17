"use client";

import { cn } from "@/lib/utils";

// Each ring is built from two halves of the same ellipse — a "back" half
// (clipped to its top, rendered behind the core) and a "front" half (clipped
// to its bottom, rendered in front of the core). Because the core sits
// z-between them, the ring visually wraps around the 3D sphere instead of
// looking like a flat oval spinning on top of it. A single gold particle,
// split the same way with two perfectly in-phase copies, appears to travel
// in one continuous loop — visible on the back arc while "behind" the core,
// then handing off to the front arc as it crosses the mid-line.
const RINGS = [
  { w: 168, h: 56, duration: 9, reverse: false, opacity: 0.6 },
  { w: 204, h: 70, duration: 13, reverse: true, opacity: 0.46 },
  { w: 240, h: 86, duration: 18, reverse: false, opacity: 0.32 },
  { w: 274, h: 100, duration: 24, reverse: true, opacity: 0.2 },
];

function RingHalf({
  w,
  h,
  half,
  duration,
  reverse,
  opacity,
  intensity,
  zIndex,
}: {
  w: number;
  h: number;
  half: "back" | "front";
  duration: number;
  reverse: boolean;
  opacity: number;
  intensity: number;
  zIndex: number;
}) {
  const isFront = half === "front";
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        width: w,
        height: h,
        transform: "translate(-50%, -50%)",
        clipPath: isFront ? "inset(50% 0 0 0)" : "inset(0 0 50% 0)",
        zIndex,
      }}
    >
      <div
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: `rgba(212, 175, 90, ${isFront ? opacity : opacity * 0.55})`,
          boxShadow: isFront
            ? `0 0 ${10 + intensity * 14}px rgba(212, 175, 90, ${opacity * 0.5 + intensity * 0.25})`
            : "none",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ animation: `aira-ring-orbit ${duration}s linear infinite ${reverse ? "reverse" : "normal"}` }}
      >
        <span
          className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-300"
          style={{
            opacity: isFront ? 1 : 0.55,
            boxShadow: isFront ? "0 0 8px 3px rgba(212,175,90,0.85)" : "0 0 4px 1px rgba(212,175,90,0.5)",
          }}
        />
      </div>
    </div>
  );
}

export function AiCoreVisual({ pulsing = true, intensity = 0 }: { pulsing?: boolean; intensity?: number }) {
  return (
    <div className="relative flex h-[300px] w-full items-center justify-center" style={{ perspective: 700 }}>
      {/* Back halves — rendered under the core */}
      {RINGS.map((ring, i) => (
        <RingHalf key={`back-${i}`} half="back" zIndex={5 + i} intensity={intensity} {...ring} />
      ))}

      {/* Central AI core */}
      <div
        className={cn("relative z-20 h-32 w-32 rounded-full", pulsing && "animate-[aira-core-pulse_3.2s_ease-in-out_infinite]")}
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

      {/* Front halves — rendered over the core, completing the wrap */}
      {RINGS.map((ring, i) => (
        <RingHalf key={`front-${i}`} half="front" zIndex={30 + i} intensity={intensity} {...ring} />
      ))}

      <style jsx global>{`
        @keyframes aira-ring-orbit {
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
