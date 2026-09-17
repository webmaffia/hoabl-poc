"use client";

import { seedFromString } from "@/lib/urgency";

// Deterministic "city lights" speckle — a handful of small glowing points
// scattered over the globe's surface, positioned once from a fixed seed
// rather than re-randomized on every render.
const LIGHTS = Array.from({ length: 16 }, (_, i) => {
  const seed = seedFromString(`globe-light-${i}`);
  return {
    left: 10 + (seed % 80),
    top: 8 + ((seed >> 4) % 84),
    size: 1 + (seed % 2),
    delay: (seed % 30) / 10,
  };
});

export function AiGlobe({ intensity = 0, size = 160 }: { intensity?: number; size?: number }) {
  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `
          radial-gradient(circle at 32% 26%, rgba(255,255,255,0.22), transparent 32%),
          radial-gradient(circle at 62% 72%, rgba(212,175,90,0.22), transparent 42%),
          radial-gradient(circle at 50% 50%, #3d2361 0%, #251143 45%, #140a26 76%, #08040f 100%)
        `,
        boxShadow: `inset -22px -18px 46px rgba(0,0,0,0.6), inset 12px 10px 26px rgba(190,150,255,0.16), 0 0 ${
          60 + intensity * 40
        }px ${10 + intensity * 10}px rgba(126,74,201,${0.3 + intensity * 0.2})`,
      }}
    >
      {/* latitude banding */}
      <div
        className="absolute inset-0 overflow-hidden rounded-full opacity-40"
        style={{
          backgroundImage: "repeating-linear-gradient(4deg, transparent 0 16px, rgba(255,255,255,0.05) 16px 17px)",
        }}
      />
      {/* city-light speckle */}
      {LIGHTS.map((l, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-gold-200"
          style={{
            left: `${l.left}%`,
            top: `${l.top}%`,
            width: l.size,
            height: l.size,
            boxShadow: "0 0 3px 1px rgba(230,200,140,0.8)",
            animation: `aira-globe-twinkle 3.4s ease-in-out ${l.delay}s infinite`,
          }}
        />
      ))}
      {/* rim light */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: "inset 6px -6px 20px rgba(212,175,90,0.18)" }}
      />

      <style jsx global>{`
        @keyframes aira-globe-twinkle {
          0%, 100% {
            opacity: 0.25;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
