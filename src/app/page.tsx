"use client";
import { shortenAddress } from "@/utils/tools";
import { usePxpContract } from "./context/PxpContractContext";
import { useEffect, useState } from "react";
import { Coin } from "@cosmjs/stargate";
import Decimal from "decimal.js";

const WalletPage = () => {
  const { myAddress, getMyBalances } = usePxpContract();
  const [xionBalance, setXionBalance] = useState<Coin | null>(null);
  const [usdcBalance, setusdcBalance] = useState<Coin | null>(null);
  const [xionUsdRate, setXionUsdRate] = useState<number | null>(null);
  const [tokens, setTokens] = useState<
    | {
        updatedat: number;
        balances: { name: string; balance: Decimal; usdValue: Decimal }[];
      }
    | undefined
  >(undefined);

  // update rate - 30seconds timeout
  useEffect(() => {
    const getXionRate = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?include_24hr_change=false&vs_currencies=usd&ids=xion-2",
          {
            method: "GET",
            redirect: "follow",
          }
        );
        if (res.ok) {
          const rate: {
            "xion-2": {
              usd: number;
            };
          } = await res.json();
          console.log("Set rate, ", rate, rate["xion-2"].usd);
          setXionUsdRate(rate["xion-2"].usd);
        }
      } catch (error) {
        console.error("Error fetching the xion rate", error);
      }
    };

    const timer = setTimeout(async () => {
      await getXionRate();
    }, 30000);

    getXionRate();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  // update balance - 30seconds timeout
  useEffect(() => {
    const getBalances = async () => {
      try {
        const balances = await getMyBalances();
        if (balances && balances.length === 2) {
          balances.forEach((x) => {
            if (x && x.denom === "uxion") {
              setXionBalance(x);
            } else if (
              x &&
              x.denom ===
                "ibc/57097251ED81A232CE3C9D899E7C8096D6D87EF84BA203E12E424AA4C9B57A64"
            ) {
            }
            setusdcBalance(x);
          });
        }
      } catch (error) {
        console.error("Error fetching the balances", error);
      }
    };
    const interval = setInterval(async () => {
      await getBalances();
    }, 30000);
    getBalances();
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [getMyBalances]);

  // set tokens
  useEffect(() => {
    if (xionBalance && usdcBalance && xionUsdRate) {
      // Calculate the USD value of xionBalance
      const xionUsdValue = new Decimal(xionBalance.amount)
        .mul(xionUsdRate)
        .div(10 ** 6)
        .toDecimalPlaces(2);
      // Set the tokens array
      setTokens({
        updatedat: Date.now(),
        balances: [
          {
            name: "XION",
            balance: new Decimal(xionBalance.amount).div(10 ** 6),
            usdValue: xionUsdValue,
          },
          {
            name: "USDC",
            balance: new Decimal(usdcBalance.amount).div(10 ** 6),
            usdValue: new Decimal(usdcBalance.amount).div(10 ** 6),
          },
        ],
      });
    }
  }, [xionBalance, usdcBalance, xionUsdRate]);

  const totalUsdValue = tokens?.balances.reduce(
    (sum, t) => t.usdValue.plus(sum),
    new Decimal(0)
  );
  const [showGreenMark, setShowGreenMark] = useState(false);
  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(myAddress);
    setShowGreenMark(true);
    setTimeout(() => {
      setShowGreenMark(false);
    }, 1500);
  };
  return (
    <>
      {myAddress ? (
        <div className="flex flex-col p-4 space-y-6 tg-bg-primary tg-text">
          <div className="flex flex-row justify-center">
            <p className="tg-text">{shortenAddress(myAddress)}</p>
            <div className="inline-block relative">
              <span
                className={`material-symbols-outlined cursor-pointer copy-icon ${
                  showGreenMark ? "icon-hidden z-0" : "icon-visible z-10"
                }`}
                onClick={showGreenMark ? undefined : handleCopyAddress}
              >
                content_copy
              </span>
              <span
                className={`material-symbols-outlined copy-icon text-green-700 ${
                  showGreenMark ? "icon-visible z-10" : "icon-hidden z-0"
                }`}
              >
                check
              </span>
            </div>
          </div>
          <p className="self-center text-sm">Total Available</p>
          <p
            className="self-center text-3xl font-extrabold"
            style={{ marginTop: 0 }}
          >
            {totalUsdValue ? (
              `$${totalUsdValue?.toDecimalPlaces(2).toString()}`
            ) : (
              <span className="loading loading-dots loading-md"></span>
            )}
          </p>
          <div className="flex justify-around space-x-2">
            <button className="btn btn-ghost">
              <div className="flex-flex-col">
                <span className="material-symbols-outlined">arrow_outward</span>
                <p>Send</p>
              </div>
            </button>
            <button className="btn btn-ghost">
              <div className="flex-flex-col">
                <span className="material-symbols-outlined">south_east</span>
                <p>Receive</p>
              </div>
            </button>
            <button className="btn btn-ghost">
              <div className="flex-flex-col">
                <span className="material-symbols-outlined">receipt_long</span>
                <p>Activity</p>
              </div>
            </button>
          </div>
          <div className="space-y-4">
            {tokens?.balances.map((token) => (
              <div
                key={token.name}
                className="flex justify-between items-center border p-4 rounded-lg shadow"
              >
                <div>
                  <p className="text-lg font-bold">{token.name}</p>
                  <p>Balance: {token.balance.toString()}</p>
                </div>
                <p className="text-lg font-bold">
                  ${token.usdValue.toFixed(2)}
                </p>
              </div>
            ))}
            {!tokens && (
              <div className="space-y-4">
                <div
                  className="skeleton w-full p-4 rounded-lg shadow tg-bg-secondary"
                  style={{ height: "84px" }}
                ></div>
                <div
                  className="skeleton w-full p-4 rounded-lg shadow tg-bg-secondary"
                  style={{ height: "84px" }}
                ></div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};
export default WalletPage;
