"use client";
import Script from "next/script";
import { useEffect } from "react";
import { AbstraxionProvider } from "@burnt-labs/abstraxion";

import "./globals.css";
import { seatContractAddress } from "./consts";
import NavBar from "./components/navbar";
import { useTelegram } from "./hooks/useTelegram";
import { useIsAllowed } from "./hooks/useIsAllowed";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAllowed, loading } = useIsAllowed();
  const { theme, WebApp } = useTelegram();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme.toString());
  }, [theme]);
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <html lang="en">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js"></Script>
      </head>
      <body className="flex flex-col h-screen">
        {isAllowed ? (
          <AbstraxionProvider
            config={{
              contracts: [seatContractAddress],
              rpcUrl: "https://rpc.xion-testnet-1.burnt.com:443",
              restUrl: "https://api.xion-testnet-1.burnt.com",
            }}
          >
            <NavBar />
            <main className="flex-grow overflow-y-auto">{children}</main>
          </AbstraxionProvider>
        ) : (
          <main className="flex items-center justify-center min-h-screen text-center">
            <p className="text-lg font-semibold">
              This app is only available on Telegram.
              {WebApp?.platform}
            </p>
          </main>
        )}
      </body>
    </html>
  );
}
