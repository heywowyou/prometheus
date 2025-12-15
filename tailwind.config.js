/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // The "Prometheus" Dark Theme
        powder: {
          900: "#0e0f11", // Background
          800: "#181a1c", // Card background: Subtle lift from BG
          700: "#242527", // Borders: Visible but not distracting
        },
        // Brand Action Color (Electric Blue)
        electric: "#0099FF", // Primary Brand

        cloud: {
          500: "#A0A1A4", // Darker buttons etc
          400: "#E4E6EA", // Primary light text and icons
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
