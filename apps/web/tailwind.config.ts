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
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FAF8F3",
          dark: "#15120E",
        },
        ink: {
          DEFAULT: "#1F1B16",
          muted: "#6B6359",
          dark: "#E9E2D6",
        },
        accent: {
          DEFAULT: "#A0522D",
          soft: "#D9A87A",
        },
        border: {
          DEFAULT: "#E5DED1",
          dark: "#2A241D",
        },
      },
      fontFamily: {
        serif: ["Lora", "Source Serif Pro", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        reader: "680px",
      },
      lineHeight: {
        reader: "1.75",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
