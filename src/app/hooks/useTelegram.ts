import { useEffect, useState } from "react";

export const useTelegram = () => {
  const [WebApp, setWebApp] = useState<typeof window.Telegram.WebApp | null>(
    null
  );
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      console.log("tg found");
      tg.ready();

      // set webapp
      setWebApp(tg);

      // Set header and bottom bar colors
      tg.setHeaderColor("secondary_bg_color");
      tg.setBottomBarColor("secondary_bg_color");

      // Read initial theme
      setTheme(tg.colorScheme);

      // Listen for theme change
      const handleThemeChange = () => {
        console.log("handleThemeChange called");
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
    WebApp,
  };
};
