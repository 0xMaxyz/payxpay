import { addEscrowTxToInvoice, getInvoice } from "@/app/db";
import { SignedInvoice } from "@/app/types";
import { didUserReceiveToken, getTransactionDetails } from "@/app/xion/lib";
import { getRates } from "@/utils/get-rates";
import { decodeInvoice, escapeHtml } from "@/utils/tools";
import { verifyJWTAndReferer } from "@/utils/verify_jwt";
import Decimal from "decimal.js";
import { NextRequest, NextResponse } from "next/server";
import * as Telegram from "@/types/telegram";

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

const prepareTgConfirmationMessage = async (
  user_id: number,
  payer_id: number,
  payment_type: "direct" | "escrow",
  received_amount: Decimal,
  invoice: SignedInvoice,
  rate: Decimal
) => {
  const invoiceUnit = invoice.unit.replaceAll(" ", "").split("-")[1];
  const paymentMode =
    payment_type === "direct"
      ? `You received ${received_amount} USDC in your <a href="https://testnet.xion.explorers.guru/contract/${invoice.address}">xion meta account</a> address, please confirm that the payment is made to your account and send the invoice item(s) to payer.`
      : `The payer escrowed ${received_amount} USDC in our smart contract, please send the invoice itrem to payer and confirm it, after payer's final confirmation, you will receive ${received_amount} USDC in your xion meta account address.`;
  const rate_text = `The latest conversion rate is:  1 USD = ${rate.toDecimalPlaces(
    2
  )} ${invoiceUnit}`;
  const msg: Telegram.SendMessage = {
    chat_id: user_id,
    // prettier-ignore
    text:`<b>Payment Received</b>\n\nA payment is made to an invoice created by you (<a href="tg://user?id=${payer_id}">(chat with payer)</a>).\n<b>Invoice details:</b>\n<code><b>Amount:</b>${invoice.amount} $${invoiceUnit }\n<b>Description:</b> ${escapeHtml( invoice.description )}</code>\n${escapeHtml(paymentMode)}\n${escapeHtml(rate_text)}\nPlease <b>deliver</b> the invoice item and click the <code>Confirm</code> button to confirm the payment`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: `Confirm ✅`,
            callback_data: `/confirm ${invoice.id}`,
          },
          {
            text: `Chat with Payer 💬`,
            url: `tg://user?id=${payer_id}`,
          },
        ],
      ],
    },
  };
  await sendMessage(msg);
};

export async function POST(req: NextRequest) {
  // verify token
  const jwtPayload = verifyJWTAndReferer(req);
  if (jwtPayload instanceof NextResponse) {
    return jwtPayload;
  }
  try {
    const { txHash, invoiceId, paymentType, payerTgId, payerAddress } =
      await req.json();

    if (!txHash || !invoiceId || !paymentType || !payerAddress || !payerTgId) {
      return NextResponse.json({ error: "Missing input." }, { status: 400 });
    }
    /**
     * Validate the payment details:
     * - (in direct mode) the recipient of the sent Tx hash should be the address of the invoice issuer
     * - (in escrow mode) the recipient if the sent tx hash should be the address of pxp smart contract
     * - the time that payment is done, should be after the invoice creation date (this should be checked for direct payments but we can check for all payments)
     * - is the escrowed amount or the amount paid in direct payment mode is in 1% vicinity of the invoice amount? this is a rough check to see if the amount that is paid or escrowed is correct
     * - if any of these tests fail, return an error
     */
    // get the invoice to check the validity of the input variables
    const res1 = await getInvoice(invoiceId);
    if (!res1) {
      throw new Error("No valid invoice found.");
    }
    const encodedInvoice = res1.invoice;
    const decodedInvoice = decodeInvoice<SignedInvoice>(encodedInvoice);
    // get tx details from blockchain
    const tx = await getTransactionDetails(txHash);
    let validPayment: boolean = true;
    if (!tx) {
      throw new Error("Can't get transaction details");
    }

    // create mutual vars
    let receivedAmountInUSDC: Decimal = new Decimal(0);
    let latestRateDecimal: Decimal = new Decimal(0);
    if (paymentType === "direct") {
      // 1. check payment time
      const createdTime = decodedInvoice.issueDate;
      const paymentTime = tx?.timestamp;

      validPayment = validPayment && paymentTime > createdTime;

      // 2. check if receiver of the tx is creater of the invoice
      const didUserReceivedAmount = didUserReceiveToken(
        tx.tx,
        decodedInvoice.address
      );
      validPayment = validPayment && didUserReceivedAmount.found;
      // set amount in usdc
      receivedAmountInUSDC = new Decimal(
        didUserReceivedAmount.amount!
      ).dividedBy(10 ** 6);

      // 3. check amount
      // convert the amount to USDC
      const rates = await getRates([decodedInvoice.unit]);
      if (!rates) {
        throw new Error("Can't get the latest rates.");
      }
      const latestRatePrice = rates[0].getPriceNoOlderThan(200_000);
      if (!latestRatePrice) {
        throw new Error("Can't get the latest rates.");
      }
      latestRateDecimal = new Decimal(latestRatePrice?.price).mul(
        10 ** latestRatePrice.expo
      );
      const calculatedUsdc = new Decimal(decodedInvoice.amount)
        .dividedBy(latestRateDecimal)
        .mul(10 ** 6); // convert to uusdc
      if (!didUserReceivedAmount.amount) {
        throw new Error("Invalid amount in tx.");
      }
      const amountInTxToDecimal = new Decimal(didUserReceivedAmount.amount);
      // calculating if the received amount and calculated amount have at max 1% difference
      // TODO: if the received amount is greater that the calculated amount, we don't need to check the 1% condition
      const validAmount = calculatedUsdc
        .minus(amountInTxToDecimal)
        .dividedBy(calculatedUsdc)
        .mul(100)
        .abs()
        .lessThanOrEqualTo(1);
      validPayment = validPayment && validAmount;

      if (!validPayment) {
        throw new Error("The payment does not pass the confitions");
      }
    } else if (paymentType === "escrow") {
      // TODO: add escrow checks
    } else {
      return NextResponse.json({ error: "Invalid payment." }, { status: 400 });
    }
    // update the database
    const res = await addEscrowTxToInvoice(
      invoiceId,
      txHash,
      payerTgId,
      payerAddress,
      paymentType
    );
    if (res && res > 0) {
      // TODO: send a message to invoice issuer through the bot and inform him that the payment is done
      await prepareTgConfirmationMessage(
        decodedInvoice.issuerTelegramId,
        payerTgId,
        paymentType,
        receivedAmountInUSDC,
        decodedInvoice,
        latestRateDecimal
      );

      return NextResponse.json(
        {
          status: "updated",
        },
        { status: 200 }
      );
    } else {
      console.error(
        "Something wrong happened while updating the invoice with txHash, db result is",
        res
      );
      throw new Error("Can't update the invoice");
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
