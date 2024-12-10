import { useEffect, useState } from "react";
import { useTelegram } from "./useTelegram";

export const useIsAllowed = () => {
  const { WebApp } = useTelegram();
  const [isAllowed, setIsAllowed] = useState(false);
  const isProduction = process.env.NEXT_PUBLIC_ENV === "production";

  useEffect(() => {
    if (typeof window !== "undefined" && WebApp) {
      const isTelegramMiniApp = WebApp?.platform === "telegram";

      if (isProduction) {
        setIsAllowed(isTelegramMiniApp);
      } else {
        setIsAllowed(true);
      }
    }
  }, [WebApp, isProduction]);

  return isAllowed;
};
