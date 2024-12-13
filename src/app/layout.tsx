"use client";
import Script from "next/script";
import { AbstraxionProvider } from "@burnt-labs/abstraxion";

import "./globals.css";
import { pxpContract } from "./consts";
import { TelegramProvider } from "./context/TelegramContext";
import Body from "./components/Body";

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
      <AbstraxionProvider
        config={{
          contracts: [pxpContract],
          rpcUrl: "https://rpc.xion-testnet-1.burnt.com:443",
          restUrl: "https://api.xion-testnet-1.burnt.com",
        }}
      >
        <TelegramProvider>
          <Body>{children}</Body>
        </TelegramProvider>
      </AbstraxionProvider>
    </html>
  );
}
