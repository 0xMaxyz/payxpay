"use client";
import Script from "next/script";
import { useEffect } from "react";
import { AbstraxionProvider } from "@burnt-labs/abstraxion";
import Image from "next/image";

import "./globals.css";
import { pxpContract } from "./consts";
import Header from "./components/header";
import { useTelegram } from "./hooks/useTelegram";
import { useIsAllowed } from "./hooks/useIsAllowed";
import Navbar from "./components/navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAllowed, loading } = useIsAllowed();
  const { theme } = useTelegram();

  useEffect(() => {
    if (isAllowed) {
      document.documentElement.setAttribute("data-theme", "telegram");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, [isAllowed, theme]);

  return (
    <html lang="en">
      <head>
        <Script
          strategy="beforeInteractive"
          onLoad={() => console.log("Telegram WebApp script loaded!")}
          src="https://telegram.org/js/telegram-web-app.js"
        ></Script>
      </head>
      <AbstraxionProvider
        config={{
          contracts: [pxpContract],
          rpcUrl: "https://rpc.xion-testnet-1.burnt.com:443",
          restUrl: "https://api.xion-testnet-1.burnt.com",
        }}
      >
        <body className="flex flex-col h-screen">
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
      </AbstraxionProvider>
    </html>
  );
}
