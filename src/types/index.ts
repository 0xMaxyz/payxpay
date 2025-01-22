import type { ExecuteResult } from "@cosmjs/cosmwasm-stargate";

export type EnvironmentType = "production" | "development";
export interface TgUserData {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  language_code: string;
  allows_write_to_pm: boolean;
  photo_url: string;
  [key: string]: unknown;
}
export type ExecuteResultOrUndefined = ExecuteResult | undefined;

export interface Invoice {
  // The id of the invoice
  id: string;
  // The description of the invoice
  description: string;
  // The telegram id of the issuer
  issuerTelegramId: number;
  // The first name of the issuer
  issuerFirstName: string;
  // The last name of the issuer
  issuerLastName: string | null;
  // The telegram handle of the issuer
  issuerTelegramHandle: string | null;
  // The date when the invoice was created
  issueDate: number;
  // The validity of the invoice in seconds
  invoiceValidity: number | "valid";
  // optional Id for the product or the service that the seller is creating the invoice
  issuerPrivateId: string | null;
  // The amount of the invoice
  amount: number;
  // The currency of the invoice
  unit: string;
  // The address of the invoice_issuer
  address: string;
}
export interface SignedInvoice extends Invoice {
  signature: string;
  // // The auth hash of the user which shows that the user is the owner of the invoice
  // tgHash: string;
}

export interface Currency {
  name: string;
  unit: string;
  contract: string;
}
