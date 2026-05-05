import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FAF8F3",
          deep: "#F2EFE6",
          dark: "#15120E",
          "dark-elev": "#1C1812",
        },
        ink: {
          DEFAULT: "#1F1B16",
          dim: "#5A5249",
          muted: "#8A8175",
          dark: "#E9E2D6",
          "dark-dim": "#A99F90",
        },
        accent: {
          DEFAULT: "#A0522D",
          deep: "#7A3E22",
          soft: "#D9A87A",
          glow: "#E9C9A8",
        },
        rule: {
          DEFAULT: "#E5DED1",
          strong: "#CFC5B2",
          dark: "#2A241D",
          "dark-strong": "#3A3127",
        },
        border: {
          DEFAULT: "#E5DED1",
          dark: "#2A241D",
        },
      },
      fontFamily: {
        serif: ["var(--font-display)", "Lora", "Georgia", "serif"],
        body: ["var(--font-body)", "Lora", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Fluid editorial scale
        "display-xl": ["clamp(3rem, 8vw, 6.5rem)", { lineHeight: "0.95", letterSpacing: "-0.035em", fontWeight: "600" }],
        "display-lg": ["clamp(2.25rem, 5.5vw, 4.25rem)", { lineHeight: "1.0", letterSpacing: "-0.03em", fontWeight: "600" }],
        "display": ["clamp(1.75rem, 3.5vw, 2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
        "title": ["clamp(1.25rem, 2vw, 1.625rem)", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        "lede": ["clamp(1.0625rem, 1.4vw, 1.25rem)", { lineHeight: "1.6" }],
        "reader": ["1.125rem", { lineHeight: "1.8" }],
      },
      maxWidth: {
        reader: "38rem",
        prose: "44rem",
        page: "75rem",
      },
      lineHeight: {
        reader: "1.8",
      },
      letterSpacing: {
        smallcap: "0.18em",
      },
      spacing: {
        "section": "5rem",
        "section-lg": "8rem",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 400ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
