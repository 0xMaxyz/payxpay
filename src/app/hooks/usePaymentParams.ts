import { useState, useEffect } from "react";
import Decimal from "decimal.js";
import { SignedInvoice } from "@/types";
import { getRates } from "@/utils/get-rates";
import { PaymentParams } from "@/types/payment";

export const usePaymentParams = (invoice: SignedInvoice | null) => {
  const [latestPrice, setLatestPrice] = useState<
    { price: Decimal; date: string } | undefined
  >();
  const [paymentParams, setPaymentParams] = useState<
    PaymentParams | undefined
  >();
  const [paymentType, setPaymentType] = useState<"direct" | "escrow">("direct");

  useEffect(() => {
    const fetchRates = async () => {
      if (invoice) {
        const rates = await getRates([invoice.unit]);
        if (rates) {
          const price = rates[0].getPriceNoOlderThan(200_000);
          if (price) {
            const latestPrice = {
              price: new Decimal(price.price).mul(
                new Decimal(10).pow(price.expo)
              ),
              date: new Date(price.publishTime * 1000).toLocaleString(),
            };
            setLatestPrice(latestPrice);
            const amount = new Decimal(invoice.amount).dividedBy(
              latestPrice.price
            );
            setPaymentParams({
              amount,
              invoice,
              paymentType: paymentType,
              token: {
                amount: amount
                  .mul(10 ** 6)
                  .toDecimalPlaces(0, Decimal.ROUND_UP)
                  .toString(),
                denom:
                  "ibc/57097251ED81A232CE3C9D899E7C8096D6D87EF84BA203E12E424AA4C9B57A64",
                name: "USDC",
              },
            });
          }
        }
      }
    };

    fetchRates();
  }, [invoice, paymentType]);

  return { paymentParams, latestPrice, setPaymentType, paymentType };
};
