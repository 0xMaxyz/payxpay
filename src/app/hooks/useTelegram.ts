import { useEffect, useState } from "react";

export const useTelegram = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const setTelegramUi = function () {
        const tg = window.Telegram.WebApp;
        // set header and bottom bar color to secondary color
        tg.setHeaderColor("secondary_bg_color");
        tg.setBottomBarColor("secondary_bg_color");
      };
      const tg = window.Telegram.WebApp;

      // Read initial theme
      setTheme(tg.colorScheme);

      // Listen for theme change
      const handleThemeChange = () => {
        setTheme(tg.colorScheme);
      };

      tg.onEvent("themeChanged", handleThemeChange);

      // set other Tg ui related properties
      setTelegramUi();

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
