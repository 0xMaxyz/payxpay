import { Invoice, TgUserData } from "@/app/types";
import verifyTelegramWebAppData from "@/lib/telegram-verifier";
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
    const tgHash = searchParams.get("hash");

    if (!encodedInvoice || !tgHash) {
      return NextResponse.json(
        { error: "Missing invoice/hash." },
        { status: 400 }
      );
    }
    // Decode and sign the invoice
    const invoice = decodeInvoice<Invoice>(encodedInvoice);
    // validate the tgHash of the invoice and compare the sent userId with the userId in the hash
    const isValid = verifyTelegramWebAppData(tgHash);

    if (!isValid) {
      // the attached hash is not valid
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    if (isValid) {
      // then the attached tgHash is valid
      const user: TgUserData = JSON.parse(
        Object.fromEntries(new URLSearchParams(tgHash)).user
      );
      if (user.id !== invoice.issuerTelegramId) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
    }
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
