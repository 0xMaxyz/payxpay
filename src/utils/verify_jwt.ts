import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.BOT_TOKEN as string;

export function verifyJWT(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded; // Return the decoded payload if valid
  } catch (error) {
    console.error("Invalid JWT:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }
}
