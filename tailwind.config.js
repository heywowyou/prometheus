/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        powder: "#0e0f11",
        ashe: "#181a1c",
        coal: "#242527",
        cloud: "#e4e6ea",
      },
      fontFamily: {
        sans: ["Roboto", "sans-serif"],
        serif: ["EB Garamond", "serif"],
      },
    },
  },
  plugins: [],
};
