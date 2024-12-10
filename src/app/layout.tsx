"use client";
import "./globals.css";
import { AbstraxionProvider } from "@burnt-labs/abstraxion";

import "@burnt-labs/abstraxion/dist/index.css";
import "@burnt-labs/ui/dist/index.css";
import Script from "next/script";
import { seatContractAddress } from "./consts";
import Header from "./components/header";
import NavigationBar from "./components/navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js"></Script>
      </head>
      <body className="flex flex-col h-screen">
        <AbstraxionProvider
          config={{
            contracts: [seatContractAddress],
            rpcUrl: "https://rpc.xion-testnet-1.burnt.com:443",
            restUrl: "https://api.xion-testnet-1.burnt.com",
          }}
        >
          <Header />
          <NavigationBar />
          <main className="flex-grow overflow-y-auto">{children}</main>
        </AbstraxionProvider>
      </body>
    </html>
  );
}
