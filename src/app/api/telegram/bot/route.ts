import {
  confirmTheInvoicePayment,
  getInvoice,
  saveTelegramChatInfo,
} from "@/app/db";
import { SignedInvoice } from "@/app/types";
import * as Telegram from "@/types/telegram";
import { escapeHtml } from "@/utils/tools";
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const REDIS = Redis.fromEnv();

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

const handlePayCommand = async (chatId: string | number, params?: string[]) => {
  if (!params) {
    await sendMessage({
      chat_id: chatId,
      text: "Invalid command. Missing parameters.",
    });
    return;
  }

  const invoiceId = params[0];
  const data = await getInvoice(invoiceId);

  if (!data) {
    await sendMessage({
      chat_id: chatId,
      text: "Invoice not found.",
    });
    return;
  }
  const invoice = data.invoice;

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

const handleConfirmCommand = async (
  chatId: string | number,
  params?: string[]
) => {
  if (!params) {
    await sendMessage({
      chat_id: chatId,
      text: "Invalid command. Missing parameters.",
    });
    return;
  }

  const invoiceId = params[0];
  const userId = Number.parseInt(params[1]);
  const data = await getInvoice(invoiceId);

  if (!data) {
    await sendMessage({
      chat_id: chatId,
      text: "Invoice not found.",
    });
    return;
  }

  const invoice = data.invoice;

  const signedInvoice = JSON.parse(
    decodeURIComponent(invoice)
  ) as SignedInvoice;

  if (signedInvoice.issuerTelegramId !== userId) {
    await sendMessage({
      chat_id: chatId,
      text: "You didn't create this invoice",
    });
    return;
  }

  if (!data.create_tx) {
    await sendMessage({
      chat_id: chatId,
      text: "Invoice is not paid yet.",
    });
    return;
  }
  if (data.is_confirmed) {
    await sendMessage({
      chat_id: chatId,
      text: "Invoice already confirmed.",
    });
    return;
  }
  // confirm the payment
  await confirmTheInvoicePayment(invoiceId);
  // prepare the msg
  const msg: Telegram.SendMessage = {
    chat_id: chatId,
    parse_mode: "HTML",
    // prettier-ignore
    text: `✅ <b>Payment confirmed</b>`,
  };

  await sendMessage(msg);
};

const handleStartCommand = async (
  chatId: string | number,
  params?: string[]
) => {
  if (params && params[0]) {
    // some params are sent with bot start, check if we received invoiceId with start command
    const regex = /invoice=([^&]+)/;
    const match = params[0].match(regex);
    if (match) {
      // then an invoice is sent with the bot, handle the invoice using payHandler
      await handlePayCommand(chatId, [match[1], params[1]]);
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

const handleHelpCommand = async (chatId: string | number) => {
  let htmlTxt = "";

  for (const [command, details] of Object.entries(COMMANDS)) {
    htmlTxt += `<b>/${command}</b>: ${details.description}\n`;
  }
  await sendMessage({
    chat_id: chatId,
    text: htmlTxt,
    parse_mode: "HTML",
  });
};

// list of available commands

const COMMANDS: {
  [key: string]: {
    handler: (
      chatId: string | number,
      params?: string[] | undefined
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
  confirm: {
    handler: handleConfirmCommand,
    description:
      "invoice issuers can confirm the paid invoices with this command.",
  },
};

if (!BOT_TOKEN) {
  throw new Error("Telegram bot token is missing");
}

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();

    if (!body) {
      return NextResponse.json(
        { error: "Invalid request: Missing message payload" },
        { status: 400 }
      );
    }

    const update = body as Telegram.Update;
    const text = update.message?.text;

    if (!update.callback_query && !text) {
      console.error("Missing input", update);
      return NextResponse.json(
        { error: "Invalid request: Missing info" },
        { status: 400 }
      );
    }
    // use a variable to hold the command, either from text or callBack data
    let comm = text;
    let chatId = update.message?.chat.id;
    let userId = update?.message?.from?.id;
    let userName = update.message?.chat.username;
    let firstName = update.message?.chat.first_name;
    let lastName = update.message?.chat.last_name;

    // check if body contains callback_query
    if (update.callback_query) {
      console.log("Update received, callback_query.", update);
      // then we should handle this callback_query
      comm = update.callback_query.data!;
      chatId = update.callback_query.message?.chat.id;
      userId = update.callback_query.from.id;
      userName = update.callback_query.message?.chat.username;
      firstName = update.callback_query.message?.chat.first_name;
      lastName = update.callback_query.message?.chat.last_name;
    }

    console.log(comm, chatId, userId, userName, firstName, lastName);

    if (!chatId || !comm) {
      throw new Error("Invalid input");
    }

    console.log("Command is", comm);

    // Handle commands
    const startCommandRegex = /^\/([a-zA-Z]+)(?:\s(.+))?/;
    // if match found, first element is the input, second element is the command and third element is the params
    const match = comm.match(startCommandRegex);

    // no match found
    if (!match) {
      await sendMessage({
        chat_id: chatId,
        text: "Unknown command. Use /help to get a list of available commands.",
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const initChatInfo: Telegram.ChatInfo = {
      chatId: chatId,
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      userName: userName ?? "",
      userId: userId!,
    };

    const cachedChatInfo = await REDIS.get(`user:${userId}`);
    console.log("Redis, cachedChatInfo", cachedChatInfo);
    if (cachedChatInfo) {
      const chatInfo: Telegram.ChatInfo = JSON.parse(cachedChatInfo as string);
      // compare received chat info from redis with the created one
      const isEq = compareObjects(chatInfo, initChatInfo);
      if (!isEq) {
        // save the new indo to db and also update the redis (db function updates the redis too)
        console.log("Should save tg data");
        await saveTelegramChatInfo(initChatInfo);
      }
    } else {
      await saveTelegramChatInfo(initChatInfo);
    }

    const command = match[1];
    const params = match[2];
    // check if command is registered
    const foundCommand = COMMANDS[command];
    if (foundCommand) {
      await foundCommand.handler(chatId, [params ?? "", userId!.toString()]); // send the user id as index 1 of params
    } else {
      await sendMessage({
        chat_id: chatId,
        text: `<b>Unknown command</b>: <code>/${command}</code>\nUse /help to receive a list of available commands.`,
        parse_mode: "HTML",
      });
    }
    // if command received from inline keyboard then call /answerCallbackQuery otherwise send a success response
    if (update.callback_query) {
      await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: update.callback_query.id }),
      });
    } else {
      return NextResponse.json({ success: true }, { status: 200 });
    }
  } catch (error) {
    console.error("Error handling Telegram bot command:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function compareObjects(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== "object" ||
    typeof obj2 !== "object" ||
    obj1 === null ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!keys2.includes(key) || !compareObjects(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

export const GET = async () => {
  // Simple GET handler to verify that the route is live
  return NextResponse.json({ message: "Hello from Telegram Bot API!" });
};
