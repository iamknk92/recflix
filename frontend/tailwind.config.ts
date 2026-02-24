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
        // ── Brand (Orange) ─────────────────────────
        primary: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },

        // ── Surface (아이보리 기반) ────────────────
        surface: {
          base: "#FAF8F5",     // 페이지 배경 (아이보리)
          raised: "#F5F1EC",   // 약간 올라온 영역
          card: "#FFFFFF",     // 카드/패널 배경 (흰색)
          elevated: "#FFF8F0", // 호버/강조 카드 (따뜻한 흰색)
          overlay: "#FFFFFF",  // 모달/드롭다운
        },

        // ── Text ───────────────────────────────────
        content: {
          primary: "#1A1A1A",
          secondary: "#5C5C5C",
          muted: "#8C8C8C",
          subtle: "#B0B0B0",
        },

        // ── Border ─────────────────────────────────
        border: {
          DEFAULT: "rgba(0,0,0,0.08)",
          hover: "rgba(0,0,0,0.15)",
          focus: "#F97316",
        },

        // ── Accent (MBTI 궁합 등 보조 컬러) ───────
        accent: {
          purple: "#a855f7",
          indigo: "#818cf8",
          blue: "#60a5fa",
          slate: "#94a3b8",
        },

        // ── 하위호환: 기존 dark 토큰 (점진 제거용) ─
        dark: {
          100: "#F5F1EC",
          200: "#FAF8F5",
          300: "#FAF8F5",
        },
      },

      // ── Border Radius 통일 ───────────────────────
      borderRadius: {
        button: "0.625rem",
        card: "0.875rem",
        input: "0.625rem",
        badge: "0.5rem",
        full: "9999px",
      },

      // ── Spacing (페이지 레이아웃) ────────────────
      maxWidth: {
        page: "72rem",
        narrow: "56rem",
      },

      // ── Animation ────────────────────────────────
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "shimmer": "shimmer 1.5s infinite",
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
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      // ── Font Size 체계 ───────────────────────────
      fontSize: {
        "page-title": ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        "section-title": ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        "card-title": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "500" }],
        "caption": ["0.75rem", { lineHeight: "1rem", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
};

export default config;