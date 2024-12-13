import { useContext } from "react";
import { TelegramContext } from "../context/TelegramContext";

export const useTelegramContext = () => {
  const context = useContext(TelegramContext);

  if (!context) {
    throw new Error(
      "useTelegramContext must be used within a TelegramProvider"
    );
  }

  return context;
};
