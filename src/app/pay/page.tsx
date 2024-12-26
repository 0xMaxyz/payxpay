"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SignedInvoice } from "../types";

const PayPage = () => {
  const searchParams = useSearchParams();
  const [signedInvoice, setSignedInvoice] = useState<SignedInvoice | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateInvoiceSignature = async (
      signedInvocie: string
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/invoice/validate/${signedInvocie}`);
        if (!res.ok) {
          throw new Error("Failed to fetch invoice details");
        }
        const data = await res.json();
        return data.isValid;
      } catch (error) {
        setError(`Something went wrong, ${JSON.stringify(error)}`);
        return false;
      } finally {
        setLoading(false);
      }
    };
    const CheckInvoice = async (invoive: string) => {
      if (invoive) {
        try {
          // decode the invoice
          const signedInvoice = JSON.parse(decodeURIComponent(invoive));

          if (
            signedInvoice.signature &&
            signedInvoice.id &&
            signedInvoice.id &&
            signedInvoice.issuerTelegramId
          ) {
            // validate signature
            const isValid = await validateInvoiceSignature(invoive);
            if (isValid) {
              // The signature is valid
              setSignedInvoice(signedInvoice as SignedInvoice);
            }
          }
        } catch (error) {
          setError(`Something went wrong, ${JSON.stringify(error)}`);
        }
      }
    };

    const encodedSignedInvoice = searchParams.get("invoice");

    CheckInvoice(encodedSignedInvoice as string);
  }, [searchParams]);

  const handleScanQrCode = () => {};
  const handlePasteFromClipboard = () => {};

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Pay</h1>

      {/* Input Section */}
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
          <button onClick={handleScanQrCode} className="btn btn-primary flex-1">
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

      {/* Loading/Errors */}
      {loading && <p className="text-blue-500 text-center">Loading...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* Invoice Details */}
      {signedInvoice && (
        <div className="border-t pt-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Invoice Details</h2>
          <p className="mb-2">
            <strong>Description:</strong> {signedInvoice.description}
          </p>
          <p className="mb-2">
            <strong>Created At:</strong>{" "}
            {new Date(signedInvoice.issueDate).toLocaleString()}
          </p>
          <p className="mb-2">
            <strong>Price:</strong>{" "}
            {`${signedInvoice.amount} ${signedInvoice.unit}`}
          </p>
          <p className="mb-2">
            <strong>Issuer:</strong> {signedInvoice.issuerFirstName}
          </p>
          <p className="mb-2">
            <strong>Validity:</strong>{" "}
            {signedInvoice.invoiceValidity || "Unlimited"}
          </p>
          <a
            href={`https://t.me/${signedInvoice.issuerTelegramHandle}`}
            target="_blank"
            className="text-blue-500 underline"
          >
            Chat with Issuer
          </a>
        </div>
      )}
    </div>
  );
};

export default PayPage;
