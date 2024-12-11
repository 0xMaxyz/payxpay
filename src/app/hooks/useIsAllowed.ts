import { useEffect, useState } from "react";
import { useTelegram } from "./useTelegram";
import { EnvironmentType } from "../interfaces";
import logger from "@/lib/logger";

export const useIsAllowed = () => {
  const { WebApp } = useTelegram();
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

        if (response.ok && data.isValid) {
          setIsAllowed(true);
        } else {
          setIsAllowed(false);
        }
      } catch (error) {
        logger.error(`Error validating user data: ${error}`);
        setIsAllowed(false);
      } finally {
        setLoading(false);
      }
    };
    if (!isProduction) {
      setIsAllowed(true);
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

  return { isAllowed, loading };
};
