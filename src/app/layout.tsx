"use client";
import Script from "next/script";
import { AbstraxionProvider } from "@burnt-labs/abstraxion";

import "./globals.css";
import { pxpContract, pxpTreasury, xionREST, xionRPC } from "./consts";
import { TelegramProvider } from "./context/TelegramContext";
import Body from "./components/body";
import { NotificationProvider } from "./context/NotificationContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          strategy="beforeInteractive"
          src="https://telegram.org/js/telegram-web-app.js"
        ></Script>
      </head>
      <body className="flex flex-col h-screen app-container">
        <AbstraxionProvider
          config={{
            contracts: [pxpContract],
            treasury: pxpTreasury,
            rpcUrl: xionRPC,
            restUrl: xionREST,
          }}
        >
          <NotificationProvider>
            <TelegramProvider>
              <Body>{children}</Body>
            </TelegramProvider>
          </NotificationProvider>
        </AbstraxionProvider>
      </body>
    </html>
  );
}
