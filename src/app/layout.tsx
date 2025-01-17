/* eslint-disable @next/next/google-font-display */
/* eslint-disable @next/next/no-page-custom-font */
"use client";
import Script from "next/script";
import { AbstraxionProvider } from "@burnt-labs/abstraxion";

import "./globals.css";
import { pxpTreasury, xionREST, xionRPC } from "./consts";
import { TelegramProvider } from "./context/TelegramContext";
import Body from "./components/body";
import { NotificationProvider } from "./context/NotificationContext";
import { PxpContractProvider } from "./context/PxpContractContext";
import CheckToken from "./components/tokenExpiryCheck";

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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="flex flex-col h-screen app-container">
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <AbstraxionProvider
          config={{
            treasury: pxpTreasury,
            rpcUrl: xionRPC,
            restUrl: xionREST,
          }}
        >
          <NotificationProvider>
            <TelegramProvider>
              <CheckToken />
              <PxpContractProvider>
                <Body>{children}</Body>
              </PxpContractProvider>
            </TelegramProvider>
          </NotificationProvider>
        </AbstraxionProvider>
      </body>
    </html>
  );
}
