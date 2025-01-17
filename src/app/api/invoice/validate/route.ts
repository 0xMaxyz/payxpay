import { SignedInvoice } from "@/types";
import { decodeInvoice, signInvoice } from "@/utils/tools";
import { NextRequest, NextResponse } from "next/server";

const bot_token = process.env.BOT_TOKEN as string;

export async function POST(req: NextRequest) {
  const referer = req.headers.get("referer");
  if (
    !referer ||
    !referer.startsWith(
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL as string}`
    )
  ) {
    return NextResponse.json({ error: "Forbidden." }, { status: 401 });
  }
  try {
    const { invoice: encodedInvoice } = await req.json();

    if (!encodedInvoice) {
      return NextResponse.json({ error: "Missing invoice." }, { status: 400 });
    }
    // Decode and sign the invoice
    const signedInvoice = decodeInvoice<SignedInvoice>(encodedInvoice);
    const { signature, ...invoice } = signedInvoice;
    const calcSignature = signInvoice(invoice, bot_token);
    const isValid = calcSignature === signature;
    return NextResponse.json(
      {
        message: `${isValid ? "Valid" : "Invalid"} Signature`,
        isValid,
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
