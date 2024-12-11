import { useEffect, useState } from "react";

export const useTelegram = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      // Read initial theme
      setTheme(tg.colorScheme);

      // Listen for theme change
      const handleThemeChange = () => {
        setTheme(tg.colorScheme);
      };

      tg.onEvent("themeChanged", handleThemeChange);

      // Cleanup event listener
      return () => {
        tg.offEvent("themeChanged", handleThemeChange);
      };
    }
  }, [theme]);

  return {
    theme,
    WebApp: typeof window !== "undefined" ? window.Telegram?.WebApp : null,
  };
};
