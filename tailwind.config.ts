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
      {
        telegram: {
          "base-100": "var(--tg-theme-bg-color)",
          "base-content": "var(--tg-theme-text-color)",
          primary: "var(--tg-theme-button-color)",
          "base-200": "var(--tg-theme-header-bg-color)",
          "base-300": "var(--tg-theme-bottom-bar-bg-color)",
          info: "var(--tg-theme-accent-text-color)",
          accent: "var(--tg-theme-accent-text-color)",
          "primary-content": "var(--tg-theme-button-text-color)",
          error: "var(--tg-theme-destructive-text-color)",
          neutral: "var(--tg-theme-hint-color)",
          link: "var(--tg-theme-link-color)",
          secondary: "var(--tg-theme-secondary-bg-color)",
          "neutral-content": "var(--tg-theme-subtitle-text-color)",
        },
      },
    ],
  },
};
export default config;
