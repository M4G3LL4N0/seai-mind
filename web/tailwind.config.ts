import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        seai: {
          50: "#f2f7f1",
          100: "#e4eee3",
          200: "#cbdccb",
          300: "#a8c5aa",
          400: "#7eaa84",
          500: "#5a8b65",
          600: "#3d7351",
          700: "#315e45",
          800: "#294c3b",
          900: "#203c30",
          950: "#10241b",
        },
        slate: {
          50: "#f7f8f5",
          100: "#edf0eb",
          200: "#dce3db",
          300: "#c5d0c6",
          400: "#91a092",
          500: "#637568",
          600: "#4b5e4f",
          700: "#374a3b",
          800: "#26372b",
          900: "#17291e",
          950: "#0c1911",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        display: ["var(--font-lora)", "Georgia", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
