import crypto from "crypto";
import { decodeInitData } from "./tools";
import jwt from "jsonwebtoken";

const jwtValidity = 15 * 60 * 1000;
const botToken = process.env.BOT_TOKEN as string;

const verifyTelegramWebAppData2 = (initData: string) => {
  // read bot token from environment variables

  // The data is a query string, which is composed of a series of field-value pairs.
  const encoded = decodeURIComponent(decodeURIComponent(initData));
  const decoded = decodeInitData(encoded);
  // check if timestamp is valid
  const timestampValidity = Date.now() - decoded.auth_date > 15 * 60 * 1000;
  if (timestampValidity) {
    return {
      validHash: false,
      token: "",
      expired: true,
    };
  }

  // HMAC-SHA-256 signature of the bot's token with the constant string WebAppData used as a key.
  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken);

  // Data-check-string is a chain of all received fields'.
  const arr = encoded.split("&");
  const hashIndex = arr.findIndex((str) => str.startsWith("hash="));
  const hash = arr.splice(hashIndex)[0].split("=")[1];
  // Sorted alphabetically
  arr.sort((a, b) => a.localeCompare(b));
  // In the format key=<value> with a line feed character ('\n', 0x0A) used as separator
  // e.g., 'auth_date=<auth_date>\nquery_id=<query_id>\nuser=<user>
  const dataCheckString = arr.join("\n");

  // The hexadecimal representation of the HMAC-SHA-256 signature of the data-check-string with the secret key
  const _hash = crypto
    .createHmac("sha256", secret.digest())
    .update(dataCheckString)
    .digest("hex");

  const hashIsValid = _hash === hash;
  if (hashIsValid) {
    const expiresIn = Math.floor(
      (decoded.auth_date + jwtValidity - Date.now()) / 1000
    );
    const token = jwt.sign({ id: decoded.user_id }, botToken, {
      expiresIn: expiresIn,
    });
    return {
      validHash: hashIsValid,
      token,
      expired: timestampValidity,
    };
  }
  return null;
};

export default verifyTelegramWebAppData2;
