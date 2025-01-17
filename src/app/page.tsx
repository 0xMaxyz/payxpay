"use client";
import { shortenAddress } from "@/utils/tools";
import { usePxpContract } from "./context/PxpContractContext";
import { useEffect, useState } from "react";
import { Coin } from "@cosmjs/stargate";
import Decimal from "decimal.js";
import { useModal } from "@burnt-labs/abstraxion";

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
  const [isModalOpen, setModalOpen] = useModal();
  const changeModalState = () => setModalOpen(!isModalOpen);

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
                  showGreenMark ? "icon-visible z-1" : "icon-hidden z-0"
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
                  className="skeleton w-full p-4 rounded-lg shadow tg-bg-secondary bg-opacity-25"
                  style={{ height: "84px" }}
                ></div>
                <div
                  className="skeleton w-full p-4 rounded-lg shadow tg-bg-secondary bg-opacity-25"
                  style={{ height: "84px" }}
                ></div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            marginTop: "48px",
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <p className="tg-text mt-4 text-3xl">
            🔥 Connect Your Xion Meta Account! 🚀
          </p>
          <p className="tg-text mt-4">
            To access all features, please connect with your Xion Meta account.
          </p>
          <p className="tg-text mt-2">
            Stay in control of your transactions and payments securely. 🛡️
          </p>
          <button
            className="btn btn-primary btn-md mt-10"
            onClick={changeModalState}
          >
            <div className="flex flex-row">
              <>
                <svg width="25" height="45">
                  <path
                    fill="white"
                    transform=" scale(0.6)"
                    d="M7.42 39.1c-3.83-4.47-5.46-8.45-5.46-12.39 0-2.33.25-3.79.57-5.13C.65 25.56.01 28.53.01 31.34c0 14.85 13.62 16.77 13.62 27.28 0 2.54-1.35 5.99-5.89 12.45 13.7-18.28 17.18-24.86 17.18-29.42 0-12.77-13.56-14.91-13.56-29.27 0-3.28 1.88-7.22 5.38-12.37 0 0-3.33 4.69-5.13 7.19-6.41 8.92-8.89 20.5-4.18 31.91l-.01-.01Z"
                  />
                </svg>
              </>
              <span className="text-xl pb-2" style={{ alignContent: "center" }}>
                Connect Now
              </span>
            </div>
          </button>
        </div>
      )}
    </>
  );
};
export default WalletPage;
