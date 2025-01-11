import { getInvoice } from "@/app/db";
import { verifyJWTAndReferer } from "@/utils/verify_jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // verify token
  const jwtPayload = verifyJWTAndReferer(req);
  if (jwtPayload instanceof NextResponse) {
    return jwtPayload;
  }
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required variables." },
        { status: 400 }
      );
    }
    console.log("received id", id);
    const invoice = await getInvoice(id);
    if (!invoice) {
      throw new Error("No valid invoice found.");
    }
    console.log("invoice is:", invoice);
    return NextResponse.json(
      {
        invoice,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing invoice:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
