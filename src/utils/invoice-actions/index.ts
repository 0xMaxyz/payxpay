import { sendMessage } from "@/app/api/telegram/bot/route";
import {
  InvoiceDataFromDb,
  addEscrowOutTxToInvoice,
  confirmTheInvoicePayment,
  rejectEscrow,
} from "@/app/db";
import { approveEscrow, refundEscrow } from "@/app/xion/lib";
import { SignedInvoice } from "@/types";
import * as Telegram from "@/types/telegram";
import { NextResponse } from "next/server";
import { escapeHtml } from "../tools";

const handleApproveInvoice = async (
  inv: SignedInvoice,
  dto: InvoiceDataFromDb
): Promise<
  | true
  | NextResponse<{
      error: unknown;
    }>
  | undefined
> => {
  try {
    const invoiceId = inv.id;

    // check if invoice approved
    if (dto.payment_type === "approve") {
      throw new Error("⚠️Warning\nThis invoice is already approved.");
    }

    // check if invoice approved
    if (dto.payment_type === "refund") {
      throw new Error(
        "⚠️ Warning\nThis invoice is refunded and can't be approved anymore."
      );
    }

    // check if invoice is paid with an escrow
    if (dto.payment_type === "direct") {
      throw new Error(
        "❌ Error \nThis invoice is paid directly and the invoice issuer received the amount.\nNo Approve is required."
      );
    }

    // check if payment confirmed
    if (!dto.is_confirmed) {
      throw new Error("❌ Error \nThe payment is not confirmed yet (if any)");
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
              isValidTx = isValidTx && attrib.value === inv.address;
            }
          }
        }
      }
      if (!isValidTx) {
        // this shouldn't happen ☠️
        throw new Error(`❌☠️ Error\nInvalid tx.\n${tx}`);
      }
      // save approve tx in db
      const dbRes = await addEscrowOutTxToInvoice(
        invoiceId,
        tx.transactionHash,
        "approve"
      );
      if (!dbRes) {
        throw new Error(
          `❌ Error\nCan't update the database\nPlease save this tx hash for further checks\n\n${tx.transactionHash}`
        );
      }
      // so escrow approved, db updated, now we need to inform the invoice issuer that the payment is sent to his address
      await sendMessage({
        // prettier-ignore
        text: `🎉 <b>Payment Received!</b> 🎉\n\nYou have successfully received a payment from an escrowed invoice.\n\n<b>Invoice Details:</b>\n💰 <b>Amount:</b> <code>${inv.amount} $${inv.unit.split('-')[1].trim()}</code>\n📜 <b>Description:</b> <code>${escapeHtml(inv.description)}</code>\n🗓️ <b>Issued On:</b> <code>${new Date(1000*inv.issueDate).toLocaleDateString()}</code>\n🔗 <b>Invoice ID:</b> <code>${inv.id}</code>\n\n<b>Transaction Details:</b>\n🏦 <b>Paid To:</b> <a href="tg://user?id=${inv.issuerTelegramId}">${inv.issuerFirstName} ${inv.issuerLastName || ''}</a>${inv.issuerTelegramHandle ? ` (@${inv.issuerTelegramHandle})` : ""}\n📍 <b>Meta Account:</b> <a href="https://testnet.xion.explorers.guru/contract/${inv.address}">${inv.address}</a>\n\n🔔 Please check your account balance to confirm receipt.\n\nThank you for using <code>PayxPay</code> 🙏`,
        chat_id: inv.issuerTelegramId,
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
      return true;
    } else {
      throw new Error(
        `❌ Error \nCan't approve the escrow.\nReceived tx is:\n${tx}`
      );
    }
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 400 });
  }
};

const handleRejectInvoice = async (
  inv: SignedInvoice,
  dto: InvoiceDataFromDb,
  reason: string
): Promise<
  | true
  | NextResponse<{
      error: unknown;
    }>
  | undefined
> => {
  try {
    const invoiceId = inv.id;
    // check if invoice can be rejected
    if (!dto) {
      throw new Error("❌ Error\nCan't find this invoice.");
    }

    // check if invoice can be rejected
    if (dto.payment_type === "approve") {
      throw new Error("⚠️ Warning\nCan't reject an approved escrow.");
    }

    // check if invoice refunded
    if (dto.payment_type === "refund") {
      throw new Error(
        "⚠️ Warning\nThis invoice is refunded and can't be rejected."
      );
    }

    // check if invoice is paid with an escrow
    if (dto.payment_type === "direct") {
      throw new Error(
        "❌ Error\nThis invoice is paid directly and the invoice issuer received the amount.\nYou can't reject it."
      );
    }

    // check if payment confirmed
    if (!dto.is_confirmed) {
      throw new Error("❌ Error\nThe payment is not confirmed yet (if any)");
    }

    // at this point we know that there is an invoice which is escrowed by us and confirmed by issuer
    // Save the rejection in db
    const isRejected = await rejectEscrow(invoiceId, reason);
    if (isRejected) {
      console.log(`Processing rejection for invoice ${invoiceId}: ${reason}`);

      // prettier-ignore
      const invoiceDetails = `<b>💵 Amount:</b> <code>${inv.amount}</code> $${inv.unit.replaceAll(' ','').split('-')[1] }\n<b>📝 Description:</b> <code>${escapeHtml( inv.description )}</code>`;
      // Notify the issuer
      const issuerChatId = inv.issuerTelegramId;
      await sendMessage({
        chat_id: issuerChatId,
        // prettier-ignore
        text: `🚨<b>Escrow Rejected by Payer</b>\n\nThe payer has rejected the escrow payment for your invoice with the following reason:\n<blockquote>${reason}</blockquote>\n\n<b>Invoice Details</b>\n<blockquote>${invoiceDetails}</blockquote>\n\n⚠️<b>Important Information</b>\nSince the payment was made through an escrow, the funds are still securely held in our smart contract and have not been refunded to the payer.\nYou can either:\n1️⃣Request the payer to return the invoice item(s).\n2️⃣Approve the escrow manually.\nYou can find this rejected escrow in the History tab of the app.\n\n🙏 Thank you for your cooperation.`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `Chat with payer 💬`,
                url: `tg://user?id=${dto.payer_tg_id}`,
              },
              {
                text: `Open History`,
                web_app: {
                  url: `https://${
                    process.env.VERCEL_PROJECT_PRODUCTION_URL as string
                  }/history?invoice=${invoiceId}`,
                },
              },
            ],
          ],
        },
      });
    } else {
      throw new Error("❌ Error\nCan't process rejection now");
    }
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 400 });
  }
};

const handleRefundInvoice = async (
  inv: SignedInvoice,
  dto: InvoiceDataFromDb
): Promise<
  | true
  | NextResponse<{
      error: unknown;
    }>
  | undefined
> => {
  try {
    const res = await refundEscrow(inv.id);
    if (res && res.transactionHash) {
      // check events for required attribs
      let isValidTx = true;
      for (const event of res.events) {
        if (event.type === "wasm") {
          for (const attrib of event.attributes) {
            if (attrib.key === "action") {
              isValidTx = isValidTx && attrib.value === "refund";
            }
            if (attrib.key === "id") {
              isValidTx = isValidTx && attrib.value === inv.id;
            }
            if (attrib.key === "to") {
              isValidTx = isValidTx && attrib.value === dto.payer_address;
            }
          }
        }
      }
      if (!isValidTx) {
        // this shouldn't happen ☠️
        throw new Error(`❌☠️ Unexpected Error\nInvalid tx.\n${res}`);
      }
      // save approve tx in db
      const dbRes = await addEscrowOutTxToInvoice(
        inv.id,
        res.transactionHash,
        "refund"
      );
      if (!dbRes) {
        throw new Error(
          `❌ Error\nCan't update the database\nPlease save this tx hash for further checks\n\n${res.transactionHash}`
        );
      }
      // so escrow approved, db updated, now we need to inform the invoice issuer that the payment is sent to his address
      if (inv.issuerTelegramId) {
        await sendMessage({
          // prettier-ignore
          text: `🎉 <b>Payment Received!</b> 🎉\n\nYou have successfully received a payment from an escrowed invoice.\n\n<b>Invoice Details:</b>\n💰 <b>Amount:</b> <code>${inv.amount} $${inv.unit.split('-')[1].trim()}</code>\n📜 <b>Description:</b> <code>${escapeHtml(inv.description)}</code>\n🗓️ <b>Issued On:</b> <code>${new Date(1000*inv.issueDate).toLocaleDateString()}</code>\n🔗 <b>Invoice ID:</b> <code>${inv.id}</code>\n\n<b>Transaction Details:</b>\n🏦 <b>Paid To:</b> <a href="tg://user?id=${inv.issuerTelegramId}">${inv.issuerFirstName} ${inv.issuerLastName || ''}</a>${inv.issuerTelegramHandle ? ` (@${inv.issuerTelegramHandle})` : ""}\n📍 <b>Meta Account:</b> <a href="https://testnet.xion.explorers.guru/contract/${inv.address}">${inv.address}</a>\n\n🔔 Please check your account balance to confirm receipt.\n\nThank you for using <code>PayxPay</code> 🙏`,
          chat_id: inv.issuerTelegramId,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "View Transaction Details 🔍",
                  url: `https://testnet.xion.explorers.guru/transaction/${res.transactionHash}`,
                },
              ],
            ],
          },
        });
      }
    } else {
      throw new Error(
        `❌ Error\nCan't approve the escrow.\nReceived tx is:\n${res}`
      );
    }
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 400 });
  }
};

const handleConfirmInvoice = async (
  inv: SignedInvoice,
  dto: InvoiceDataFromDb
): Promise<
  | true
  | NextResponse<{
      error: unknown;
    }>
  | undefined
> => {
  try {
    const invoiceId = inv.id;

    if (!dto.create_tx) {
      throw new Error("Invoice is not paid yet");
    }

    if (dto.is_confirmed) {
      throw new Error("Invoice already confirmed");
    }

    console.log("Confirming ...");
    // confirm the payment
    const res = await confirmTheInvoicePayment(invoiceId);
    if (res) {
      console.log("Should be confirmed by now");
      // if the payment is escrowed, we have to inform the payer that the issuer paid for this invoice
      if (dto.payment_type === "escrow" && dto.payer_tg_id) {
        const msg2: Telegram.SendMessage = {
          chat_id: dto.payer_tg_id,
          // prettier-ignore
          text: "<b>✅ Payment Confirmed by Issuer</b>\nThe issuer has confirmed the escrowed amount and sent the invoice item. If you have received the item, please <b>approve the escrow.</b>\n\n<b>⚠️ Important:</b>\n    🔴  <b>Only approve</b> the escrow if you have received the item as described.\n    🔴  <b>If you have not received</b> the item or there is an issue, reject the escrow.\n\n📝 For rejected escrows, you must provide a detailed reason. Our system will review your case, and we will contact the issuer to resolve the issue.\n\n🙏 Thank you for your cooperation!",
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: `Approve ✅`,
                  callback_data: `/msgbox /approve&${inv.id}`,
                },
                {
                  text: `Reject ❌`,
                  callback_data: `/msgbox /reject&${inv.id}`,
                },
                {
                  text: `Chat with Issuer 💬`,
                  url: `tg://user?id=${inv.issuerTelegramId}`,
                },
              ],
            ],
          },
        };
        await sendMessage(msg2);
        return true;
      }
    } else {
      throw new Error("Can't confirm the invoice");
    }
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 400 });
  }
};

export {
  handleConfirmInvoice,
  handleApproveInvoice,
  handleRejectInvoice,
  handleRefundInvoice,
};
