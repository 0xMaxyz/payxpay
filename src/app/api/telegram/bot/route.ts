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
      `line13: request body is: ${body} and body message is: ${
        body.message
      }, https://${process.env.VERCEL_PROJECT_PRODUCTION_URL as string}`
    );

    if (!body || !body.message) {
      return NextResponse.json(
        { error: "Invalid request: Missing message payload" },
        { status: 400 }
      );
    }

    const update = body.message as TelegramUpdate;
    console.log(`line 25: update object is: ${update}`);

    const chatId = update.message?.chat.id;
    console.log(`line 28: chat id  is: ${chatId}`);

    const text = update.message?.text;
    console.log(`line 31: message text  is: ${text}`);

    // Handle `/pay` command with query parameters
    const startCommandRegex = /\/pay (.+)/;
    const match = text?.match(startCommandRegex);

    if (match) {
      console.log(`line 39: found /pay match`);
      const query = match[1]; // Example: "invoiceId=12345"
      const invoiceId = query.split("=")[1]; // Extract "12345"

      console.log(`line 42: query is ${query} and invoice id is: ${invoiceId}`);
      // Send a message with an inline button linking to your Telegram Mini App
      const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Click below to complete your payment:",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Open Payment Page",
                  url: `https://${
                    process.env.VERCEL_PROJECT_PRODUCTION_URL as string
                  }/pay?invoiceId=${invoiceId}`,
                },
              ],
            ],
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`line 67: ${error}`);
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
        console.error(`line 88: ${error}`);
        return NextResponse.json(
          { error: `Failed to send message: ${error}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }
  } catch (error) {
    console.error(`Error in Telegram bot handler: ${error}`);
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

// Type definitions for Telegram updates
interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramChat {
  id: number;
  type: string; // e.g., "private", "group", "supergroup", "channel"
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}
