/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        theater: {
          burgundy: {
            50: "#FDF5F7",
            100: "#F9E6EB",
            200: "#F3C2CE",
            300: "#E99EB0",
            400: "#D96A85",
            500: "#C9365A",
            600: "#A82B4A",
            700: "#7C1D3F",
            800: "#5A152E",
            900: "#3D0E1F",
          },
          gold: {
            50: "#FDF9EE",
            100: "#FBF0CF",
            200: "#F6E09F",
            300: "#EFD16F",
            400: "#E8C13F",
            500: "#D4AF37",
            600: "#B8942E",
            700: "#967826",
            800: "#745C1D",
            900: "#524015",
          },
          ink: {
            50: "#F5F5F7",
            100: "#E6E6EA",
            200: "#BFC3CC",
            300: "#989FAE",
            400: "#6B7487",
            500: "#3E4960",
            600: "#2D3548",
            700: "#1A1A2E",
            800: "#121221",
            900: "#0A0A14",
          },
          parchment: {
            50: "#FDFCFA",
            100: "#F8F5EF",
            200: "#F0EADD",
            300: "#E8E4DE",
            400: "#D6CFBE",
            500: "#C4BA9E",
            600: "#A89C7D",
            700: "#8C7E5C",
            800: "#6A5F44",
            900: "#48402D",
          },
          forest: {
            700: "#2D4A3E",
          },
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        display: ['"Noto Serif SC"', "Georgia", "serif"],
      },
      boxShadow: {
        "theater-glow": "0 0 30px rgba(212, 175, 55, 0.25)",
        "card-hover": "0 8px 30px rgba(124, 29, 63, 0.15)",
        "inner-gold": "inset 0 1px 0 rgba(212, 175, 55, 0.3)",
      },
      backgroundImage: {
        "theater-gradient":
          "linear-gradient(135deg, #1A1A2E 0%, #2D1B2E 50%, #1A1A2E 100%)",
        "gold-accent":
          "linear-gradient(135deg, #D4AF37 0%, #F6E09F 50%, #D4AF37 100%)",
        "velvet-texture":
          "radial-gradient(ellipse at 20% 20%, rgba(124, 29, 63, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(212, 175, 55, 0.15) 0%, transparent 50%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(212, 175, 55, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(212, 175, 55, 0.6)" },
        },
        "conflict-blink": {
          "0%, 100%": { backgroundColor: "rgba(201, 54, 90, 0.1)" },
          "50%": { backgroundColor: "rgba(201, 54, 90, 0.3)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "conflict-blink": "conflict-blink 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
