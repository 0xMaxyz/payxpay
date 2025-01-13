import { addEscrowTxToInvoice } from "@/app/db";
import { verifyJWTAndReferer } from "@/utils/verify_jwt";
import { NextRequest, NextResponse } from "next/server";

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
    // update the database
    const res = await addEscrowTxToInvoice(
      invoiceId,
      txHash,
      paymentType,
      payerTgId,
      payerAddress
    );
    if (res && res > 0) {
      // TODO: send a message to invoice issuer through the bot and inform him that the payment is done
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
