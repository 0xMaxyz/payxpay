import { addInvoice } from "@/app/db";
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
    const { encodedInvoice, tgHash } = await req.json();

    if (!encodedInvoice || !tgHash) {
      return NextResponse.json(
        { error: "Missing required variables." },
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
    // then the attached tgHash is valid
    const user: TgUserData = JSON.parse(
      Object.fromEntries(new URLSearchParams(tgHash)).user
    );
    if (user.id !== invoice.issuerTelegramId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const signature = signInvoice(invoice, bot_token);
    // create the signed invoice
    const signedInvoice = encodeSignedInvoice(invoice, signature);

    // since everything is ok till now, we'll save the invoice in the db
    const resp = await addInvoice(
      invoice.id,
      invoice.issuerTelegramId.toString(),
      signedInvoice
    );
    if (resp) {
      return NextResponse.json(
        {
          message: "Invoice signed and and saved",
          id: resp,
          signedInvoice,
        },
        { status: 200 }
      );
    }
    throw new Error("Error processing the invoice.");
  } catch (error) {
    console.error("Error processing invoice:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
