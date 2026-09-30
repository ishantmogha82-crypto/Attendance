/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B1220",
          900: "#101A2E",
          800: "#16223B",
          700: "#1E2E4D",
        },
        brand: {
          50: "#EEF4FF",
          100: "#DCE8FF",
          200: "#B5CFFF",
          300: "#86AEFF",
          400: "#5A8CFF",
          500: "#3366FF",
          600: "#254DDB",
          700: "#1B3AAF",
          800: "#162E86",
          900: "#122566",
        },
        mint: {
          400: "#3ED9B8",
          500: "#1FBF9C",
          600: "#159E80",
        },
        amber: {
          400: "#F5B942",
          500: "#E8A11B",
        },
        coral: {
          400: "#FF6B6B",
          500: "#F0475A",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.12)",
        pop: "0 12px 32px -8px rgba(51, 102, 255, 0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        scanline: "scanline 2.2s linear infinite",
        pulseRing: "pulseRing 1.6s cubic-bezier(0.2,0.6,0.4,1) infinite",
      },
    },
  },
  plugins: [],
};
