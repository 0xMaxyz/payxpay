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
    const startCommandRegex = /\/pay=invoiceId=([a-zA-Z0-9]+)/;
    const match = text?.match(startCommandRegex);

    if (match) {
      console.log(`line 39: found /pay match`);
      const query = match[1]; // Example: "invoiceId=12345"
      const invoiceId = query.split("=")[1]; // Extract "12345"

      console.log(
        `line 42: query is ${JSON.stringify(
          query
        )} and invoice id is: ${JSON.stringify(invoiceId)}`
      );
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

export interface TelegramUpdate {
  update_id: number;
  message: TelegramMessage;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number; // Unix timestamp
  text: string;
  entities?: TelegramEntity[]; // Optional because it might not always exist
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string; // Optional because `last_name` may not always be present
  username?: string; // Optional because `username` may not always be present
  language_code?: string; // Optional because `language_code` may not always be present
}

export interface TelegramChat {
  id: number;
  first_name?: string; // Optional because group chats may not have `first_name`
  last_name?: string; // Optional because group chats may not have `last_name`
  username?: string; // Optional because group chats may not have `username`
  type: "private" | "group" | "supergroup" | "channel";
}

export interface TelegramEntity {
  offset: number;
  length: number;
  type:
    | "mention"
    | "hashtag"
    | "cashtag"
    | "bot_command"
    | "url"
    | "email"
    | "phone_number"
    | "bold"
    | "italic"
    | "underline"
    | "strikethrough"
    | "code"
    | "pre"
    | "text_link"
    | "text_mention";
}
