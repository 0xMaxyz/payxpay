import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export type JwtPayload = jwt.JwtPayload;

const SECRET_KEY = process.env.BOT_TOKEN as string;

export function verifyJWTAndReferer(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.NEXT_PUBLIC_ENV !== "development") {
    const referer = req.headers.get("referer");
    if (
      !referer ||
      !referer.startsWith(
        `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL as string}`
      )
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 401 });
    }
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded as { id: number; iat: number; exp: number };
  } catch (error) {
    console.error("Invalid JWT:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }
}
