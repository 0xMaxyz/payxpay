"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { AbstraxionProvider } from "@burnt-labs/abstraxion";

import "@burnt-labs/abstraxion/dist/index.css";
import "@burnt-labs/ui/dist/index.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });
export const seatContractAddress =
  "xion1z70cvc08qv5764zeg3dykcyymj5z6nu4sqr7x8vl4zjef2gyp69s9mmdka";
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
      <body className={inter.className}>
        <AbstraxionProvider
          config={{
            contracts: [seatContractAddress],
            rpcUrl: "https://rpc.xion-testnet-1.burnt.com:443",
            restUrl: "https://api.xion-testnet-1.burnt.com",
          }}
        >
          {children}
        </AbstraxionProvider>
      </body>
    </html>
  );
}
