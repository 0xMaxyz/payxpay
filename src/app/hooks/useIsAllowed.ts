import { useEffect, useState } from "react";
import { useTelegram } from "./useTelegram";
import { EnvironmentType, TgUserData } from "../types";
import logger from "@/lib/logger";

export const useIsAllowed = () => {
  const { WebApp } = useTelegram();
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const isProduction = (process.env.ENV as EnvironmentType) === "production";
  const [userData, setuserData] = useState<TgUserData | null>(null);

  useEffect(() => {
    const validateInitData = async (initData: string) => {
      try {
        console.log("Making api call");
        const response = await fetch(
          `/api/telegram/validate-userdata?initData=${initData}`
        );
        const data = await response.json();

        if (response.ok && data.isValid) {
          console.log(`The init data is valid, checked on backend`);
          setIsAllowed(true);
          // set user data
          const u = Object.fromEntries(new URLSearchParams(initData));
          setuserData(JSON.parse(u.user));
          console.log(`UserData is: ${userData}`);
        } else {
          setIsAllowed(false);
          setuserData(null);
        }
      } catch (error) {
        logger.error(`Error validating user data: ${error}`);
        setIsAllowed(false);
        setuserData(null);
      } finally {
        setLoading(false);
      }
    };
    if (!isProduction) {
      setIsAllowed(true);
      setuserData(null);

      setLoading(false);
    } else {
      if (typeof window !== "undefined" && WebApp) {
        // make an api call to validate userdata, if the returned value is true, then the user is using the telegram
        const initData = WebApp.initData;
        if (initData) {
          validateInitData(initData);
        } else {
          setLoading(false);
        }
      }
    }
  }, [WebApp, isProduction]);

  return { isAllowed, loading, userData };
};
