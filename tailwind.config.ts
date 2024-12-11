import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      "light",
      {
        telegram: {
          primary: "var(--tg-theme-button-color)",
          "primary-content": "var(--tg-theme-button-text-color)",
          secondary: "var(--tg-theme-secondary-bg-color)",
          "secondary-content": "var(--tg-theme-text-color)",
          accent: "var(--tg-theme-link-color)",
          "accent-content": "var(--tg-theme-accent-text-color)",
          neutral: "var(--tg-theme-hint-color)",
          "neutral-content": "var(--tg-theme-subtitle-text-color)",
          "base-100": "var(--tg-theme-bg-color)",
          "base-200": "var(--tg-theme-section-bg-color)",
          "base-300": "var(--tg-theme-bottom-bar-bg-color)",
          "base-content": "var(--tg-theme-text-color)",
          success: "var(--tg-theme-section-header-text-color)",
          info: "var(--tg-theme-accent-text-color)",
          warning: "var(--tg-theme-destructive-text-color)",
          error: "var(--tg-theme-destructive-text-color)",
        },
      },
    ],
  },
};
export default config;
