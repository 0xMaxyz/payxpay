import { getInvoicesCreatedByUser } from "@/app/db";
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
    const tgId = url.searchParams.get("tgId");
    const page = url.searchParams.get("page");
    if (!tgId || !page) {
      throw new Error("Invalid params.");
    }
    const invoices = await getInvoicesCreatedByUser(
      Number.parseInt(tgId),
      Number.parseInt(page)
    );
    return NextResponse.json({ invoices: invoices ?? [] }, { status: 200 });
  } catch (error) {
    console.error("Error querying database:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
