import { Currency } from "./types";

export const pxpContract: string = process.env.NEXT_PUBLIC_CONTRACT!;
export const pxpTreasury: string = process.env.NEXT_PUBLIC_TREASURY!;
export const xionRPC: string = process.env.NEXT_PUBLIC_XION_RPC!;
export const xionREST: string = process.env.NEXT_PUBLIC_XION_REST!;

export const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

export const CURRENCIES: Array<Currency> = [
  {
    name: "Turkish Lira",
    unit: "TRY",
    contract:
      "0x032a2eba1c2635bf973e95fb62b2c0705c1be2603b9572cc8d5edeaf8744e058",
  },
  {
    name: "South African Rand",
    unit: "ZAR",
    contract:
      "0x389d889017db82bf42141f23b61b8de938a4e2d156e36312175bebf797f493f1",
  },

  {
    name: "Mexican Peso",
    unit: "MXN",
    contract:
      "0xe13b1c1ffb32f34e1be9545583f01ef385fde7f42ee66049d30570dc866b77ca",
  },
  {
    name: "Chinese Yuan",
    unit: "CNH",
    contract:
      "0xeef52e09c878ad41f6a81803e3640fe04dceea727de894edd4ea117e2e332e66",
  },
  {
    name: "Brazilian Real",
    unit: "BRL",
    contract:
      "0xd2db4dbf1aea74e0f666b0e8f73b9580d407f5e5cf931940b06dc633d7a95906",
  },
];

export const JWT_VALIDITY_DURATION = 15; // minutes
