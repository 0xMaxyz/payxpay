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
    const { invoice, tgHash } = await req.json();

    if (!invoice || !tgHash) {
      return NextResponse.json(
        { error: "Missing required variables." },
        { status: 400 }
      );
    }
    console.log("Decode and sign the invoice", invoice);
    // Decode and sign the invoice
    const invoiceAsObject = decodeInvoice<Invoice>(invoice);
    console.log(
      "validate the tgHash of the invoice and compare the sent userId with the userId in the hash"
    );
    // validate the tgHash of the invoice and compare the sent userId with the userId in the hash
    const isValid = verifyTelegramWebAppData(tgHash);

    if (!isValid) {
      console.log("Not valid hash", tgHash, invoiceAsObject);
      // the attached hash is not valid
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    // then the attached tgHash is valid
    const user: TgUserData = JSON.parse(
      Object.fromEntries(new URLSearchParams(tgHash)).user
    );
    if (user.id !== invoiceAsObject.issuerTelegramId) {
      console.log("Not valid user", user, invoiceAsObject);
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const signature = signInvoice(invoiceAsObject, bot_token);
    // create the signed invoice
    const signedInvoice = encodeSignedInvoice(invoiceAsObject, signature);

    // since everything is ok till now, we'll save the invoice in the db
    const resp = await addInvoice(
      invoiceAsObject.id,
      invoiceAsObject.issuerTelegramId.toString(),
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
