import React from "react";
import Image from "next/image";
import Header from "./header";
import Navbar from "./navbar";
import { useTelegramContext } from "../context/TelegramContext";

const Body = ({ children }: { children: React.ReactNode }) => {
  const { isAllowed, loading } = useTelegramContext();
  return (
    <body className="flex flex-col h-screen app-container">
      <Header />
      {loading ? (
        <main className="flex flex-col items-center justify-center min-h-screen text-center">
          <Image
            className="logo-color"
            width="200"
            height="100"
            src="/assets/img/logo.png"
            alt="PayxPay logo"
          />
          <span className="loading loading-infinity loading-lg"></span>
        </main>
      ) : isAllowed ? (
        <main className="flex-grow overflow-y-auto pb-16">{children}</main>
      ) : (
        <main className="flex items-center justify-center min-h-screen text-center">
          <p className="text-lg font-semibold">
            This app is only available on Telegram.
          </p>
        </main>
      )}

      <Navbar />
    </body>
  );
};
export default Body;
