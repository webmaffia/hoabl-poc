"use client";

import { ellipsePoint } from "@/lib/orbit-geometry";

export interface RingConfig {
  rx: number;
  ry: number;
  rotDeg: number;
  opacity: number;
  duration: number;
  reverse?: boolean;
  dotCount?: number;
}

/**
 * Two (or more) large tilted rings crossing over the globe, each with a
 * handful of small particles that continuously travel along it — the ring
 * itself is a fixed, static ellipse (already tilted), so only the particle
 * group needs to animate. Nested SVG <g> transforms do the work: the outer
 * group applies the ring's fixed tilt to both the stroke and the particles;
 * the inner group then spins the particles' base (untilted) positions
 * continuously within that same tilted frame.
 */
export function OrbitRings({ cx, cy, rings }: { cx: number; cy: number; rings: RingConfig[] }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 25 }}>
      <defs>
        <filter id="aira-ring-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {rings.map((ring, i) => {
        const dotCount = ring.dotCount ?? 6;
        const dotAngles = Array.from({ length: dotCount }, (_, d) => (360 / dotCount) * d);
        return (
          <g key={i} transform={`rotate(${ring.rotDeg} ${cx} ${cy})`}>
            <ellipse
              cx={cx}
              cy={cy}
              rx={ring.rx}
              ry={ring.ry}
              fill="none"
              stroke={`rgba(212, 175, 90, ${ring.opacity})`}
              strokeWidth={1}
            />
            <g
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                animation: `aira-ring-spin ${ring.duration}s linear infinite ${ring.reverse ? "reverse" : "normal"}`,
              }}
            >
              {dotAngles.map((angle, d) => {
                const p = ellipsePoint(cx, cy, ring.rx, ring.ry, 0, angle);
                const isAccent = d % 4 === 3;
                return (
                  <circle
                    key={d}
                    cx={p.x}
                    cy={p.y}
                    r={isAccent ? 2.6 : 1.8}
                    fill={isAccent ? "#b98af0" : "#f0d48a"}
                    filter="url(#aira-ring-glow)"
                  />
                );
              })}
            </g>
          </g>
        );
      })}

      <style jsx global>{`
        @keyframes aira-ring-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </svg>
  );
}
