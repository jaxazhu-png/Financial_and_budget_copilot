/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // Scope every utility under .uc06-root so the ported UC-06 page is isolated
  // and Tailwind never touches the rest of the app (which uses plain CSS).
  important: ".uc06-root",
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        momahGreen: {
          50: "#ecfdf3",
          100: "#dff6e7",
          200: "#b8eacb",
          300: "#88d8ad",
          400: "#54c08a",
          500: "#25935f",
          600: "#1b8354",
          700: "#166a45",
          800: "#14573a",
          950: "#092a1e",
        },
        neutralDark: {
          800: "#1f2a37",
          900: "#111927",
          950: "#0d121c",
        },
      },
      fontFamily: {
        sans: ["IBM Plex Sans Arabic", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
