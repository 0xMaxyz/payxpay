"use client";
import { useState, useEffect } from "react";
import { useTelegramContext } from "../context/TelegramContext";
import Link from "next/link";
import { SignedInvoice } from "@/types";
import { decodeInvoice } from "@/utils/tools";
import { useNotification } from "@/app/context/NotificationContext";

export interface InvoiceDto {
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
  total_items: number;
}
export type InvoiceDtoWithInvoiceData = Omit<InvoiceDto, "invoice"> & {
  invoice: SignedInvoice;
};

const decodeInvoices = (input: InvoiceDto): InvoiceDtoWithInvoiceData => {
  return { ...input, invoice: decodeInvoice<SignedInvoice>(input.invoice) };
};

export default function HPage() {
  const { addNotification } = useNotification();
  const { userData, token } = useTelegramContext();
  const [invoices, setInvoices] = useState<InvoiceDtoWithInvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "created" | "paid">("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [page, setpage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 3;

  useEffect(() => {
    setTotalPages(Math.ceil(totalItems / limit));
  }, [totalItems]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setpage(newPage);
    }
  };

  useEffect(() => {
    async function fetchData() {
      const tgUserId =
        process.env.NEXT_PUBLIC_ENV === "development"
          ? "6376040916"
          : userData?.id;
      try {
        setLoading(true);
        const res = await fetch(
          `/api/invoice/query-all?tgId=${tgUserId}&page=${page}&limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.ok) {
          const dbInvoices: { invoices: InvoiceDto[] } = await res.json();
          const decodedDbInvoices = dbInvoices.invoices.map((x) =>
            decodeInvoices(x)
          );
          console.log(decodedDbInvoices);
          if (decodedDbInvoices && decodedDbInvoices.length >= 1) {
            setTotalItems(decodedDbInvoices[0].total_items);
          }
          setInvoices(decodedDbInvoices);
        } else {
          throw new Error("Error reading invoices");
        }
      } catch (error) {
        console.error(error);
        addNotification({ color: "error", message: "Can't read invoices" });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userData, token, addNotification, page]);

  const filteredInvoices = invoices.filter((invoice) => {
    if (filter === "created") return invoice.issuer_tg_id === userData?.id;
    if (filter === "paid") return invoice.payer_tg_id === userData?.id;
    return true;
  });

  const handleRowClick = (invoiceId: number) => {
    setExpandedRow(expandedRow === invoiceId ? null : invoiceId);
  };

  const renderPagination = () => {
    const pages = [];
    const ellipsisThreshold = 1;

    const addPageButton = (pageNumber: number) => {
      pages.push(
        <button
          key={pageNumber}
          className={`join-item btn ${
            page === pageNumber ? "btn-primary" : ""
          }`}
          onClick={() => handlePageChange(pageNumber)}
        >
          {pageNumber}
        </button>
      );
    };

    // Always show the first page
    addPageButton(1);

    // Show ellipsis if the current page is far from the first page
    if (page - ellipsisThreshold > 2) {
      pages.push(
        <button
          key="ellipsis-start"
          className="join-item btn btn-disabled btn-ghost"
          disabled
        >
          ...
        </button>
      );
    }

    // Show pages around the current page
    for (
      let i = Math.max(2, page - ellipsisThreshold);
      i <= Math.min(totalPages - 1, page + ellipsisThreshold);
      i++
    ) {
      addPageButton(i);
    }

    // Show ellipsis if the current page is far from the last page
    if (page + ellipsisThreshold + 1 < totalPages) {
      pages.push(
        <button
          key="ellipsis-end"
          className="join-item btn btn-disabled btn-ghost"
          disabled
        >
          ...
        </button>
      );
    }

    // Always show the last page
    if (totalPages > 1) {
      addPageButton(totalPages);
    }

    return (
      <div className="join">
        <button
          className="join-item btn"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        >
          Previous
        </button>
        {pages}
        <button
          className="join-item btn"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="p-4">
      {loading ? (
        <span className="loading-spinner loading loading-lg" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              className={`btn ${
                filter === "all" ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`btn ${
                filter === "created" ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setFilter("created")}
            >
              Created
            </button>
            <button
              className={`btn ${
                filter === "paid" ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setFilter("paid")}
            >
              Paid
            </button>
          </div>

          <table className="table w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <>
                  <tr
                    key={inv.id}
                    className="cursor-pointer hover:bg-base-200"
                    onClick={() => handleRowClick(inv.id)}
                  >
                    <td>{inv.id}</td>
                    <td>{inv.invoice.amount}</td>
                    <td>status</td>
                    <td>
                      <button className="btn btn-sm btn-primary">View</button>
                    </td>
                  </tr>
                  {expandedRow === inv.id && (
                    <tr>
                      <td colSpan={4}>
                        <div className="p-4 bg-base-100">
                          <p>
                            <strong>Description:</strong>{" "}
                            {inv.invoice.description}
                          </p>
                          <p>
                            <strong>Issued On:</strong>{" "}
                            {new Date(
                              1000 * inv.invoice.issueDate
                            ).toLocaleDateString()}
                          </p>
                          <p>
                            <strong>Paid By:</strong> {inv.payer_tg_id}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button className="btn btn-sm btn-success">
                              Confirm
                            </button>
                            <button className="btn btn-sm btn-error">
                              Reject
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {filteredInvoices.length === 0 && (
            <div className="flex flex-row">
              <p>
                {`You don't have any invoice yet, try to create one in `}
                <Link href="/">invoice page.</Link>
              </p>
            </div>
          )}
          <div className="flex items-center justify-center w-full">
            {renderPagination()}
          </div>
        </div>
      )}
    </div>
  );
}
