import { getInvoice } from "@/app/db";
import { SignedInvoice } from "@/types";
import { decodeInvoice, signInvoice } from "@/utils/tools";
import { verifyJWTAndReferer } from "@/utils/verify_jwt";
import { NextRequest, NextResponse } from "next/server";

const bot_token = process.env.BOT_TOKEN as string;

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_ENV !== "development") {
    // verify token
    const jwtPayload = verifyJWTAndReferer(req);
    if (jwtPayload instanceof NextResponse) {
      return jwtPayload;
    }
  }
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required variables." },
        { status: 400 }
      );
    }
    console.log("received id", id);
    const data = await getInvoice(id);
    if (!data) {
      throw new Error("No valid invoice found.");
    }
    const encodedInvoice = data.invoice;
    console.log("invoice is:", encodedInvoice);
    // validate the invoice signature
    const signedInvoice = decodeInvoice<SignedInvoice>(encodedInvoice);
    const { signature, ...invoice } = signedInvoice;
    const calcSignature = signInvoice(invoice, bot_token);
    const isValid = calcSignature === signature;

    if (!isValid) {
      throw new Error("Invalid invoice signature");
    }

    return NextResponse.json(
      {
        invoice: encodedInvoice,
        create_tx: data.create_tx,
        out_tx: data.out_tx,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing invoice:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
