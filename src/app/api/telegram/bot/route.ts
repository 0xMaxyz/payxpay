import {
  addEscrowOutTxToInvoice,
  confirmTheInvoicePayment,
  getInvoice,
} from "@/app/db";
import { SignedInvoice } from "@/app/types";
import * as Telegram from "@/types/telegram";
import { decodeInvoice, escapeHtml } from "@/utils/tools";
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { approveEscrow } from "@/app/xion/lib";

const redis = Redis.fromEnv();

const BOT_TOKEN = process.env.BOT_TOKEN as string;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

//  types
interface HandlerParams {
  params: string;
  userId: number | undefined;
  messageId: number | undefined;
  text?: string;
  inlineKeyboardMarkup?: Telegram.InlineKeyboardMarkup | undefined;
}

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

const editMessage = async (msg: Telegram.EditMessageText) => {
  const response = await fetch(`${TELEGRAM_API}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(msg),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to edit message:", error);
  }
  return response;
};

const deleteMessage = async (msg: Telegram.DeleteMessage) => {
  const response = await fetch(`${TELEGRAM_API}/deleteMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(msg),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to edit message:", error);
  }
  return response;
};

const handlePayCommand = async (
  chatId: string | number,
  params?: HandlerParams
) => {
  // set chat action
  await sendChatAction(chatId, "typing");

  if (!params) {
    await sendMessage({
      chat_id: chatId,
      text: "Invalid command. Missing parameters.",
    });
    return;
  }

  const invoiceId = params.params;
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
    text: `<b> 📩Invoice Received</b>\n\nYou received an invoice from <b><a href="tg://user?id=${signedInvoice.issuerTelegramId}">${signedInvoice.issuerFirstName}</a></b>${signedInvoice.issuerTelegramHandle? ` (@${signedInvoice.issuerTelegramHandle})`: ""}.\n\n<b>💵 Amount:</b> <code>${signedInvoice.amount}</code> $${signedInvoice.unit.replaceAll(' ','').split('-')[1] }\n<b>📝 Description:</b> <code>${escapeHtml( signedInvoice.description )}</code>\n<b>➡️ Action Required:</b> Click the <b>Pay</b> button to complete your payment.\n\n💬 <u>If their privacy settings allow, you can also chat with them directly.</u>`,
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
  params?: HandlerParams
) => {
  // set chat action
  await sendChatAction(chatId, "typing");

  if (!params || !params.messageId) {
    await sendMessage({
      chat_id: chatId,
      text: "Invalid command. Missing parameters.",
    });
    return;
  }

  const invoiceId = params.params;
  const userId = params.userId;
  const data = await getInvoice(invoiceId);

  console.log("Handle Confirm", data);

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
  console.log("Confirming ...");
  // confirm the payment
  const res = await confirmTheInvoicePayment(invoiceId);
  if (res) {
    console.log("Should be confirmed by now");
    // prepare the msg
    const msg: Telegram.EditMessageText = {
      chat_id: chatId,
      message_id: params.messageId,
      parse_mode: "HTML",
      // prettier-ignore
      text: `✅ <b>Payment confirmed</b>`,
    };

    await editMessage(msg);
    // if the payment is escrowed, we have to inform the payer that the issuer paid for this invoice
    // TODO
    if (data.payment_type === "escrow" && data.payer_tg_id) {
      const msg2: Telegram.SendMessage = {
        chat_id: data.payer_tg_id,
        // prettier-ignore
        text: "<b>✅ Payment Confirmed by Issuer</b>\nThe issuer has confirmed the escrowed amount and sent the invoice item. If you have received the item, please <b>approve the escrow.</b>\n\n<b>⚠️ Important:</b>\n    🔴  <b>Only approve</b> the escrow if you have received the item as described.\n    🔴  <b>If you have not received</b> the item or there is an issue, reject the escrow.\n\n📝 For rejected escrows, you must provide a detailed reason. Our system will review your case, and we will contact the issuer to resolve the issue.\n\n🙏 Thank you for your cooperation!",
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `Approve ✅`,
                callback_data: `/msgbox /approve&${signedInvoice.id}`,
              },
              {
                text: `Reject ❌`,
                callback_data: `/msgbox /reject&${signedInvoice.id}`,
              },
              {
                text: `Chat with Issuer 💬`,
                url: `tg://user?id=${signedInvoice.issuerTelegramId}`,
              },
            ],
          ],
        },
      };
      await sendMessage(msg2);
    }
  } else {
    console.log("didn't work!");
    // prepare the msg
    const msg: Telegram.SendMessage = {
      chat_id: chatId,
      parse_mode: "HTML",
      // prettier-ignore
      text: `❌ <b>Can't confirm right now, server error.</b>`,
    };

    await sendMessage(msg);
  }
};

const handleRejectCommand = async (
  chatId: string | number,
  params?: HandlerParams
) => {
  // set chat action
  await sendChatAction(chatId, "typing");

  if (!params || !params.messageId) {
    await sendMessage({
      chat_id: chatId,
      text: "Invalid command. Missing invoice ID or other parameters.",
    });
    return;
  }

  const invoiceId = params.params;
  const messageId = params.messageId;

  // Save context in Redis
  await redis.set(`rejection:${chatId}`, JSON.stringify({ invoiceId }), {
    ex: 300, // Expire in 5 minutes
  });

  await editMessage({
    chat_id: chatId,
    message_id: messageId,
    text: `🚫 <b>Reject Escrow</b>\nPlease provide a detailed reason for rejecting escrow #${invoiceId}.`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Cancel ❌",
            callback_data: `/clear Action Canceled.`,
          },
        ],
      ],
    },
  });

  // Here, you might set up another step (e.g., a form input or callback) to collect the user's reason.
};

const handleStartCommand = async (
  chatId: string | number,
  params?: HandlerParams
) => {
  // set chat action
  await sendChatAction(chatId, "typing");

  if (params && params.params) {
    // some params are sent with bot start, check if we received invoiceId with start command
    const regex = /invoice=([^&]+)/;
    const match = params.params.match(regex);
    if (match) {
      // then an invoice is sent with the bot, handle the invoice using payHandler
      await handlePayCommand(chatId, { ...params, params: match[1] });
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
  // set chat action
  await sendChatAction(chatId, "typing");

  let htmlTxt = "";

  for (const [command, details] of Object.entries(COMMANDS)) {
    // only show commands that can be invoked directly
    if (details.showInHelp) {
      htmlTxt += `<b>/${command}</b>: ${details.description}\n`;
    }
  }
  await sendMessage({
    chat_id: chatId,
    text: htmlTxt,
    parse_mode: "HTML",
  });
};

/**
 * Handles showing xonfirmation box for messages with inline keyboard
 * @param chatId the chat_id to sent the reply to
 * @param params index 0 is params sent with the command, index 1 is user_id, index 2 is original message id that should be edited
 */
const handleMsgBoxCommand = async (
  chatId: string | number,
  params?: HandlerParams
) => {
  // set chat action
  await sendChatAction(chatId, "typing");

  console.log("HandleMsgbox, params= ", params);
  if (!params || !params.messageId) {
    await sendMessage({
      chat_id: chatId,
      text: "Invalid command. Missing parameters.",
    });
    return;
  }
  const message_id = params.messageId;

  const paramsWithCommand = params.params;
  // check if the paramsWithCommand is actually a command with params
  const regexForValidCommand = /^\/([a-zA-Z]+)&(.+)?$/;
  if (!paramsWithCommand.match(regexForValidCommand)) {
    await editMessage({
      chat_id: chatId,
      message_id,
      text: "Invalid command format.",
    });
  }
  // so a valid command is sent with msgbox
  const command = paramsWithCommand.replace("&", " ").trim(); // we'll trim the output to clear the empty space at end for commands without params
  console.log("Command received with msgbox", command);
  // add chat text and keyboard markup to redis, 10 minutes
  const contextId = crypto.randomUUID();
  await redis.set(
    contextId,
    JSON.stringify({
      text: params.text,
      keyboard: params.inlineKeyboardMarkup,
    }),
    {
      ex: 600,
    }
  );
  const msg: Telegram.EditMessageText = {
    text: `Do you confirm this action?${
      params.text ? `\n\n<blockquote>${params.text}</blockquote>` : ""
    }`,
    message_id: message_id,
    parse_mode: "HTML",
    chat_id: chatId,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: `Yes ✅`,
            callback_data: command,
          },
          {
            text: `No ❌`,
            callback_data: `/clear ${contextId}`,
          },
        ],
      ],
    },
  };
  await editMessage(msg);
};

const handleClearCommand = async (
  chatId: string | number,
  params?: HandlerParams
) => {
  // set chat action
  await sendChatAction(chatId, "typing");

  if (!params || !params.messageId) {
    await sendMessage({
      chat_id: chatId,
      text: "Invalid command. Missing parameters.",
    });
    return;
  }
  if (params.params) {
    const fromRedis = await redis.get(params.params);
    console.log("Key received from redis", fromRedis);
    if (fromRedis) {
      // then we get the text and keyboard
      // delete this key
      await redis.del(params.params);
      const data: { text: string; keyboard: Telegram.InlineKeyboardMarkup } =
        JSON.parse(fromRedis as string);
      // edit the message with received text and keyboar
      const msg: Telegram.EditMessageText = {
        text: data.text,
        chat_id: chatId,
        message_id: params.messageId,
        reply_markup: data.keyboard,
      };
      console.log("edited mesage in /clear handler", msg);
      await editMessage(msg);
      return;
    }
    // then a clear message is sent, edit the message with this text
    const msg: Telegram.EditMessageText = {
      text: params.params,
      chat_id: chatId,
      message_id: params.messageId,
    };

    await editMessage(msg);
  } else {
    // delete the message
    await deleteMessage({
      chat_id: chatId,
      message_id: params.messageId,
    });
  }
};

const handleApproveCommand = async (
  chatId: string | number,
  params?: HandlerParams
) => {
  // set chat action
  await sendChatAction(chatId, "typing");

  if (!params || !params.userId || !params.messageId) {
    await sendMessage({
      chat_id: chatId,
      text: "❌ <b>An error occured</b>\nMissing parameters.",
      parse_mode: "HTML",
    });
    return;
  }
  const invoiceId = params.params;
  const userId = params.userId;

  const data = await getInvoice(invoiceId);
  if (!data) {
    await sendMessage({
      chat_id: chatId,
      text: "❌ <b>An error occured</b>\nCan't find this invoice.",
      parse_mode: "HTML",
    });
    return;
  }
  const signedInvoice = decodeInvoice<SignedInvoice>(data.invoice);
  // check if invoice approved
  if (data.payment_type === "approve") {
    await sendMessage({
      chat_id: chatId,
      text: "⚠️ <b>Warning</b>\nThis invoice is already approved.",
    });
    return;
  }

  // check if invoice approved
  if (data.payment_type === "refund") {
    await sendMessage({
      chat_id: chatId,
      text: "⚠️ <b>Warning</b>\nThis invoice is refunded and can't be approved anymore.",
    });
    return;
  }

  // check if invoice is paid with an escrow
  if (data.payment_type === "direct") {
    await sendMessage({
      chat_id: chatId,
      text: "❌ <b>Error</b>\nThis invoice is paid directly and the invoice issuer received the amount.\nNo Approve is required.",
    });
    return;
  }
  // check if payment confirmed
  if (!data.is_confirmed) {
    await sendMessage({
      chat_id: chatId,
      text: "❌ <b>An error occured</b>\nThe payment is not confirmed yet (if any)",
      parse_mode: "HTML",
    });
    return;
  }
  // check if you're the payer
  if (data.payer_tg_id.toString() !== userId) {
    await sendMessage({
      chat_id: chatId,
      text: "❌ <b>An error occured</b>\nYou didn't create this escrow.",
      parse_mode: "HTML",
    });
    return;
  }
  // at this point we know that there is an invoice which is escrowed by us and confirmed by issuer
  // we can approve the escrow and pay the amount
  const tx = await approveEscrow(invoiceId);
  // check if received tx is valid, in case everything is ok, add this tx to db and inform the invoice issuer that he recieved the escrowed amount
  if (tx && tx.transactionHash) {
    // check events for required attribs
    let isValidTx = true;
    for (const event of tx.events) {
      if (event.type === "wasm") {
        for (const attrib of event.attributes) {
          if (attrib.key === "action") {
            isValidTx = isValidTx && attrib.value === "approve";
          }
          if (attrib.key === "id") {
            isValidTx = isValidTx && attrib.value === invoiceId;
          }
          if (attrib.key === "to") {
            isValidTx = isValidTx && attrib.value === signedInvoice.address;
          }
        }
      }
    }
    if (!isValidTx) {
      // this shouldn't happen ☠️
      await sendMessage({
        chat_id: chatId,
        text: `❌ <b>An error occured</b>\nInvalid tx.\n<code>${tx}</code>`,
        parse_mode: "HTML",
      });
      return;
    }
    // save approve tx in db
    const dbRes = await addEscrowOutTxToInvoice(
      invoiceId,
      tx.transactionHash,
      "approve"
    );
    if (!dbRes) {
      await sendMessage({
        chat_id: chatId,
        text: `❌ <b>An error occured</b>\nCan't update the database\nPlease save this tx hash for further checks\n\n<code>${tx.transactionHash}</code>`,
        parse_mode: "HTML",
      });
      return;
    }
    // so escrow approved, db updated, now we need to inform the invoice issuer that the payment is sent to his address
    await sendMessage({
      // prettier-ignore
      text: `🎉 <b>Payment Received!</b> 🎉\n\nYou have successfully received a payment from an escrowed invoice.\n\n<b>Invoice Details:</b>\n💰 <b>Amount:</b> <code>${signedInvoice.amount} $${signedInvoice.unit.split('-')[1].trim()}</code>\n📜 <b>Description:</b> <code>${escapeHtml(signedInvoice.description)}</code>\n🗓️ <b>Issued On:</b> <code>${new Date(1000*signedInvoice.issueDate).toLocaleDateString()}</code>\n🔗 <b>Invoice ID:</b> <code>${signedInvoice.id}</code>\n\n<b>Transaction Details:</b>\n🏦 <b>Paid To:</b> <a href="tg://user?id=${signedInvoice.issuerTelegramId}">${signedInvoice.issuerFirstName} ${signedInvoice.issuerLastName || ''}</a>${signedInvoice.issuerTelegramHandle ? ` (@${signedInvoice.issuerTelegramHandle})` : ""}\n📍 <b>Meta Account:</b> <a href="https://testnet.xion.explorers.guru/contract/${signedInvoice.address}">${signedInvoice.address}</a>\n\n🔔 Please check your account balance to confirm receipt.\n\nThank you for using <code>PayxPay</code> 🙏`,
      chat_id: signedInvoice.issuerTelegramId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "View Transaction Details 🔍",
              url: `https://testnet.xion.explorers.guru/transaction/${tx.transactionHash}`,
            },
          ],
        ],
      },
    });
  } else {
    await sendMessage({
      chat_id: chatId,
      text: `❌ <b>An error occured</b>\nCan't approve the escrow.\nReceived tx is:\n<code>${tx}</code>`,
      parse_mode: "HTML",
    });
    return;
  }
};

const sendChatAction = async (
  chatId: string | number,
  action:
    | "typing"
    | "upload_photo"
    | "record_video"
    | "upload_video"
    | "record_voice"
    | "upload_voice"
    | "upload_document"
    | "find_location"
    | "record_video_note"
    | "upload_video_note"
) => {
  const response = await fetch(`${TELEGRAM_API}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      action: action,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to send chat action:", error);
  }
};

const processRejection = async (
  invoiceId: string,
  reason: string,
  chatId: number
) => {
  // Save the rejection to the database or notify the issuer
  console.log(`Processing rejection for invoice ${invoiceId}: ${reason}`);

  const data = await getInvoice(invoiceId);
  if (!data) {
    await sendMessage({
      chat_id: chatId,
      text: "❌ <b>An error occured</b>\nCan't find this invoice.",
      parse_mode: "HTML",
    });
    return;
  }
  const signedInvoice = decodeInvoice<SignedInvoice>(data.invoice);

  // Notify the issuer
  const issuerChatId = signedInvoice.issuerTelegramId;
  await sendMessage({
    chat_id: issuerChatId,
    text: `🚨 The payer has rejected escrow #${invoiceId} with the following reason:\n\n"${reason}"`,
    parse_mode: "HTML",
  });
};

// list of available commands

const COMMANDS: {
  [key: string]: {
    handler: (chatId: string | number, params?: HandlerParams) => Promise<void>;
    description: string;
    showInHelp: boolean;
  };
} = {
  help: {
    handler: handleHelpCommand,
    description: "list of available commands",
    showInHelp: true,
  },
  pay: {
    handler: handlePayCommand,
    description: "Used to pay invoices created in the app.",
    showInHelp: true,
  },
  start: {
    handler: handleStartCommand,
    description: "Shows a welcome message.",
    showInHelp: true,
  },
  confirm: {
    handler: handleConfirmCommand,
    description:
      "invoice issuers can confirm the paid invoices with this command.",
    showInHelp: true,
  },
  /**
   * the format to send commands with this command is
   * - /msgbox commandWithParams
   *
   * the commandWithParams is the command (and the params) that are going to be invoked in case the user chooses yes
   * - e.g. /msgbox /confirm&invoiceId
   *
   * Use & between the command and params of the commandWithParams
   */
  msgbox: {
    handler: handleMsgBoxCommand,
    description:
      "Edits a message to show a confirmation yes/no for the message",
    showInHelp: false,
  },
  clear: {
    handler: handleClearCommand,
    description:
      "Clears the send message and output the params sent or delete message",
    showInHelp: false,
  },
  approve: {
    handler: handleApproveCommand,
    description: "Approve an escrow",
    showInHelp: false,
  },
  reject: {
    handler: handleRejectCommand,
    description: "Rejects the escrowed amount with a reason.",
    showInHelp: false,
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
    let text = update.message?.text;

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
    let messageId = update.message?.message_id;
    let keyboards = update.message?.reply_markup;

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
      messageId = update.callback_query.message?.message_id;
      text =
        update.callback_query.message && "text" in update.callback_query.message
          ? update.callback_query.message.text
          : "";
      keyboards =
        update.callback_query.message &&
        "reply_markup" in update.callback_query.message
          ? update.callback_query.message?.reply_markup
          : undefined;
    }

    console.log(
      "comm, chatId, userId, userName, firstName, lastName,messageId\n",
      comm,
      chatId,
      userId,
      userName,
      firstName,
      lastName,
      messageId
    );

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
      // check if there is a rekection context for this user, otherwise send unknown command
      const context = await redis.get(`rejection:${chatId}`);
      if (context) {
        const { invoiceId } = JSON.parse(context as string);
        console.log(
          `Rejection reason for invoice #${invoiceId}: ${update.message}`
        );
        // Delete the context from Redis
        await redis.del(`rejection:${chatId}`);
        // Confirm receipt of the reason
        await sendMessage({
          chat_id: chatId,
          text: `✅ Thank you! Your reason for rejecting escrow #${invoiceId} has been recorded.`,
          parse_mode: "HTML",
        });
        // Process the rejection (e.g., update database or notify issuer)
        await processRejection(
          invoiceId,
          update.message?.text ?? "",
          Number.parseInt(chatId.toString())
        );
        return NextResponse.json({ success: true }, { status: 200 });
      } else {
        await sendMessage({
          chat_id: chatId,
          text: "Unknown command. Use /help to get a list of available commands.",
        });
        return NextResponse.json({ success: true }, { status: 200 });
      }
    }

    const command = match[1];
    const params = match[2];
    // check if command is registered
    const foundCommand = COMMANDS[command];
    if (foundCommand) {
      await foundCommand.handler(chatId, {
        params: params ?? "",
        userId: userId,
        messageId: messageId,
        text: text,
        inlineKeyboardMarkup: keyboards,
      });
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
