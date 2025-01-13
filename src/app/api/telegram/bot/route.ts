import { getInvoice, saveTelegramChatInfo } from "@/app/db";
import { SignedInvoice } from "@/app/types";
import * as Telegram from "@/types/telegram";
import { escapeHtml } from "@/utils/tools";
import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.BOT_TOKEN as string;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Functions and command handlers

const sendMessage = async (msg: Telegram.SendMessage) => {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(msg),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to send message:", error);
  }
  return response;
};

const handlePayCommand = async (
  chatId: string | number,
  params: string | undefined
) => {
  if (!params) {
    await sendMessage({
      chat_id: chatId,
      text: "Invalid command. Missing parameters.",
    });
    return;
  }

  const invoiceId = params;
  const invoice = await getInvoice(invoiceId);

  if (!invoice) {
    await sendMessage({
      chat_id: chatId,
      text: "Invoice not found.",
    });
    return;
  }

  const signedInvoice = JSON.parse(
    decodeURIComponent(invoice)
  ) as SignedInvoice;

  // prepare the msg
  const msg: Telegram.SendMessage = {
    chat_id: chatId,
    parse_mode: "HTML",
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
              }/pay?invoice=${invoiceId}`,
            },
          },
          {
            text: `Chat with ${signedInvoice.issuerFirstName}`,
            url: `tg://user?id=${signedInvoice.issuerTelegramId}`,
          },
        ],
      ],
    },
  };

  await sendMessage(msg);
};

const handleStartCommand = async (chatId: string | number, params?: string) => {
  if (params) {
    // some params are sent with bot start, check if we received invoiceId with start command
    const regex = /invoice=([^&]+)/;
    const match = params.match(regex);
    if (match) {
      // then an invoice is sent with the bot, handle the invoice using payHandler
      await handlePayCommand(chatId, match[1]);
    } else {
      // show welcome message
      await sendMessage({
        chat_id: chatId,
        text: "Welcome to <b>PayxPay</b>!\n Use <code>/help</code> to get a list of available commands.",
        parse_mode: "HTML",
      });
    }
  } else {
    await sendMessage({
      chat_id: chatId,
      text: "Welcome to <b>PayxPay</b>!\n Use <code>/help</code> to get a list of available commands.",
      parse_mode: "HTML",
    });
  }
};

const handleHelpCommand = async (
  chatId: string | number,
  params: string | undefined
) => {
  if (params) {
    // there may be other params sent with /start
  } else {
    // handle /start
    let htmlTxt = "";

    for (const [command, details] of Object.entries(COMMANDS)) {
      htmlTxt += `<b>/${command}</b>: ${details.description}\n`;
    }
    await sendMessage({
      chat_id: chatId,
      text: htmlTxt,
      parse_mode: "HTML",
    });
  }
};

// list of available commands

const COMMANDS: {
  [key: string]: {
    handler: (
      chatId: string | number,
      params?: string | undefined
    ) => Promise<void>;
    description: string;
  };
} = {
  help: {
    handler: handleHelpCommand,
    description: "list of available commands",
  },
  pay: {
    handler: handlePayCommand,
    description: "Used to pay invoices created in the app.",
  },
  start: {
    handler: handleStartCommand,
    description: "Shows a welcome message.",
  },
};

if (!BOT_TOKEN) {
  throw new Error("Telegram bot token is missing");
}

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();

    if (!body || !body.message) {
      return NextResponse.json(
        { error: "Invalid request: Missing message payload" },
        { status: 400 }
      );
    }

    const update = body as Telegram.Update;
    const chatId = update.message?.chat.id;
    const userName = update.message?.chat.username;
    const firstName = update.message?.chat.first_name;
    const lastName = update.message?.chat.last_name;
    const userId = update.message.from?.id;
    const text = update.message?.text;

    console.log(
      `Chat ID: ${chatId}, Username: ${userName}, Firsname: ${firstName}, Lastname: ${lastName}`
    );

    if (!chatId || !userId || !text) {
      console.error("Missing input", update);
      return NextResponse.json(
        { error: "Invalid request: Missing info" },
        { status: 400 }
      );
    }

    // Handle commands
    const startCommandRegex = /^\/([a-zA-Z]+)(?:\s(.+))?/;
    // if match found, first element is the input, second element is the command and third element is the params
    const match = text.match(startCommandRegex);

    // no match found
    if (!match) {
      await sendMessage({
        chat_id: chatId,
        text: "Unknown command. Use /help to get a list of available commands.",
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // user sent a command, save user info
    await saveTelegramChatInfo({
      chatId: chatId,
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      userName: userName ?? "",
      userId: userId,
    });

    const command = match[1];
    const params = match[2];
    // check if command is registered
    const foundCommand = COMMANDS[command];
    if (foundCommand) {
      await foundCommand.handler(chatId, params);
    } else {
      await sendMessage({
        chat_id: chatId,
        text: `<b>Unknown command</b>: <code>/${command}<code>\nUse /help to receive a list of available commands.`,
        parse_mode: "HTML",
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error handling Telegram bot command:", error);
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
