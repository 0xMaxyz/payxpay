import { HEADERS } from "@/app/consts";
import logger from "@/lib/logger";
import verifyTelegramWebAppData from "@/lib/telegram-verifier";
import { NextRequest } from "next/server";

export const GET = async function (req: NextRequest) {
  try {
    // const authHeader = req.headers.get("authorization");
    // if (authHeader !== `Bearer ${process.env.AUTH_SECRET}`) {
    //   logger.error(`${req.url} => Unathorised access prevented, ip: ${req.ip}`);
    //   return new Response("Unauthorized", {
    //     status: 403,
    //     headers: HEADERS,
    //   });
    // }
    const url = new URL(req.url);
    const initData = url.searchParams.get("initData");
    if (initData) {
      // validate the data and return the result
      const isValid = verifyTelegramWebAppData(initData);
      return new Response(JSON.stringify({ isValid }), {
        status: 200,
        headers: HEADERS,
      });
    } else {
      return new Response(JSON.stringify({ error: "initData misssing" }), {
        status: 400,
        headers: HEADERS,
      });
    }
  } catch (error) {
    logger.error(`Error in Telegram user data validation: ${error}`);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: HEADERS,
    });
  }
};
