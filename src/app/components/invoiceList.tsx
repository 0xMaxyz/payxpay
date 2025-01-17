import { useState } from "react";
import { SignedInvoice } from "../types";
import { decodeInvoice } from "@/utils/tools";

export interface DbInvoiceItem {
  id: number;
  invoice: string;
  invoice_id: string;
  issuer_tg_id: number;
  create_tx: string;
  out_tx: string;
  out_type: string;
  create_tx_at: number;
  out_tx_at: number;
  payer_tg_id: number;
  payer_address: string;
  payment_confirmed: boolean;
  rejection_reason: string;
  created_at: number;
}
interface InvoiceListProps {
  title: string;
  items: DbInvoiceItem[];
  onLoadMore: () => void;
}

export default function InvoiceList({
  title,
  items,
  onLoadMore,
}: InvoiceListProps) {
  return (
    <div>
      <h2 className="tg-text text-lg font-bold">{title}</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <InvoiceItem
            key={item.id}
            item={item}
            invoice={decodeInvoice<SignedInvoice>(item.invoice)}
          />
        ))}
      </div>
      <button className="btn btn-primary mt-4" onClick={onLoadMore}>
        Load More
      </button>
    </div>
  );
}

interface InvoiceItemProps {
  item: DbInvoiceItem;
  invoice: SignedInvoice;
}

function InvoiceItem({ item, invoice }: InvoiceItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`p-4 border rounded-lg ${
        item.out_type === "approved"
          ? "bg-green-500"
          : item.out_type === "refunded"
          ? "bg-red-500"
          : "tg-bg-primary"
      }`}
    >
      <div onClick={() => setExpanded(!expanded)} className="cursor-pointer">
        <p>
          <span className="tg-text font-bold">Invoice ID:</span>{" "}
          {item.invoice_id}
        </p>
        <p>
          <span className="tg-text  font-bold">Type:</span>{" "}
          {item.out_type || "Pending"}
        </p>
      </div>
      {expanded && (
        <div className="mt-2">
          <p className="tg-text ">
            <strong>Amount:</strong>{" "}
            {`${invoice.amount} ${invoice.unit.split("-")[1].trim()}`}
          </p>
          <p className="tg-text ">
            <strong>Created At:</strong>{" "}
            {new Date(1000 * item.created_at).toLocaleDateString()}
          </p>
          <p className="tg-text ">
            <strong>Status:</strong>{" "}
            {item.payment_confirmed ? "Confirmed" : "Pending"}
          </p>
          {item.out_tx && (
            <p className="tg-text ">
              <strong>Transaction Hash:</strong> {item.out_tx}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
