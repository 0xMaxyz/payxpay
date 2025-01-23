import { Invoice, TgUserData } from "@/types";
import crypto from "crypto";
export const blockExplorerUrl = (txHash: string) => {
  return `https://testnet.xion.explorers.guru/transaction/${txHash}`;
};
export const getTimestampInSeconds = (date: Date | null) => {
  if (!date) return 0;
  const d = new Date(date);
  return Math.floor(d.getTime() / 1000);
};
export const shortenAddress = (bech32Address: string) => {
  return `${bech32Address.slice(0, 11)}...${bech32Address.slice(-6)}`;
};

export const signInvoice = (invoice: Invoice, bot_token: string): string => {
  const payload = JSON.stringify(invoice);
  return crypto.createHmac("sha256", bot_token).update(payload).digest("hex");
};
export const decodeInvoice = <T extends Invoice>(encodedInvoice: string): T => {
  return JSON.parse(decodeURIComponent(encodedInvoice)) as T;
};
export const encodeSignedInvoice = (
  invoice: Invoice,
  signature: string
): string => {
  return encodeURIComponent(JSON.stringify({ ...invoice, signature }));
};

export const createInvoiceId = (invoice: Invoice): Invoice => {
  if (invoice) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...noIdInvoice } = invoice;
    const calcId = crypto
      .createHash("sha256")
      .update(JSON.stringify(noIdInvoice))
      .digest("hex");
    return { id: calcId, ...noIdInvoice } as Invoice;
  } else {
    return invoice;
  }
};

export const getShareableLink = (invoice: string) => {
  return `https://t.me/payxpay_bot?start=invoice=${invoice}`;
};

export const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};
export const getTgUserLink = (id: string) => {
  return `tg://user?id=${id}`;
};

export const copyFromClipboard = async () => {
  if (!navigator.clipboard) {
    console.error("Clipboard API not available");
    throw new Error("Clipboard API not available");
  }
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    console.error("Failed to copy text from clipboard:", error);
    throw error;
  }
};

export const formatBalance = (
  rawBalance: string,
  decimals: number,
  name?: string
): string => {
  const balanceBigInt = BigInt(rawBalance);
  const divisor = BigInt(10 ** decimals);
  const wholeUnits = balanceBigInt / divisor;
  const fractionalPart = balanceBigInt % divisor;
  const fractionalString = fractionalPart.toString().padStart(decimals, "0");
  return `${wholeUnits}.${fractionalString}`
    .replace(/\.?0+$/, "")
    .concat(name ? ` ${name}` : "");
};

export type IbcDenomTrace = {
  denom_trace: {
    path: string;
    base_denom: string;
  };
};

export const queryIbcDenom = async (hash: string) => {
  const XION_REST = process.env.NEXT_PUBLIC_XION_REST!;
  const apiUrl = `${XION_REST}/ibc/apps/transfer/v1/denom_traces/${hash}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: IbcDenomTrace = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching denom trace:", error);
    throw error;
  }
};

export const decodeInitData = (init: string) => {
  const decoded = new URLSearchParams(init);
  const userData = decoded.get("user");
  let user_id: number = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: TgUserData | undefined = undefined;
  if (userData) {
    const usrJson = decodeURIComponent(userData);
    user = JSON.parse(usrJson);
    user_id = user?.id ?? 0;
  }
  return {
    user_id: user_id,
    hash: decoded.get("hash") ?? "",
    signature: decoded.get("signature") ?? "",
    auth_date: 1000 * Number.parseInt(decoded.get("auth_date")!),
    user: user ?? undefined,
  };
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchWithRetries = async (
  url: string,
  options: RequestInit,
  retries: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (attempt < retries) {
        console.warn(`Attempt ${attempt} failed. Retrying in a second...`);
        await delay(1000);
      } else {
        console.error(`All ${retries} attempts failed.`);
        throw error;
      }
    }
  }
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};
