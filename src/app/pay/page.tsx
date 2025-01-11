"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SignedInvoice } from "../types";
import { copyFromClipboard, decodeInvoice } from "@/utils/tools";
import { HEADERS } from "../consts";
import { useNotification } from "../context/NotificationContext";
import { useTelegramContext } from "../context/TelegramContext";
import Link from "next/link";
import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import {
  Balance,
  CreateMsg,
  EscrowType,
  usePxpContract,
} from "../context/PxpContractContext";
import { getRates } from "@/utils/get-rates";
import { PriceFeed } from "@pythnetwork/price-service-client";

const PayPage = () => {
  // use PxpContract
  const { createEscrow } = usePxpContract();
  //
  const { data: xionAccount } = useAbstraxionAccount();
  const [isModalOpen, setModalOpen] = useModal();
  const changeModalState = () => setModalOpen(!isModalOpen);
  const { addNotification } = useNotification();
  const paymentRef = useRef<HTMLDivElement>(null);
  const {
    scanQrCode,
    mainButton,
    platform,
    token: jwtToken,
  } = useTelegramContext();
  const searchParams = useSearchParams();
  const [signedInvoice, setSignedInvoice] = useState<SignedInvoice | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [priceFeeds, setPriceFeeds] = useState<PriceFeed[] | undefined>(
    undefined
  );
  const [error, setError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<"direct" | "escrow">("direct");

  const getPrice = (s: number = 600) => {
    if (!priceFeeds) {
      return null;
    }
    const price = priceFeeds[0].getPriceNoOlderThan(s);
    if (price) {
      return {
        price: BigInt(price.price) * BigInt(10 ** price.expo),
        date: new Date(price.publishTime * 1000).toLocaleString(),
      };
    } else {
      return null;
    }
  };

  useEffect(() => {
    const onClose = () => {
      mainButton?.disableMainButton();
    };
    return () => {
      onClose();
      console.log("Clear MainButton");
    };
  }, [mainButton]);

  useEffect(() => {
    const processPayment = () => {};
    if (signedInvoice && mainButton) {
      mainButton.enableAndShowMainButton(
        "Pay",
        processPayment,
        undefined,
        undefined,
        5000,
        "Payment in "
      );
    }
  }, [signedInvoice, mainButton]);

  useEffect(() => {
    const rates = async (c: string[]) => {
      const r = await getRates(c);
      if (r) {
        setPriceFeeds(r);
      } else {
        addNotification({ color: "error", message: "Can't update the rates." });
      }
    };
    if (signedInvoice) {
      // get rates
      rates([signedInvoice.unit]);
    }
    if (signedInvoice && paymentRef.current) {
      paymentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [addNotification, signedInvoice]);

  useEffect(() => {
    const getInvoice = async (id: string) => {
      try {
        const res = await fetch(`/api/invoice/get?id=${id}`, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch invoice details");
        }
        const data = await res.json();
        return data.invoice as string;
      } catch (error) {
        setError(`Something went wrong, ${JSON.stringify(error)}`);
        return null;
      }
    };
    const validateInvoiceSignature = async (
      signedInvocie: string
    ): Promise<boolean> => {
      setError(null);
      try {
        const res = await fetch(`/api/invoice/validate`, {
          method: "post",
          headers: HEADERS,
          body: JSON.stringify({ invoice: signedInvocie }),
        });
        if (!res.ok) {
          throw new Error("Failed to fetch invoice details");
        }
        const data = await res.json();
        return data.isValid;
      } catch (error) {
        setError(`Something went wrong, ${JSON.stringify(error)}`);
        return false;
      }
    };
    const CheckInvoice = async (id: string) => {
      if (id) {
        try {
          // get the invoice from db
          const invoice = await getInvoice(id);
          console.log("Received invoice is: ", invoice);
          if (invoice) {
            // validate the invoice signature
            const isValid = await validateInvoiceSignature(invoice);
            if (isValid) {
              // set the invoice details
              const decodedInvoice = decodeInvoice<SignedInvoice>(invoice);
              console.log("Decoded invoice is: ", decodedInvoice);
              setSignedInvoice(decodedInvoice);
            } else {
              setError("Invalid invoice signature");
            }
          }
        } catch (error) {
          setError(`Something went wrong, ${JSON.stringify(error)}`);
        }
      }
    };
    console.log("search params is: ", searchParams);
    const invoiceId = searchParams.get("invoice");
    console.log("Invoice id is: ", invoiceId);
    if (invoiceId) {
      setLoading(true);
      CheckInvoice(invoiceId as string);
      setLoading(false);
    }
  }, [jwtToken, searchParams]);

  const handleScanQrCode = async () => {
    try {
      setLoading(true);
      if (scanQrCode) {
        const qrText = await scanQrCode.showScanQrPopup({
          text: "Scan the QR code of an invoice",
        });
        console.log("Scanned QR code is: ", qrText);
        if (!qrText) {
          addNotification({ color: "warning", message: "QR code is empty" });
          return;
        }
        let invoiceId: string | null = "";
        if (qrText.startsWith("https://")) {
          const sParams = new URL(qrText).searchParams.get("start");
          if (sParams) {
            invoiceId = sParams.split("invoice=")[1];
          }
        } else {
          invoiceId = qrText;
        }
        if (invoiceId) {
          // try to fetch the invoice details
          const res = await fetch(
            `/api/invoice/get-validated?id=${invoiceId}`,
            {
              headers: {
                Authorization: `Bearer ${jwtToken}`,
              },
            }
          );
          if (!res.ok) {
            throw new Error("Failed to fetch invoice details");
          }
          const data = await res.json();
          const decodedInvoice = decodeInvoice<SignedInvoice>(
            data.invoice as string
          );
          setSignedInvoice(decodedInvoice);
        }
      } else {
        throw new Error("Scan QR code is not available");
      }
    } catch (error) {
      console.error("Failed to scan the QR code:", error);
      addNotification({
        message: "Failed to scan the QR code",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  const handlePasteFromClipboard = async () => {
    try {
      setLoading(true);
      const textFromClipboard = await copyFromClipboard();
      if (!textFromClipboard) {
        addNotification({ color: "warning", message: "Clipboard is empty" });
        return;
      }
      console.log("Text from clipboard is: ", textFromClipboard);
      let invoiceId: string | null = null;
      if (textFromClipboard.startsWith("https://")) {
        console.log("Text from clipboard is a url");
        // try to extract the invoice id from the url
        const url = new URL(textFromClipboard);
        const sParams = url.searchParams.get("start");
        if (sParams) {
          invoiceId = sParams.split("invoice=")[1];
        }
      } else {
        console.log("Text from clipboard is not a url");
        invoiceId = textFromClipboard;
      }
      if (invoiceId) {
        console.log("Invoice id is: ", invoiceId);
        // try to fetch the invoice details
        const res = await fetch(`/api/invoice/get-validated?id=${invoiceId}`, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch invoice details");
        }
        const data = await res.json();
        const decodedInvoice = decodeInvoice<SignedInvoice>(
          data.invoice as string
        );
        setSignedInvoice(decodedInvoice);
      }
    } catch (error) {
      console.error("Failed to copy text from clipboard:", error);
      addNotification({
        message: "Failed to copy text from clipboard",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  const escrowType: EscrowType = {
    invoice: { amount: { amount: "1", currency: "TRY" } },
  };

  const handleQueryBalance = async () => {
    try {
      setLoading(true);
      // const res = await bankTransfer(
      //   [{ amount: "10", denom: "uxion" }],
      //   "xion1vr7ylck35y956tw45ndmcwpkdsz75y2fez8ggx",
      //   "hello"
      // );
      const createMsg: CreateMsg = {
        id: crypto.randomUUID(),
        escrow_type: escrowType,
        recipient: "xion1vr7ylck35y956tw45ndmcwpkdsz75y2fez8ggx",
        recepient_email: "",
        recepient_telegram_id: "",
        source_telegram_id: "7312975997",
        title: "escrow title",
        description: "description",
      };
      const balance: Balance = {
        cw20_balance: [
          {
            address:
              "xion1jfzcfyvznelca47utxwqt5nmc8c8yr9jcng3v8fz0jpert9kmtsqq23aml",
            amount: "1",
          },
        ],
        native_balance: [
          // {
          //   amount: "10",
          //   denom:
          //     "ibc/57097251ED81A232CE3C9D899E7C8096D6D87EF84BA203E12E424AA4C9B57A64",
          // },
          // {
          //   amount: "10",
          //   denom: "uxion",
          // },
        ],
      };
      const res = await createEscrow(createMsg, balance);
      console.log(res);
    } catch (error) {
      console.error(error);
      addNotification({ color: "error", message: error as string });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div>
        <button className="btn btn-sm" onClick={handleQueryBalance}>
          QueryBalance
        </button>
      </div>
      <h1 className="text-xl font-bold mb-4">Pay</h1>
      {xionAccount?.bech32Address ? (
        <>
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text">Invoice ID</span>
            </label>
            <input
              type="text"
              value={signedInvoice?.id || ""}
              placeholder="Scan the QR code or paste the invoice"
              className="input input-bordered w-full tg-input"
            />
            <div className="flex gap-4 mt-4">
              {(platform === "android" || platform === "ios") && (
                <button
                  onClick={handleScanQrCode}
                  className="btn btn-primary flex-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    role="img"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="0.1"
                      className="svg-fill"
                      d="M9.5,6.5v3h-3v-3H9.5 M11,5H5v6h6V5L11,5z M9.5,14.5v3h-3v-3H9.5 M11,13H5v6h6V13L11,13z M17.5,6.5v3h-3v-3H17.5 M19,5h-6v6 h6V5L19,5z M13,13h1.5v1.5H13V13z M14.5,14.5H16V16h-1.5V14.5z M16,13h1.5v1.5H16V13z M13,16h1.5v1.5H13V16z M14.5,17.5H16V19h-1.5 V17.5z M16,16h1.5v1.5H16V16z M17.5,14.5H19V16h-1.5V14.5z M17.5,17.5H19V19h-1.5V17.5z M22,7h-2V4h-3V2h5V7z M22,22v-5h-2v3h-3v2 H22z M2,22h5v-2H4v-3H2V22z M2,2v5h2V4h3V2H2z"
                    ></path>
                  </svg>
                  Scan Qr Code
                </button>
              )}
              <button
                onClick={handlePasteFromClipboard}
                className="btn btn-secondary flex-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  role="img"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="0.1"
                    className="svg-fill"
                    d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"
                  ></path>
                </svg>
                Paste from Clipboard
              </button>
            </div>
          </div>
          {signedInvoice && (
            <div ref={paymentRef} className="border-t pt-6 mt-6">
              <h2 className="text-xl font-bold mb-4">Invoice Details</h2>
              <p className="mb-2">
                <strong>Description:</strong> {signedInvoice.description}
              </p>
              <p className="mb-2">
                <strong>Created At:</strong>{" "}
                {new Date(signedInvoice.issueDate * 1000).toLocaleString()}
              </p>
              <p className="mb-2">
                <strong>Price:</strong>{" "}
                {`${signedInvoice.amount} ${signedInvoice.unit}`}
              </p>
              <div className="flex flex-row">
                <p className="mb-2">
                  <strong>Issuer:</strong> {signedInvoice.issuerFirstName}
                </p>
                <Link
                  href={`https://t.me/${signedInvoice.issuerTelegramHandle}`}
                  target="_blank"
                  className="text-blue-500 underline"
                >
                  Chat with {signedInvoice.issuerFirstName}
                </Link>
              </div>
              <p className="mb-2">
                <strong>Validity:</strong>{" "}
                {typeof signedInvoice.invoiceValidity === "number"
                  ? new Date(signedInvoice.invoiceValidity).toLocaleString()
                  : signedInvoice.invoiceValidity}
              </p>
              <div className="w-full flex flex-col">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paymentType"
                    value="direct"
                    checked={paymentType === "direct"}
                    onChange={() => setPaymentType("direct")}
                    className="radio radio-primary"
                  />
                  <span className="ml-2">Direct</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paymentType"
                    value="escrow"
                    checked={paymentType === "escrow"}
                    onChange={() => setPaymentType("escrow")}
                    className="radio radio-primary"
                  />
                  <span className="ml-2">Escrow</span>
                </label>
                {priceFeeds && (
                  <p className="tg-text">
                    {`Estimated price: ${
                      BigInt(signedInvoice.amount) / getPrice(600)!.price
                    } USDC`}{" "}
                    <span className="italic">{`(Price feed updated at ${
                      getPrice(600)?.date
                    })`}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        // show connect button
        <div className="flex flex-col align-middle justify-center">
          <p className="tg-text mb-2">
            Please connect to your xion account before proceeding with the
            payment.
          </p>
          <button
            className={`btn btn-sm btn-success`}
            onClick={() => changeModalState()}
          >
            Connect
          </button>
        </div>
      )}

      {/* Loading/Errors */}
      {loading && (
        <p className="text-blue-500 text-center">
          Loading Invoice{" "}
          <span className="loading loading-dots loading-lg"></span>
        </p>
      )}
      {error && <p className="text-red-500 text-center">{error}</p>}
    </div>
  );
};

export default PayPage;
