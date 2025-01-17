"use client";
import { useState, useEffect } from "react";
import { useTelegramContext } from "../context/TelegramContext";
import InvoiceList, { DbInvoiceItem } from "../components/invoiceList";
import Link from "next/link";

export default function HistoryPage() {
  const { userData, token } = useTelegramContext();
  const [createdInvoices, setCreatedInvoices] = useState<DbInvoiceItem[]>([]);
  const [paidInvoices, setPaidInvoices] = useState<DbInvoiceItem[]>([]);
  const [createdPage, setCreatedPage] = useState(1);
  const [paidPage, setPaidPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [createdResponse, paidResponse] = await Promise.all([
        fetch(
          `/api/invoice/query-created?tgId=${userData?.id}&page=${createdPage}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
        fetch(`/api/invoice/query-paid?tgId=${userData?.id}&page=${paidPage}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);
      const [created, paid] = await Promise.all([
        createdResponse.json(),
        paidResponse.json(),
      ]);
      console.log("created", created);
      console.log("paid", paid);
      setCreatedInvoices(created);
      setPaidInvoices(paid);
      setLoading(false);
    }
    fetchData();
  }, [userData, createdPage, paidPage, token]);

  return (
    <div className="p-4">
      {loading ? (
        <span className="loading-spinner loading loading-lg" />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {createdInvoices ? (
            <InvoiceList
              title="Invoices Created by Me"
              items={createdInvoices}
              onLoadMore={() => setCreatedPage((prev) => prev + 1)}
            />
          ) : (
            <div className="flex flex-row">
              <p>
                {`You don't have any invoice yet, try to create one in `}
                <Link href="/">invoice page.</Link>
              </p>
            </div>
          )}

          {paidInvoices ? (
            <InvoiceList
              title="Payments Made by Me"
              items={paidInvoices}
              onLoadMore={() => setPaidPage((prev) => prev + 1)}
            />
          ) : (
            <div></div>
          )}
        </div>
      )}
    </div>
  );
}
