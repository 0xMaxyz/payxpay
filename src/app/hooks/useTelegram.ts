import { useEffect, useState } from "react";

export const useTelegram = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      console.log("tg found");
      tg.ready();

      tg.onEvent("ready", () => {
        console.log("tg is ready");
        // Set header and bottom bar colors
        tg.setHeaderColor("secondary_bg_color");
        tg.setBottomBarColor("secondary_bg_color");
      });

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
  }, []);

  return {
    theme,
    WebApp: typeof window !== "undefined" ? window.Telegram?.WebApp : null,
  };
};
