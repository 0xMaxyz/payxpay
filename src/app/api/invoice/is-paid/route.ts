import { queryIsPaid } from "@/app/db";
import { verifyJWTAndReferer } from "@/utils/verify_jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // verify token
  const jwtPayload = verifyJWTAndReferer(req);
  if (jwtPayload instanceof NextResponse) {
    return jwtPayload;
  }
  try {
    const { invoice_id } = await req.json();

    if (!invoice_id) {
      return NextResponse.json(
        { error: "Missing required variables." },
        { status: 400 }
      );
    }
    const isPaid = await queryIsPaid(invoice_id);

    if (isPaid && isPaid !== "not-paid") {
      return NextResponse.json(
        {
          isPaid: true,
          payment_status: isPaid,
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      {
        isPaid: false,
        payment_status: isPaid ?? "",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error querying the payment status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
