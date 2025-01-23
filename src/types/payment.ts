import Decimal from "decimal.js";
import { SignedInvoice } from ".";
import { Coin } from "@cosmjs/stargate";

export interface NamedCoin extends Coin {
  name: string;
}

export interface PaymentParams {
  amount: Decimal;
  token: NamedCoin;
  invoice: SignedInvoice;
  paymentType: "direct" | "escrow";
}
