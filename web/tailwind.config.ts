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
          50: "#f0f5f9",
          100: "#e0ebf3",
          200: "#c8dbe9",
          300: "#a3c5d9",
          400: "#7aa7c4",
          500: "#5a8db0",
          600: "#477594",
          700: "#3c5f77",
          800: "#354f62",
          900: "#304251",
          950: "#1e2a36",
        },
        darwin: {
          50: "#fdf8f3",
          100: "#faefda",
          200: "#f5dcb3",
          300: "#eec07c",
          400: "#e79c45",
          500: "#e17d1e",
          600: "#d56013",
          700: "#ad4811",
          800: "#8b3d14",
          900: "#713413",
          950: "#3d1708",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
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