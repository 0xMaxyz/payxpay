import { Invoice } from "@/app/types";
import { decodeInvoice, encodeSignedInvoice, signInvoice } from "@/lib/tools";
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
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const encodedInvoice = searchParams.get("invoice");

    if (!encodedInvoice) {
      return NextResponse.json({ error: "Missing invoice." }, { status: 400 });
    }
    // Decode and sign the invoice
    const invoice = decodeInvoice<Invoice>(encodedInvoice);
    const signature = signInvoice(invoice, bot_token);

    return NextResponse.json(
      {
        message: "Invoice signed",
        signedInvoice: encodeSignedInvoice(invoice, signature),
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
