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
        forest: {
          950: "#08130F",
          900: "#0C1F17",
          800: "#12301F",
          700: "#1A4229",
          600: "#235534",
          500: "#2F6B43",
        },
        ivory: {
          DEFAULT: "#FBF7EE",
          50: "#FEFDFA",
          100: "#FBF7EE",
          200: "#F4ECD9",
          300: "#EBDFC3",
        },
        gold: {
          DEFAULT: "#B98A3E",
          50: "#F8EFDD",
          400: "#C9A05C",
          500: "#B98A3E",
          600: "#96702F",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "'Times New Roman'", "serif"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Inter",
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
