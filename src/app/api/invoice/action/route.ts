import { deleteInvoice, getInvoice } from "@/app/db";
import { SignedInvoice } from "@/types";
import {
  handleApproveInvoice,
  handleConfirmInvoice,
  handleRefundInvoice,
  handleRejectInvoice,
} from "@/utils/invoice-actions";
import { decodeInvoice } from "@/utils/tools";
import { verifyJWTAndReferer } from "@/utils/verify_jwt";
import { NextRequest, NextResponse } from "next/server";

export type InvoiceAction =
  | "confirm"
  | "approve"
  | "reject"
  | "refund"
  | "delete";
export async function POST(req: NextRequest) {
  async function handleActions(tgId: number) {
    try {
      const { invoiceId, action, reason } = await req.json();
      if (!invoiceId || !action) {
        return NextResponse.json(
          { error: "Missing required variables." },
          { status: 400 }
        );
      }

      // get invoice from db
      const invDto = await getInvoice(invoiceId);
      if (!invDto) {
        return NextResponse.json(
          { error: "No invoice found." },
          { status: 400 }
        );
      }
      const invoice = decodeInvoice<SignedInvoice>(invDto.invoice);
      if (
        (action as InvoiceAction) === "delete" &&
        invoice.issuerTelegramId.toString() === tgId.toString() &&
        !invDto.create_tx &&
        !invDto.out_tx
      ) {
        // can be deleted
        const res = await deleteInvoice(invoiceId);
        if (res && res === 1) {
          return NextResponse.json(
            { id: invoiceId, action, result: true },
            { status: 200 }
          );
        } else {
          return NextResponse.json(
            { error: "Can't remove the invoice" },
            { status: 400 }
          );
        }
      }
      if (
        (action as InvoiceAction) === "approve" &&
        invDto.payer_tg_id.toString() === tgId.toString()
      ) {
        // payer can approve
        const res = await handleApproveInvoice(invoice, invDto);
        if (res instanceof NextResponse) {
          return res;
        } else {
          return NextResponse.json(
            { id: invoiceId, action, result: true },
            { status: 200 }
          );
        }
      } else if (
        (action as InvoiceAction) === "confirm" &&
        invoice.issuerTelegramId.toString() === tgId.toString()
      ) {
        // issuer can confirm
        const res = await handleConfirmInvoice(invoice, invDto);
        if (res instanceof NextResponse) {
          return res;
        } else {
          return NextResponse.json(
            { id: invoiceId, action, result: true },
            { status: 200 }
          );
        }
      } else if (
        (action as InvoiceAction) === "refund" &&
        invDto.payer_tg_id.toString() === tgId.toString() &&
        !invDto.is_confirmed
      ) {
        console.log("Refunding");
        // payer can refund
        const res = await handleRefundInvoice(invoice, invDto);
        if (res instanceof NextResponse) {
          return res;
        } else {
          return NextResponse.json(
            { id: invoiceId, action, result: true },
            { status: 200 }
          );
        }
      } else if (
        (action as InvoiceAction) === "reject" &&
        invDto.payer_tg_id.toString() === tgId.toString()
      ) {
        // payer can reject
        const res = await handleRejectInvoice(invoice, invDto, reason);
        if (res instanceof NextResponse) {
          return res;
        } else {
          return NextResponse.json(
            { id: invoiceId, action, result: true },
            { status: 200 }
          );
        }
      } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }
    } catch (error) {
      console.error("Error processing invoice:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
  if (process.env.NEXT_PUBLIC_ENV === "development") {
    // mock tg_id
    return await handleActions(6376040916);
  } else {
    // verify token
    const jwtPayload = verifyJWTAndReferer(req);
    if (jwtPayload instanceof NextResponse) {
      return jwtPayload;
    }
    if (typeof jwtPayload === "string") {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }
    const tgId = jwtPayload.id;
    return await handleActions(tgId);
  }
}
