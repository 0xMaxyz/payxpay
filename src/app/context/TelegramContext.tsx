import React, { createContext, useEffect, useState } from "react";
import { EnvironmentType, TgUserData } from "../types";

interface TelegramContextProps {
  WebApp: typeof window.Telegram.WebApp | null;
  userData: TgUserData | null;
  isAllowed: boolean;
  loading: boolean;
  theme: "light" | "dark";
}

export const TelegramContext = createContext<TelegramContextProps | undefined>(
  undefined
);

export const TelegramProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  console.log("We're in provider");
  const [WebApp, setWebApp] = useState<typeof window.Telegram.WebApp | null>(
    null
  );
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [userData, setUserData] = useState<TgUserData | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const isProduction =
    (process.env.NEXT_PUBLIC_ENV as EnvironmentType) === "production";
  useEffect(() => {
    const validateInitData = async (initData: string) => {
      try {
        const response = await fetch(
          `/api/telegram/validate-userdata?initData=${encodeURIComponent(
            initData
          )}`
        );
        const data = await response.json();
        console.log(`Received data from api call:${data}`);

        if (response.ok && data.isValid) {
          console.info("Validation successful");
          setIsAllowed(true);
          const user = Object.fromEntries(new URLSearchParams(initData));
          setUserData(JSON.parse(user.user));
          // set the html theme to telegram
          document.documentElement.setAttribute("data-theme", "telegram");
        } else {
          console.warn("Validation failed");
          setIsAllowed(false);
          setUserData(null);
        }
      } catch (error) {
        console.error(`Error validating user data: ${error}`);
        setIsAllowed(false);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    if (!isProduction) {
      console.log("Env is development");
      // In development, skip validation for testing purposes
      setIsAllowed(true);
      setUserData(null);
      setLoading(false);
    } else {
      console.log("Env is production");
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        const tgWebApp = window.Telegram.WebApp;
        tgWebApp.ready();
        console.log("Telegram webapp is ready");
        setWebApp(tgWebApp);

        // set theme
        setTheme(tgWebApp.colorScheme);

        // set header and footer colors in TMA
        tgWebApp.setHeaderColor("secondary_bg_color");
        tgWebApp.setBottomBarColor("secondary_bg_color");

        // Listen for theme change
        const handleThemeChange = () => {
          console.log("handleThemeChange called");
          setTheme(tgWebApp.colorScheme);
        };
        tgWebApp.onEvent("themeChanged", handleThemeChange);

        const initData = tgWebApp.initData;
        if (initData) {
          validateInitData(initData);
        } else {
          setLoading(false);
        }

        // Cleanup event listener
        return () => {
          tgWebApp.offEvent("themeChanged", handleThemeChange);
        };
      }
    }
  }, [isProduction]);
  return (
    <TelegramContext.Provider
      value={{ WebApp, userData, isAllowed, loading, theme }}
    >
      {children}
    </TelegramContext.Provider>
  );
};
