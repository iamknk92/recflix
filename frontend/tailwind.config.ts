import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // RecFlix brand colors
        primary: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        dark: {
          100: "#1a1a1a",
          200: "#141414",
          300: "#0a0a0a",
        },
        // Semantic surface tokens
        surface: {
          base: "#141414",
          raised: "#1a1a1a",
          card: "#1e1e2e",
          elevated: "#2a2a3e",
        },
        // Semantic content (text) tokens
        content: {
          primary: "#ffffff",
          secondary: "rgba(255,255,255,0.75)",
          muted: "rgba(255,255,255,0.55)",
          subtle: "rgba(255,255,255,0.35)",
        },
      },
      borderColor: {
        border: "rgba(255,255,255,0.1)",
        "border-hover": "rgba(255,255,255,0.2)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
