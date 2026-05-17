/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f3f3",
          100: "#efefef",
          200: "#e2e2e2",
          300: "#afafaf",
          500: "#4b4b4b",
          600: "#000000",
          700: "#000000",
          800: "#282828",
          900: "#000000"
        }
      },
      boxShadow: {
        soft: "0 4px 16px rgba(0, 0, 0, 0.12)",
        pill: "0 2px 8px rgba(0, 0, 0, 0.16)"
      }
    }
  },
  plugins: []
};
