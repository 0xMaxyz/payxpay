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
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          ...require("daisyui/src/theming/themes")["light"],
          "base-100": "var(--base-100)",
          "base-content": "var(--base-content)",
        },
      },
    ],
  },
};
export default config;
