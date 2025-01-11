import { HEADERS } from "@/app/consts";
import { getInvoice } from "@/app/db";
import { SignedInvoice } from "@/app/types";
import { createTelegramShareMessage } from "@/utils/telegram-tools";
import { NextRequest, NextResponse } from "next/server";

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
    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return NextResponse.json(
        { error: "Missing required variables." },
        { status: 400 }
      );
    }
    // get invoice and create the prepared message and send it to tg bot api
    const invoiceStr = await getInvoice(invoiceId);
    if (invoiceStr) {
      const signedInvoice = JSON.parse(
        decodeURIComponent(invoiceStr)
      ) as SignedInvoice;
      const savedMsg = await createTelegramShareMessage(signedInvoice);
      console.log("Saved message is: ", savedMsg);
      if (savedMsg) {
        console.log("Saved message created successfully");
        return NextResponse.json(JSON.stringify(savedMsg), {
          status: 200,
          headers: HEADERS,
        });
      }
      console.error("Error creating the saved message");
      throw new Error("Error creating the saved message");
    }
    console.error("Invalid input");
    throw new Error("Invalid input");
  } catch (error) {
    console.error("Error creating the prepared message:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
