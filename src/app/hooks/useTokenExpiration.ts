import { useTelegramContext } from "../context/TelegramContext";
import { useEffect } from "react";

export const useTokenExpiration = () => {
  const { token, WebApp, userData } = useTelegramContext();
  useEffect(() => {
    if (token) {
      const t = token.split(".")[1];
      const decoded = JSON.parse(atob(t));
      const expiration = decoded.exp;
      const id = decoded.id;
      const currentTime = Math.floor(Date.now() / 1000);

      if (expiration < currentTime) {
        WebApp?.showPopup(
          {
            title: "Session Expired",
            message: "Session expired, please close and re-open the app",
            buttons: [{ type: "destructive", text: "Close" }],
          },
          () => window.Telegram.WebApp.close()
        );
      }

      if (userData && userData.id !== id) {
        WebApp?.showPopup(
          {
            title: "Invalid token",
            message:
              "The Authentication token is invalid, please close and re-open the app",
            buttons: [{ type: "destructive", text: "Close" }],
          },
          () => window.Telegram.WebApp.close()
        );
      }
    }
  }, [token, WebApp, userData]);
};
