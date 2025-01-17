"use client";
import { useState, useEffect } from "react";
import { useTelegramContext } from "../context/TelegramContext";
import InvoiceList from "../components/invoiceList";

export default function HistoryPage() {
  const { userData } = useTelegramContext();
  const [createdInvoices, setCreatedInvoices] = useState([]);
  const [paidInvoices, setPaidInvoices] = useState([]);
  const [createdPage, setCreatedPage] = useState(1);
  const [paidPage, setPaidPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [createdResponse, paidResponse] = await Promise.all([
        fetch(
          `/api/invoice/query-created?tgId=${userData?.id}&page=${createdPage}`
        ),
        fetch(`/api/invoice/query-paid?tgId=${userData?.id}&page=${paidPage}`),
      ]);
      const [created, paid] = await Promise.all([
        createdResponse.json(),
        paidResponse.json(),
      ]);
      setCreatedInvoices(created);
      setPaidInvoices(paid);
      setLoading(false);
    }
    fetchData();
  }, [userData, createdPage, paidPage]);

  return (
    <div className="p-4">
      {loading ? (
        <span className="loading-spinner loading loading-lg" />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <InvoiceList
            title="Invoices Created by Me"
            items={createdInvoices}
            onLoadMore={() => setCreatedPage((prev) => prev + 1)}
          />
          <InvoiceList
            title="Payments Made by Me"
            items={paidInvoices}
            onLoadMore={() => setPaidPage((prev) => prev + 1)}
          />
        </div>
      )}
    </div>
  );
}
