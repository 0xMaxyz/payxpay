"use client";
import Script from "next/script";
import { useEffect } from "react";
import { AbstraxionProvider } from "@burnt-labs/abstraxion";

import "./globals.css";
import { seatContractAddress } from "./consts";
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
      <body className="flex flex-col h-screen">
        {loading && <div>Loading...</div>}
        {isAllowed ? (
          <AbstraxionProvider
            config={{
              contracts: [seatContractAddress],
              rpcUrl: "https://rpc.xion-testnet-1.burnt.com:443",
              restUrl: "https://api.xion-testnet-1.burnt.com",
            }}
          >
            <Header />
            <main className="flex-grow overflow-y-auto pb-16">{children}</main>
            <Navbar />
          </AbstraxionProvider>
        ) : (
          <main className="flex items-center justify-center min-h-screen text-center">
            <p className="text-lg font-semibold">
              This app is only available on Telegram.
            </p>
          </main>
        )}
      </body>
    </html>
  );
}
