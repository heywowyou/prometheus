/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic tokens – Musicboard-inspired dark theme (single source of truth)
        background: "#0e0f11",
        surface: "#181a1c",
        "surface-hover": "#1e2023",
        border: "#242527",
        "border-muted": "#2d2f32",
        text: "#E4E6EA",
        "text-muted": "#A0A1A4",
        accent: "#3b82f6", // Softer blue for CTAs and active states
        "accent-hover": "#60a5fa",
        // Legacy aliases (components can migrate to semantic names)
        powder: {
          900: "#0e0f11",
          800: "#181a1c",
          700: "#242527",
        },
        electric: "#3b82f6",
        cloud: {
          500: "#A0A1A4",
          400: "#E4E6EA",
        },
      },
      fontFamily: {
        sans: ["Roboto", "sans-serif"],
        serif: ["EB Garamond", "serif"],
      },
    },
  },
  plugins: [],
};
