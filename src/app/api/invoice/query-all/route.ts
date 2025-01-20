import { getAllInvoicesForAUser } from "@/app/db";
import { verifyJWTAndReferer } from "@/utils/verify_jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // verify token
  if (process.env.NEXT_PUBLIC_ENV !== "development") {
    const jwtPayload = verifyJWTAndReferer(req);
    if (jwtPayload instanceof NextResponse) {
      return jwtPayload;
    }
  }
  try {
    const url = new URL(req.url);
    const tgId = url.searchParams.get("tgId");
    const page = url.searchParams.get("page");
    const limit = url.searchParams.get("limit");
    if (!tgId || !page || !limit) {
      throw new Error("Invalid params.");
    }
    const invoices = await getAllInvoicesForAUser(
      Number.parseInt(tgId),
      Number.parseInt(page),
      Number.parseInt(limit)
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
