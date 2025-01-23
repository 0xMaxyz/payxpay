"use client";
import { useState, useEffect } from "react";
import { useTelegramContext } from "../context/TelegramContext";
import Link from "next/link";
import { SignedInvoice } from "@/types";
import { decodeInvoice, fetchWithRetries } from "@/utils/tools";
import { useNotification } from "@/app/context/NotificationContext";
import { InvoiceAction } from "../api/invoice/action/route";
import { InvoiceDto } from "../db";

export type InvoiceDtoWithInvoiceData = Omit<InvoiceDto, "invoice"> & {
  invoice: SignedInvoice;
};
export type InvoiceStatus =
  | "Created"
  | "Paid"
  | "Waiting Confirmation"
  | "Payment Confirmed"
  | "Payment Rejected"
  | "Payment Not Confirmed"
  | "Escrow Approved"
  | "Escrow Refunded"
  | "Escrow Rejected";
export type InvoiceDtoWithMetadata = InvoiceDtoWithInvoiceData & {
  status: InvoiceStatus;

  payment_type: "escrow" | "direct" | null;
};

const decodeInvoices = (input: InvoiceDto): InvoiceDtoWithInvoiceData => {
  return { ...input, invoice: decodeInvoice<SignedInvoice>(input.invoice) };
};

const setStatus = (
  input: InvoiceDtoWithInvoiceData
): InvoiceDtoWithMetadata => {
  let status: InvoiceStatus = "Created";
  let payment_type: "escrow" | "direct" | null = null;

  if (!input.out_type) {
    status = "Created";
    payment_type = null;
  }
  if (input.out_type && input.out_type === "direct") {
    payment_type = "direct";
    status = "Paid"; // the status could be confirmed, we'll check it later
  }
  if (payment_type === "direct") {
    if (input.payment_confirmed === null) {
      status = "Waiting Confirmation";
    } else if (input.payment_confirmed === false) {
      status = "Payment Rejected";
    } else {
      status = "Payment Confirmed";
    }
  } else if (
    input.create_tx &&
    input.create_tx_at &&
    input.out_type === "escrow" &&
    !input.out_tx &&
    !input.out_tx_at &&
    input.payment_confirmed === null
  ) {
    status = "Paid";
    payment_type = "escrow";
  } else if (
    input.create_tx &&
    input.create_tx_at &&
    input.out_type === "escrow" &&
    input.payment_confirmed === true &&
    !input.out_tx &&
    !input.out_tx_at
  ) {
    status = "Payment Confirmed";
    payment_type = "escrow";
  } else if (
    input.create_tx &&
    input.create_tx_at &&
    input.out_type === "escrow" &&
    input.payment_confirmed === false &&
    !input.out_tx &&
    !input.out_tx_at
  ) {
    status = "Payment Not Confirmed";
    payment_type = "escrow";
  } else if (
    input.create_tx &&
    input.create_tx_at &&
    input.out_type === "approve" &&
    input.payment_confirmed &&
    input.out_tx &&
    input.out_tx_at
  ) {
    status = "Escrow Approved";
    payment_type = "escrow";
  } else if (
    input.create_tx &&
    input.create_tx_at &&
    input.out_type === "reject"
  ) {
    status = "Escrow Rejected";
    payment_type = "escrow";
  } else if (
    input.create_tx &&
    input.create_tx_at &&
    input.out_type === "refund"
  ) {
    status = "Escrow Refunded";
    payment_type = "escrow";
  }

  return { ...input, status, payment_type };
};

export default function HPage() {
  const { addNotification } = useNotification();
  const { userData, token } = useTelegramContext();
  const [invoices, setInvoices] = useState<InvoiceDtoWithMetadata[]>([]);
  const [filteredInvoices, setfilteredInvoices] = useState<
    InvoiceDtoWithMetadata[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "All Invoices" | "My Invoices" | "My Payments"
  >("All Invoices");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [page, setpage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showRejection, setShowRejection] = useState(false);
  const [executingAction, setExecutingAction] = useState(false);
  const [rejectionReason, setrejectionReason] = useState("");
  const limit = 10; // number of elements to query and show in each page

  // reset rejection div when row changes
  useEffect(() => {
    setrejectionReason("");
    setShowRejection(false);
  }, [expandedRow]);

  useEffect(() => {
    console.log("filter useeffect", userData);
    let filtered: InvoiceDtoWithMetadata[] = [];
    const tgUserId =
      process.env.NEXT_PUBLIC_ENV === "development"
        ? "6376040916"
        : userData?.id;
    if (tgUserId) {
      if (filter === "All Invoices") {
        filtered = invoices;
      } else if (filter === "My Invoices") {
        filtered = invoices.filter(
          (x) => x.issuer_tg_id.toString() === tgUserId.toString()
        );
      } else if (filter === "My Payments") {
        filtered = invoices.filter(
          (x) =>
            x.payer_tg_id && x.payer_tg_id.toString() === tgUserId.toString()
        );
      }
      console.log("Filtered is:", filtered);
      setfilteredInvoices(filtered);
    }
  }, [invoices, filter, userData]);

  useEffect(() => {
    setTotalPages(Math.ceil(totalItems / limit));
  }, [totalItems]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setpage(newPage);
    }
  };
  const [refresh, setRefresh] = useState(false);
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
          const decodedDbInvoices = dbInvoices.invoices
            .map((x) => decodeInvoices(x))
            .map((x) => setStatus(x));
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
  }, [userData, token, addNotification, page, refresh]);

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
          className={`join-item btn btn-sm ${
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
          className="join-item btn btn-sm btn-disabled btn-ghost"
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
          className="join-item btn btn-sm btn-disabled btn-ghost"
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
          className="join-item btn btn-sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "1rem" }}
          >
            arrow_back_ios
          </span>
        </button>
        {pages}
        <button
          className="join-item btn btn-sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "1rem" }}
          >
            arrow_forward_ios
          </span>
        </button>
      </div>
    );
  };

  /**
   * Action Handlers
   */

  const handleAction = async (
    invoiceId: string,
    action: InvoiceAction,
    reason?: string
  ) => {
    try {
      setExecutingAction(true);
      const res = await fetchWithRetries(
        "/api/invoice/action",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ invoiceId, action, reason }),
          method: "POST",
        },
        3
      );

      if (res) {
        addNotification({
          color: "success",
          message: `${action} is successful;`,
        });
      } else {
        throw new Error("No response from server");
      }
      setRefresh((prev) => !prev);
    } catch (error) {
      console.error(`Error processing the ${action} action\n`, error);
      addNotification({
        color: "error",
        message: `Error processing the ${action} action\n${error}`,
      });
    } finally {
      setExecutingAction(false);
    }
  };

  const handleConfirm = async (inv: InvoiceDtoWithMetadata) => {
    await handleAction(inv.invoice_id, "confirm");
  };
  const handleDelete = async (inv: InvoiceDtoWithMetadata) => {
    await handleAction(inv.invoice_id, "delete");
  };
  const handleReject = async (inv: InvoiceDtoWithMetadata) => {
    if (!rejectionReason || rejectionReason.length <= 25) {
      addNotification({
        color: "error",
        message: "Rejection reason is necessary.",
      });
      return;
    }
    await handleAction(inv.invoice_id, "reject", rejectionReason);
  };
  const handleApprove = async (inv: InvoiceDtoWithMetadata) => {
    await handleAction(inv.invoice_id, "approve");
  };
  const handleRefund = async (inv: InvoiceDtoWithMetadata) => {
    await handleAction(inv.invoice_id, "refund");
  };

  ///////////////////////////////////////////

  const renderActions = (inv: InvoiceDtoWithMetadata) => {
    const buttons = [];
    /**
     * Buttons
     * Confirm: Confirm a paid (and unconfirmed) invoice
     * Approve : Approve a confirmed invoice
     * Refund: Refund an unpaid escrow
     * Reject: Reject a confirmed invoice
     */
    const myTgId =
      process.env.NEXT_PUBLIC_ENV === "development" ? 6376040916 : userData?.id;
    console.log(myTgId);
    console.log(inv);
    if (myTgId) {
      if (inv.issuer_tg_id.toString() === myTgId.toString()) {
        console.log("I'm issuer");
        // we are the issuer
        // Issuer can Confirm escrow
        if (inv.status === "Paid") {
          buttons.push(
            <button
              disabled={executingAction}
              className="btn btn-success btn-sm text-white"
              onClick={() => (executingAction ? null : handleConfirm(inv))}
            >
              {executingAction ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Confirming
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">check</span>
                  Confirm
                </>
              )}
            </button>
          );
        }
        // Issuer can delete an escrow
        if (inv.status === "Created") {
          buttons.push(
            <button
              disabled={executingAction}
              className="btn btn-error btn-sm text-white"
              onClick={() => (executingAction ? null : handleDelete(inv))}
            >
              {executingAction ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Deleting Invoice
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">delete</span>
                  Delete Invoice
                </>
              )}
            </button>
          );
        }
      }
      if (inv.payer_tg_id && inv.payer_tg_id.toString() === myTgId.toString()) {
        console.log("I'm Payer");
        // we are payer
        // payer can Reject escrow
        if (!showRejection && inv.status === "Payment Confirmed") {
          buttons.push(
            <button
              disabled={executingAction}
              className="btn btn-primary btn-sm text-white"
              onClick={() => (executingAction ? null : setShowRejection(true))}
            >
              <span className="material-symbols-outlined">
                keyboard_arrow_down
              </span>
              Reject
            </button>
          );
          // payer can Approve escrow
          buttons.push(
            <button
              disabled={executingAction}
              className="btn btn-sm btn-success text-white"
              onClick={() => (executingAction ? null : handleApprove(inv))}
            >
              {executingAction ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Approving
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">done_all</span>
                  Approve
                </>
              )}
            </button>
          );
        }
        // payer can Refund escrow
        if (
          inv.status === "Waiting Confirmation" &&
          inv.out_type !== "direct"
        ) {
          buttons.push(
            <button
              disabled={executingAction}
              className="btn btn-sm  btn-warning text-white"
              onClick={() => (executingAction ? null : handleRefund(inv))}
            >
              {executingAction ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Refunding
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">
                    credit_card_off
                  </span>
                  Refund
                </>
              )}
            </button>
          );
        }
      }
    }

    if (
      inv.status === "Waiting Confirmation" &&
      inv.payment_type === "escrow"
    ) {
      buttons.push(
        <button
          className="btn btn-success btn-sm text-white"
          disabled={executingAction}
          onClick={() => (executingAction ? null : handleConfirm(inv))}
        >
          {executingAction ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Confirming
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">check</span>
              Confirm
            </>
          )}
        </button>
      );
    }
    return <div className="flex gap-2 mt-2">{buttons}</div>;
  };

  return (
    <div className="p-4 flex items-center justify-center w-full">
      {loading ? (
        <span className="loading-spinner loading loading-lg" />
      ) : (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex gap-2 flex-wrap">
            <button
              className={`btn ${
                filter === "All Invoices" ? "btn-success" : "btn-ghost"
              }`}
              onClick={() => setFilter("All Invoices")}
            >
              All Invoices
            </button>
            <button
              className={`btn ${
                filter === "My Invoices" ? "btn-success" : "btn-ghost"
              }`}
              onClick={() => setFilter("My Invoices")}
            >
              My Invoices
            </button>
            <button
              className={`btn ${
                filter === "My Payments" ? "btn-success" : "btn-ghost"
              }`}
              onClick={() => setFilter("My Payments")}
            >
              All Payments
            </button>
          </div>
          <table className="table w-full">
            <thead>
              <tr>
                <th></th>
                <th>Invoice Id</th>
                <th>Created at</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <>
                  <tr
                    key={inv.id}
                    className="tg-bg-primary cursor-pointer hover:bg-base-200"
                    onClick={() => handleRowClick(inv.id)}
                  >
                    <td style={{ width: "0px", padding: "0px" }}>
                      <button className="btn btn-sm btn-ghost btn-circle">
                        <span className="material-symbols-outlined">
                          {expandedRow === inv.id
                            ? "keyboard_arrow_up"
                            : "keyboard_arrow_down"}
                        </span>
                      </button>
                    </td>
                    <td>
                      {inv.invoice_id.slice(0, 8)}
                      <span className="font-extrabold"> ...</span>
                    </td>
                    <td>
                      {inv.created_at
                        ? new Date(
                            1000 * inv.invoice.issueDate
                          ).toLocaleString()
                        : "---"}
                    </td>
                    <td>
                      {inv.invoice.amount}{" "}
                      {inv.invoice.unit.split("-")[1].trim()}
                    </td>
                    <td>{inv.status}</td>
                  </tr>
                  {expandedRow === inv.id && (
                    <tr className="tg-bg-primary">
                      <td className="p-1" colSpan={5}>
                        <div className="p-1 bg-base-100">
                          <p>
                            <strong>Invoice Id:</strong> {inv.invoice_id}
                          </p>
                          <p>
                            <strong>Description:</strong>{" "}
                            {inv.invoice.description
                              ? inv.invoice.description
                              : "---"}
                          </p>
                          <p>
                            <strong>Issued On:</strong>{" "}
                            {new Date(
                              1000 * inv.invoice.issueDate
                            ).toLocaleString()}
                          </p>
                          {inv.payer_tg_id && (
                            <>
                              {/* <p>
                                <strong>Paid By:</strong> {inv.payer_tg_id}
                              </p> */}
                              <p>
                                <strong>Paid at:</strong>{" "}
                                {new Date(inv.create_tx_at).toLocaleString()}
                              </p>
                              <p>
                                <strong>Payment Type:</strong>{" "}
                                {inv.out_type === "direct"
                                  ? "Direct"
                                  : "Escrow"}
                              </p>
                            </>
                          )}

                          {renderActions(inv)}
                          <div
                            className={`${
                              showRejection
                                ? "flex flex-col justify-center items-center w-full mt-2"
                                : "hidden"
                            }`}
                          >
                            <label className="form-control w-full mb-2">
                              <div className="label">
                                <span className="label-text">
                                  Rejection reason
                                </span>
                              </div>
                              <textarea
                                className={`textarea textarea-bordered textarea-sm h-24 max-h-48 min-h-20 tg-input ${
                                  rejectionReason.length <= 25
                                    ? "border-red-500"
                                    : "border-green-500"
                                }`}
                                value={rejectionReason}
                                onChange={(e) => {
                                  if (e.target.value.length <= 256) {
                                    setrejectionReason(e.target.value);
                                  }
                                }}
                              ></textarea>
                              <div className="label">
                                <span className="label-text-alt text-xs">
                                  {" "}
                                  Max length: 256 chars
                                </span>
                                {rejectionReason.length <= 25 && (
                                  <span className="label-text-alt text-error text-xs">
                                    please provide a reason for rejecting the
                                    invoice (min length is 25 chars)
                                  </span>
                                )}
                              </div>
                            </label>
                            <div className="flex flex-row justify-around w-full">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  setrejectionReason("");
                                  setShowRejection(false);
                                }}
                              >
                                <span className="material-symbols-outlined">
                                  keyboard_arrow_up
                                </span>
                                Cancel
                              </button>
                              <button
                                className="btn btn-error btn-sm"
                                disabled={
                                  executingAction ||
                                  rejectionReason.length <= 25
                                    ? true
                                    : false
                                }
                                onClick={() =>
                                  executingAction ? null : handleReject(inv)
                                }
                              >
                                {executingAction ? (
                                  <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Rejecting
                                  </>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined">
                                      delete
                                    </span>
                                    Reject
                                  </>
                                )}
                              </button>
                            </div>
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
