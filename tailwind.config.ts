import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // HoABL brand palette (sampled from hoabl.com's own CSS) — deep
        // plum/near-black grounds with a bronze-gold accent, replacing the
        // prototype's original green placeholder theme. Token names (forest/
        // gold/ivory) are kept as-is so every screen that already references
        // them re-themes automatically.
        forest: {
          950: "#0A0310",
          900: "#151519",
          800: "#1A0F2E",
          700: "#2B153F",
          600: "#3B1F5C",
          500: "#4B2E73",
        },
        // Renamed in spirit only (kept as "ivory" since that token is used
        // ~250+ places) — now a light lavender/purple scale instead of the
        // earlier cream tone, to match the plum/gold brand palette instead
        // of reading as yellowish.
        ivory: {
          DEFAULT: "#F5F1FA",
          50: "#FCFAFE",
          100: "#F5F1FA",
          200: "#E9E1F4",
          300: "#DCCFEC",
        },
        gold: {
          DEFAULT: "#AC8336",
          50: "#F8EFDD",
          400: "#DDBD81",
          500: "#AC8336",
          600: "#8A6A2B",
        },
      },
      fontFamily: {
        serif: ["'Inria Serif'", "Georgia", "Cambria", "'Times New Roman'", "serif"],
        sans: [
          "'Inria Sans'",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(12,31,23,0.04), 0 8px 24px -8px rgba(12,31,23,0.12)",
        elevated: "0 12px 40px -12px rgba(12,31,23,0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      animation: {
        "pulse-slow": "pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
