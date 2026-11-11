import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vira: { DEFAULT: "#0B8A4E", dark: "#087241", light: "#DDF2E6" },
        noite: { DEFAULT: "#0F2A1E", soft: "#1B3D2C" },
        sol: { DEFAULT: "#FFC83D", light: "#FFF3CF" },
        festa: { DEFAULT: "#FF6A3D", light: "#FFE1D6", dark: "#B4401C" },
        areia: { DEFAULT: "#F5F5F2", dark: "#E9E9E3" },
        tinta: { DEFAULT: "#16231C", soft: "#5B6660" },
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: { field: "14px", card: "22px" },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pop: { "0%": { transform: "scale(.6)", opacity: "0" }, "70%": { transform: "scale(1.08)" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },
      animation: { rise: "rise .35s ease-out both", pop: "pop .45s ease-out both" },
    },
  },
  plugins: [],
} satisfies Config;
