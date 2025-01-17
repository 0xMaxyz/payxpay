import { useState } from "react";

interface InvoiceListProps {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
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
          <InvoiceItem key={item.id} item={item} />
        ))}
      </div>
      <button className="btn btn-primary mt-4" onClick={onLoadMore}>
        Load More
      </button>
    </div>
  );
}

interface InvoiceItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
}

function InvoiceItem({ item }: InvoiceItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`p-4 border rounded-lg ${
        item.out_type === "approved"
          ? "bg-green-100"
          : item.out_type === "refunded"
          ? "bg-red-100"
          : "bg-gray-100"
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
            <strong>Amount:</strong> {item.invoice}
          </p>
          <p className="tg-text ">
            <strong>Created At:</strong> {item.created_at}
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
