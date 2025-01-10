import { HEADERS } from "@/app/consts";
import logger from "@/lib/logger";
import verifyTelegramWebAppData2 from "@/lib/telegram-verifier2";
import { NextRequest } from "next/server";

export const GET = async function (req: NextRequest) {
  try {
    const url = new URL(req.url);
    const initData = url.searchParams.get("initData");
    if (initData) {
      // validate the data and return the result
      const res = verifyTelegramWebAppData2(initData);
      if (!res) {
        return new Response(
          JSON.stringify({ error: "Invalid/expired initData" }),
          {
            status: 403,
            headers: HEADERS,
          }
        );
      }
      return new Response(
        JSON.stringify({ isValid: res.validHash, jwt: res.token }),
        {
          status: 200,
          headers: HEADERS,
        }
      );
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
