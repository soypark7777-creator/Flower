import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        petal: {
          blush: "#f7d4d8",
          sage: "#6f8b6b",
          moss: "#273b2f",
          cream: "#fffaf4",
          dusk: "#9a7ea7"
        }
      },
      boxShadow: {
        bloom: "0 20px 60px rgba(39, 59, 47, 0.12)"
      },
      backgroundImage: {
        "garden-glow":
          "radial-gradient(circle at top left, rgba(247, 212, 216, 0.9), transparent 35%), radial-gradient(circle at bottom right, rgba(154, 126, 167, 0.22), transparent 30%)"
      }
    }
  },
  plugins: []
};

export default config;
