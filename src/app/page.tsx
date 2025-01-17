"use client";
import { fetchWithRetries, shortenAddress } from "@/utils/tools";
import { usePxpContract } from "./context/PxpContractContext";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Coin } from "@cosmjs/stargate";
import Decimal from "decimal.js";
import { useModal } from "@burnt-labs/abstraxion";
import QrCode from "qrcode";
import Image from "next/image";
import { fromBech32 } from "@cosmjs/encoding";
import { useNotification } from "./context/NotificationContext";

const WalletPage = () => {
  const activityDialogRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotification();
  const [createdQrCode, setCreatedQrCode] = useState("");
  const [selectedToken, setselectedToken] = useState<"XION" | "USDC">("XION");
  const [amount, setamount] = useState("0");
  const [receiverAddress, setreceiverAddress] = useState("");
  const [receiverAddressError, setreceiverAddressError] = useState(true);
  const [memo, setmemo] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [sentTxHash, setsentTxHash] = useState<string | null>(null);

  const { myAddress, getMyBalances, bankTransfer } = usePxpContract();
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
  //

  const WalletModals = [
    "activity-modal",
    "send-modal",
    "receive-modal",
  ] as const;
  type WalletModal = (typeof WalletModals)[number];

  const showModal = (modal: WalletModal) => {
    // close others
    WalletModals.filter((x) => x !== modal).forEach((m) => {
      closeModal(m);
    });

    // show requested modal
    const dialog = document.getElementById(modal);
    if (dialog) {
      (dialog as HTMLDialogElement).showModal();
    }
  };

  const closeModal = (modal: WalletModal) => {
    const dialog = document.getElementById(modal);
    if (dialog) {
      (dialog as HTMLDialogElement).close();
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedTx, setExpandedTx] = useState(null);

  useEffect(() => {
    if (myAddress) {
      QrCode.toDataURL(myAddress, { errorCorrectionLevel: "H" }, (err, url) => {
        if (err) {
          console.error("Failed to generate QR code:", err);
        } else {
          console.log("QR Code Data URL:", url);
          setCreatedQrCode(url);
        }
      });
    }
  }, [myAddress]);

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

  useEffect(() => {
    // Reset state when myAddress changes
    setTransactions([]);
    setCurrentPage(1);
    setHasMore(true);
  }, [myAddress]);

  const fetchTransaction = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const data = await fetchWithRetries(
          process.env.NEXT_PUBLIC_XION_RPC!,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: Date.now(),
              method: "tx_search",
              params: {
                query: `message.sender='${myAddress}'`,
                page: page.toString(),
                per_page: "10",
                order_by: "desc",
              },
            }),
          },
          3 // Maximum number of retries
        );

        if (data.result?.txs?.length > 0) {
          setTransactions((prev) => [...prev, ...data.result.txs]);
        }
        setHasMore(data.result?.txs?.length === 10);
      } catch (err) {
        console.error("Failed to fetch transactions after retries", err);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [myAddress]
  );

  useEffect(() => {
    fetchTransaction(currentPage);
  }, [fetchTransaction, currentPage]);

  useEffect(() => {
    const dialogContainer = activityDialogRef.current;

    const handleScroll = () => {
      if (dialogContainer) {
        const { scrollTop, scrollHeight, clientHeight } = dialogContainer;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

        if (isNearBottom && !loading && hasMore) {
          setCurrentPage((prevPage) => prevPage + 1);
        }
      }
    };

    if (dialogContainer) {
      dialogContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (dialogContainer) {
        dialogContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [loading, hasMore]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toggleExpand = (index: any) => {
    setExpandedTx((prev) => (prev === index ? null : index));
  };

  const handleAmountInput = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    // Regular expression allows numbers with up to 6 decimal places
    if (/^\d*(\.\d{0,6})?$/.test(value)) {
      setamount(value);
    }
  };

  const handleMax = () => {
    const max =
      selectedToken === "USDC"
        ? new Decimal(usdcBalance?.amount ?? 0).div(10 ** 6).toString()
        : new Decimal(xionBalance?.amount ?? 0).div(10 ** 6).toString();
    setamount(max);
  };

  const validateAddress = (
    address: string,
    chain: "xion" = "xion"
  ): boolean => {
    try {
      fromBech32(address);
      // Check if the address starts with the "xion" prefix
      return address.startsWith(chain);
    } catch (error) {
      console.error("Invalid address:", error);
      return false;
    }
  };

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const address = event.target.value;
    setreceiverAddress(address);

    if (validateAddress(address)) {
      setreceiverAddressError(false);
    } else {
      setreceiverAddressError(true);
    }
  };
  const handleMemoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const memo = event.target.value;
    setmemo(memo);
  };

  const resetSend = () => {
    setamount("0");
    setreceiverAddress("");
    setreceiverAddressError(true);
    setmemo("");
    setTransferring(false);
    setsentTxHash(null);
  };

  const handleTransfer = async () => {
    try {
      setTransferring(true);
      // ask for confirmation
      const res = window.confirm("Confirm Transferring the funds");
      if (res) {
        const tx = await bankTransfer(
          [
            {
              amount: new Decimal(amount).mul(10 ** 6).toString(),
              denom:
                selectedToken === "XION"
                  ? "uxion"
                  : "ibc/57097251ED81A232CE3C9D899E7C8096D6D87EF84BA203E12E424AA4C9B57A64",
            },
          ],
          receiverAddress,
          memo
        );
        if (tx && tx.transactionHash) {
          setsentTxHash(tx.transactionHash);
        }
      }
    } catch (error) {
      console.error("Error transferring funds", error);
    } finally {
      setTransferring(false);
    }
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
            <button
              className="btn btn-ghost"
              onClick={() => showModal("send-modal")}
            >
              <div className="flex-flex-col">
                <span className="material-symbols-outlined">arrow_outward</span>
                <p>Send</p>
              </div>
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => showModal("receive-modal")}
            >
              <div className="flex-flex-col">
                <span className="material-symbols-outlined">south_east</span>
                <p>Receive</p>
              </div>
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => showModal("activity-modal")}
            >
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

      {/* Send Modal */}
      <dialog id="send-modal" className="modal w-full" onClose={resetSend}>
        <div className="modal-box tg-bg-secondary w-10/12 max-w-5xl">
          <form method="dialog">
            {!transferring && (
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                ✕
              </button>
            )}
          </form>
          <div className="flex  flex-col justify-center items-center">
            <p className="tg-text text-xl font-bold mb-4">Send Tokens</p>

            <label className="form-control w-full mb-2">
              <div className="label">
                <span className="label-text">Token</span>
              </div>
              <select
                className="select select-bordered select-sm tg-input"
                value={selectedToken}
                onChange={(e) =>
                  setselectedToken(e.target.value as "XION" | "USDC")
                }
              >
                <option value="XION">XION</option>
                <option value="USDC">USDC</option>
              </select>
            </label>

            <label className="w-full mb-2">
              <div className="label">
                <span className="label-text">Amount</span>
                {selectedToken === "USDC" ? (
                  <span className="label-text text-xs ">
                    {new Decimal(usdcBalance?.amount ?? 0)
                      .div(10 ** 6)
                      .toString()}{" "}
                    USDC
                  </span>
                ) : (
                  <span className="label-text text-xs">
                    {new Decimal(xionBalance?.amount ?? 0)
                      .div(10 ** 6)
                      .toString()}{" "}
                    XION
                  </span>
                )}
              </div>
              <label
                className={`input input-bordered input-sm flex items-center gap-2 tg-input
                ${
                  new Decimal(amount).lessThanOrEqualTo(
                    selectedToken === "USDC"
                      ? new Decimal(usdcBalance?.amount ?? 0).div(10 ** 6)
                      : new Decimal(xionBalance?.amount ?? 0).div(10 ** 6)
                  )
                    ? "border-green-500"
                    : "border-red-500"
                }
                `}
              >
                <input
                  type="text"
                  placeholder="123"
                  className="input input-sm w-full tg-input"
                  value={amount}
                  onChange={handleAmountInput}
                />
                <button className="btn btn-ghost btn-xs" onClick={handleMax}>
                  Max
                </button>
              </label>
            </label>

            <label className="form-control w-full mb-2">
              <div className="label">
                <span className="label-text">Receiver Address</span>
              </div>
              <input
                type="text"
                placeholder="xion..."
                className={`input input-bordered input-sm w-full tg-input
                  ${
                    receiverAddressError ? "border-red-500" : "border-green-500"
                  }`}
                value={receiverAddress}
                onChange={handleAddressChange}
              />
            </label>

            <label className="form-control w-full mb-2">
              <div className="label">
                <span className="label-text">Memo</span>
              </div>
              <input
                type="text"
                placeholder="optional"
                className={`input input-bordered input-sm w-full tg-input
                  `}
                value={memo}
                onChange={handleMemoChange}
              />
            </label>
            <button
              className="btn btn-primary btn-sm btn-wide mt-6"
              onClick={transferring ? () => {} : handleTransfer}
              disabled={
                transferring ||
                new Decimal(amount).greaterThan(
                  selectedToken === "USDC"
                    ? new Decimal(usdcBalance?.amount ?? 0).div(10 ** 6)
                    : new Decimal(xionBalance?.amount ?? 0).div(10 ** 6)
                ) ||
                Number.isNaN(Number.parseFloat(amount)) ||
                Number.parseFloat(amount) === 0.0 ||
                receiverAddressError
              }
            >
              {transferring ? (
                <span className="loading loading-dots loading-md "></span>
              ) : (
                <>
                  <span className="text-lg ">Send</span>
                  <span className="material-symbols-outlined">
                    arrow_outward
                  </span>
                </>
              )}
            </button>
            {sentTxHash && (
              <div className="mt-4 text-center w-full">
                <p className="overflow-hidden whitespace-nowrap text-ellipsis">
                  Transaction Hash:{" "}
                  <span
                    className="text-blue-500 underline cursor-pointer"
                    onClick={async () => {
                      await navigator.clipboard.writeText(sentTxHash || "");
                      addNotification({
                        color: "success",
                        message: "Tx hash copied to clipboard.",
                      });
                    }}
                  >
                    {sentTxHash}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </dialog>

      {/* Receive Modal */}
      <dialog id="receive-modal" className="modal w-full">
        <div className="modal-box tg-bg-secondary w-10/12 max-w-5xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <div className="flex flex-col justify-center items-center">
            <p className="tg-text text-xl font-bold">Receive Tokens</p>
            <Image
              className=" mt-4 mb-4 w-48 h-48 object-cover aspect-square justify-center"
              src={
                createdQrCode === ""
                  ? "/assets/img/qr-placeholder.png"
                  : createdQrCode
              }
              alt="QR Code"
              width={150}
              height={150}
            ></Image>
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
          </div>
        </div>
      </dialog>

      {/* Activity Modal */}
      <dialog id="activity-modal" className="modal w-full">
        <div
          ref={activityDialogRef}
          className="modal-box tg-bg-secondary w-11/12 max-w-5xl"
        >
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <div className="p-4">
            <p className="tg-text text-xl font-bold mb-4">Transactions</p>
            <div className="space-y-4">
              {transactions.map((tx, index) => (
                <div
                  key={tx.hash || index}
                  className="tg-bg-secondary border p-4 rounded-lg shadow cursor-pointer"
                  onClick={() => toggleExpand(index)}
                >
                  {/* Minimal Data */}
                  <p className="text-sm font-bold">
                    Tx Hash:{" "}
                    {tx.hash ? `${tx.hash.slice(0, 10)}...` : "Unknown"}
                  </p>
                  <p className="text-sm">Height: {tx.height}</p>

                  {/* Expanded Details */}
                  {expandedTx === index && (
                    <div className="mt-2 text-sm">
                      <p>Gas Used: {tx.tx_result.gas_used || "N/A"}</p>
                      <p>Gas Wanted: {tx.tx_result.gas_wanted || "N/A"}</p>
                      <p>
                        Events:{" "}
                        <pre className="bg-gray-100 p-2 rounded">
                          {JSON.stringify(tx.tx_result?.events, null, 2)}
                        </pre>
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {loading && <p className="text-center">Loading...</p>}
              {!hasMore && (
                <p className="text-center">No more transactions to load.</p>
              )}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
};
export default WalletPage;
