import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const BOT_TOKEN = process.env.BOT_TOKEN as string;

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_ENV !== "production") {
    const referer = req.headers.get("referer");
    if (
      !referer ||
      !referer.startsWith(
        `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL as string}`
      )
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  try {
    const body = await req.json();
    console.log("Received data:", body);
    const checkString = Object.keys(body)
      .filter((key) => key !== "hash")
      .map((key) => `${key}=${body[key]}`)
      .sort()
      .join("\n");

    const secretKey = crypto.createHash("sha256").update(BOT_TOKEN).digest();
    const hash = crypto
      .createHmac("sha256", secretKey)
      .update(checkString)
      .digest("hex");

    if (hash !== body.hash) {
      return NextResponse.json(
        { error: "Invalid authentication data" },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
