import type { ExecuteResult } from "@cosmjs/cosmwasm-stargate";

export type EnvironmentType = "production" | "development";
export interface TgUserData {
  allows_write_to_pm: null;
  first_name: string;
  id: number;
  language_code: string;
  last_name: string | null;
  photo_url: string;
  username: string;
}
export type ExecuteResultOrUndefined = ExecuteResult | undefined;

export interface Invoice {
  id: string;
  description: string;
  issuerTelegramId: number;
  issuerFirstName: string;
  issuerLastName: string | null;
  issuerTelegramHandle: string | null;
  issueDate: number;
  invoiceValidity: number | "valid";
  issuerId: string | null; // optional Id for the product or the service that the seller is creating the invoice
  amount: number;
  unit: string;
  address: string;
}
export interface SignedInvoice extends Invoice {
  signature: string;
}
