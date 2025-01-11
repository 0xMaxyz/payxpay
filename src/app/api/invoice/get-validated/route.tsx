import { getInvoice } from "@/app/db";
import { SignedInvoice } from "@/app/types";
import { decodeInvoice, signInvoice } from "@/utils/tools";
import { NextRequest, NextResponse } from "next/server";

const bot_token = process.env.BOT_TOKEN as string;

export async function GET(req: NextRequest) {
  const referer = req.headers.get("referer");
  if (
    !referer ||
    !referer.startsWith(
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL as string}`
    )
  ) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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
    const encodedInvoice = await getInvoice(id);
    if (!encodedInvoice) {
      throw new Error("No valid invoice found.");
    }
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
