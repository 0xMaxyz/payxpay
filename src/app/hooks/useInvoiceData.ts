// src/hooks/useInvoiceData.ts
import { useState, useEffect } from "react";
import { SignedInvoice } from "@/types";
import { decodeInvoice } from "@/utils/tools";

export const useInvoiceData = (
  invoiceId: string | null,
  jwtToken: string | null
) => {
  const [invoice, setInvoice] = useState<SignedInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReceivedInvoicePaid, setIsReceivedInvoicePaid] = useState<
    | {
        isPaid: boolean;
        create_tx: string;
        out_tx: string;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/invoice/get?id=${invoiceId}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (!res.ok) throw new Error("Failed to fetch invoice details");
        const data = await res.json();
        const decodedInvoice = decodeInvoice<SignedInvoice>(data.invoice);
        setInvoice(decodedInvoice);

        if (data.create_tx || data.out_tx) {
          setIsReceivedInvoicePaid({
            isPaid: true,
            create_tx: data.create_tx,
            out_tx: data.out_tx,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, jwtToken]);

  return {
    invoice,
    loading,
    error,
    isReceivedInvoicePaid,
    setInvoice,
    setIsReceivedInvoicePaid,
    setLoading,
  };
};
