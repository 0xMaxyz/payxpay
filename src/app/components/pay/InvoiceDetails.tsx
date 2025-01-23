import Decimal from "decimal.js";
import { SignedInvoice } from "@/types";
import Link from "next/link";

export const InvoiceDetails = ({
  invoice,
  latestPrice,
  paymentType,
  onPaymentTypeChange,
  onPay,
}: {
  invoice: SignedInvoice;
  latestPrice?: { price: Decimal; date: string };
  paymentType: "direct" | "escrow";
  onPaymentTypeChange: (type: "direct" | "escrow") => void;
  onPay: () => void;
}) => (
  <div className="border-t pt-6 mt-6">
    <h2 className="text-xl font-bold mb-4">Invoice Details</h2>
    <p>
      <strong>Description:</strong> {invoice.description}
    </p>
    <p>
      <strong>Created At:</strong>{" "}
      {new Date(invoice.issueDate * 1000).toLocaleString()}
    </p>
    <p>
      <strong>Price:</strong> {`${invoice.amount} ${invoice.unit}`}
    </p>
    <div className="flex flex-row">
      <p>
        <strong>Issuer:</strong> {invoice.issuerFirstName}{" "}
      </p>
      <Link
        href={`https://t.me/${invoice.issuerTelegramHandle}`}
        target="_blank"
        className="text-blue-500 underline"
      >
        Open chat with {invoice.issuerFirstName}
      </Link>
    </div>
    <p>
      <strong>Validity:</strong>{" "}
      {new Date(invoice.invoiceValidity).toLocaleString()}
    </p>
    <div className="w-full flex flex-col">
      <div className="flex flex-row">
        <p>
          <strong>Payment Type:</strong>
        </p>
        <label className="flex items-center cursor-pointer ms-4">
          <input
            type="radio"
            name="paymentType"
            value="direct"
            checked={paymentType === "direct"}
            onChange={() => onPaymentTypeChange("direct")}
            className="radio radio-primary"
          />
          <span className="ml-2">Direct</span>
        </label>
        <label className="flex items-center cursor-pointer ms-4">
          <input
            type="radio"
            name="paymentType"
            value="escrow"
            checked={paymentType === "escrow"}
            onChange={() => onPaymentTypeChange("escrow")}
            className="radio radio-primary"
          />
          <span className="ml-2">Escrow</span>
        </label>
      </div>
      {latestPrice ? (
        <p className="text-green-600 mt-3">
          {`Estimated price: ${new Decimal(invoice.amount)
            .dividedBy(latestPrice.price)
            .toDecimalPlaces(2)} USDC`}{" "}
          <span className="italic">{`(Price feed updated at ${latestPrice.date})`}</span>
        </p>
      ) : (
        <p className="tg-text mt-3">
          Loading the latest rates
          <span className="loading loading-dots loading-xs my-auto"></span>
        </p>
      )}
      <button className="btn btn-primary btn-success mt-4" onClick={onPay}>
        Pay
      </button>
    </div>
  </div>
);
