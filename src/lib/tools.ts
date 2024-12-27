import { Invoice } from "@/app/types";
import crypto from "crypto";
export const blockExplorerUrl = (txHash: string) => {
  return `https://explorer.burnt.com/xion-testnet-1/tx/${txHash}`;
};
export const getTimestampInSeconds = (date: Date | null) => {
  if (!date) return 0;
  const d = new Date(date);
  return Math.floor(d.getTime() / 1000);
};
export const shortenAddress = (bech32Address: string) => {
  return `${bech32Address.slice(0, 8)}...${bech32Address.slice(-4)}`;
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
  return `https://t.me/payxpaybot?start=invoice=${invoice}`;
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
