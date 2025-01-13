import { SignedInvoice } from "@/app/types";
import * as Telegram from "@/types/telegram";
import { escapeHtml } from "./tools";

export const generateMessageId = () => {
  const uuid = crypto.randomUUID();
  const b64 = Buffer.from(uuid).toString("base64");
  return b64.slice(0, 64);
};

export const createTelegramShareMessage = async (
  signedInvoice: SignedInvoice
) => {
  const BOT_TOKEN = process.env.BOT_TOKEN as string;
  const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

  const inlineQueryResultArticle: Telegram.InlineQueryResultArticle = {
    type: "article",
    id: generateMessageId(),
    title: "Payment link",
    input_message_content: {
      // prettier-ignore
      message_text: `You received an invoice from <b><a href="tg://user?id=${signedInvoice.issuerTelegramId}">${signedInvoice.issuerFirstName}</a></b>${signedInvoice.issuerTelegramHandle?` (@${signedInvoice.issuerTelegramHandle})`: ""}.\n<b>Amount:</b> <code>${signedInvoice.amount}</code> $${signedInvoice.unit.replaceAll(' ','').split('-')[1] }\n<b>Description:</b> <code>${escapeHtml( signedInvoice.description )}</code>\n<a href="https://t.me/payxpaybot?start=invoice=${signedInvoice.id}">Click here</a> to complete your payment.`,
      parse_mode: `HTML`,
    },
    description: "Choose the recepient of the invoice",
  };
  const savePreparedInlineMessage: Telegram.savePreparedInlineMessage = {
    user_id: signedInvoice.issuerTelegramId,
    result: inlineQueryResultArticle,
    allow_user_chats: true,
  };
  try {
    const response = await fetch(`${TELEGRAM_API}/savePreparedInlineMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(savePreparedInlineMessage),
    });
    if (response.ok) {
      const respFromTg = await response.json();
      if (respFromTg.ok) {
        const preparedMessage =
          respFromTg.result as Telegram.PreparedInlineMessage;
        console.log(
          "Received response for save Prepared message is: ",
          preparedMessage
        );
        return preparedMessage;
      }
    }
    throw new Error("Error in creating a Telegram share message");
  } catch (error) {
    throw new Error(
      `Error in creating a Telegram share message ${
        error ? JSON.stringify(error) : ""
      }`
    );
  }
};
