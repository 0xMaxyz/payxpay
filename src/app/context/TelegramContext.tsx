import React, { createContext, useEffect, useState } from "react";
import { EnvironmentType, TgUserData } from "../types";

interface TelegramContextType {
  WebApp: typeof window.Telegram.WebApp | null;
  userData: TgUserData | null;
  isAllowed: boolean;
  loading: boolean;
}

export const TelegramContext = createContext<TelegramContextType | undefined>(
  undefined
);

export const TelegramProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [WebApp, setWebApp] = useState<typeof window.Telegram.WebApp | null>(
    null
  );
  const [userData, setUserData] = useState<TgUserData | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const isProduction = (process.env.ENV as EnvironmentType) === "production";
  useEffect(() => {
    const validateInitData = async (initData: string) => {
      try {
        const response = await fetch(
          `/api/telegram/validate-userdata?initData=${initData}`
        );
        const data = await response.json();
        console.log(`Received data from api call:${data}`);

        if (response.ok && data.isValid) {
          console.info("Validation successful");
          setIsAllowed(true);
          const user = Object.fromEntries(new URLSearchParams(initData));
          setUserData(JSON.parse(user.user));
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
      // In development, skip validation for testing purposes
      setIsAllowed(true);
      setUserData(null);
      setLoading(false);
    } else {
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        const tgWebApp = window.Telegram.WebApp;
        tgWebApp.ready();
        console.log("Telegram webapp is ready");
        setWebApp(tgWebApp);

        const initData = tgWebApp.initData;
        if (initData) {
          validateInitData(initData);
        } else {
          setLoading(false);
        }
      }
    }
  }, [isProduction]);
  return (
    <TelegramContext.Provider value={{ WebApp, userData, isAllowed, loading }}>
      {children}
    </TelegramContext.Provider>
  );
};
