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
    const res = await getInvoice(id);
    if (!res) {
      throw new Error("No valid invoice found.");
    }
    console.log("invoice is:", res);
    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error processing invoice:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
