import { getInvoice } from "@/app/db";
import { SignedInvoice, TelegramUpdate } from "@/app/types";
import { escapeHtml } from "@/utils/tools";
import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.BOT_TOKEN as string;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

if (!BOT_TOKEN) {
  throw new Error("Telegram bot token is missing");
}

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    console.log(
      `line13: request body is: ${JSON.stringify(body)}, https://${
        process.env.VERCEL_PROJECT_PRODUCTION_URL as string
      }`
    );

    if (!body || !body.message) {
      return NextResponse.json(
        { error: "Invalid request: Missing message payload" },
        { status: 400 }
      );
    }

    const update = body as TelegramUpdate;
    console.log(`line 25: update object is: ${JSON.stringify(update)}`);

    const chatId = update.message?.chat.id;
    console.log(`line 28: chat id  is: ${JSON.stringify(chatId)}`);

    const text = update.message?.text;
    console.log(`line 31: message text  is: ${JSON.stringify(text)}`);

    // Handle `/pay` command with query parameters
    const startCommandRegex = /\/start invoice=([^&]+)/;
    const match = text?.match(startCommandRegex);

    if (match) {
      console.log(`line 40: found /start match`);
      const invoice = match[1]; // Extract "12345"
      console.log(`line 42: invoice id is: ${JSON.stringify(invoice)}`);
      // get the invoice from db
      const inv = await getInvoice(invoice);
      if (!inv) {
        const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `You said: "${text}"`,
          }),
        });
        if (!res.ok) {
          const error = await res.text();
          return NextResponse.json(
            { error: `Failed to send message: ${error}` },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true }, { status: 200 });
      }
      const signedInvoice = JSON.parse(
        decodeURIComponent(inv)
      ) as SignedInvoice;
      console.log("line 48: signed invoice is: ", signedInvoice);
      // Send a message with an inline button linking to your Telegram Mini App
      const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          parse_mode: "HTML",
          // eslint-disable-next-line
          // prettier-ignore
          text: `You received an invoice from <b><a href="tg://user?id=${signedInvoice.issuerTelegramId}">${signedInvoice.issuerFirstName}</a></b>${signedInvoice.issuerTelegramHandle? ` (@${signedInvoice.issuerTelegramHandle})`: ""}.\n<b>Amount:</b> <code>${signedInvoice.amount}</code> $${signedInvoice.unit.replaceAll(' ','').split('-')[1] }\n<b>Description:</b> <code>${escapeHtml( signedInvoice.description )}</code>\nClick pay to complete your payment.\n<u>If their privacy settings allow, you can also chat with them directly.</u>`,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: `Pay`,
                  web_app: {
                    url: `https://${
                      process.env.VERCEL_PROJECT_PRODUCTION_URL as string
                    }/pay?invoice=${invoice}`,
                  },
                },
                {
                  text: `Chat with ${signedInvoice.issuerFirstName}`,
                  url: `tg://user?id=${signedInvoice.issuerTelegramId}`,
                },
              ],
            ],
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`line 67: ${JSON.stringify(error)}`);
        return NextResponse.json(
          { error: `Failed to send message: ${error}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      // Generic response for non-matching commands
      const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `You said: "${text}"`,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`line 88: ${JSON.stringify(error)}`);
        return NextResponse.json(
          { error: `Failed to send message: ${error}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }
  } catch (error) {
    console.error(`Error in Telegram bot handler: ${JSON.stringify(error)}`);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const GET = async () => {
  // Simple GET handler to verify that the route is live
  return NextResponse.json({ message: "Hello from Telegram Bot API!" });
};
