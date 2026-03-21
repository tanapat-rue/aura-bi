/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
    extend: {
      colors: {
        surface: {
          0: "#08080d",
          1: "#0e0e14",
          2: "#14141c",
          3: "#1a1a24",
          4: "#22222e",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.06)",
          hover: "rgba(255,255,255,0.12)",
          active: "rgba(255,255,255,0.18)",
        },
        aura: {
          50: "#eef2ff",
          100: "#d9e2ff",
          200: "#bcc9ff",
          300: "#8ea4ff",
          400: "#6b82fc",
          500: "#5468f6",
          600: "#4352eb",
          700: "#3843d2",
          800: "#2e38a9",
          900: "#2b3385",
          950: "#1a1e4e",
        },
        accent: {
          teal: "#2dd4bf",
          pink: "#f472b6",
          amber: "#fbbf24",
          red: "#f87171",
          green: "#4ade80",
          purple: "#a78bfa",
          orange: "#fb923c",
          cyan: "#22d3ee",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(84,104,246,0.15)",
        "glow-lg": "0 0 40px rgba(84,104,246,0.2)",
        card: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideInRight: { from: { opacity: "0", transform: "translateX(8px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        shimmer: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};
