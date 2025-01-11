import { useTelegramContext } from "../context/TelegramContext";
import { useEffect } from "react";
const TokenExpiryCheck = () => {
  const { isTokenExpired, WebApp } = useTelegramContext();
  useEffect(() => {
    if (isTokenExpired) {
      WebApp?.showPopup(
        {
          title: "Session Expired",
          message: "Session expired, please close and re-open the app.",
          buttons: [{ type: "destructive", text: "Close" }],
        },
        () => window.Telegram.WebApp.close()
      );
    }
    // if (invalidId) {
    //   WebApp?.showPopup(
    //     {
    //       title: "Invalid token",
    //       message:
    //         "The Authentication token is invalid, please close and re-open the app",
    //       buttons: [{ type: "destructive", text: "Close" }],
    //     },
    //     () => window.Telegram.WebApp.close()
    //   );
    // }
  }, [isTokenExpired, WebApp]);
  return <></>;
};
export default TokenExpiryCheck;
