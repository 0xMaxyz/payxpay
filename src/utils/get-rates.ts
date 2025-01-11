import { CURRENCIES } from "@/app/consts";
import { PriceServiceConnection } from "@pythnetwork/price-service-client";
const hermes = process.env.NEXT_PUBLIC_PRICE_FEED!;
// Get the Stable Hermes service URL from https://docs.pyth.network/price-feeds/api-instances-and-providers/hermes
const connection = new PriceServiceConnection(hermes);

export const getRates = async (currencies: string[]) => {
  const units = currencies.map((x) => x.split("-")[1].trim());
  console.log("units", units);
  const selected = CURRENCIES.filter((c) => units.includes(c.unit)).map(
    (x) => x.contract
  );
  console.log("selected units", selected);

  const rates = await connection.getLatestPriceFeeds(selected);
  console.log("rates", rates);
  return rates;
};
