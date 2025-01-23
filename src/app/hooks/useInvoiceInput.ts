import { useState, useEffect } from "react";
import { debounce } from "lodash"; // Import debounce from lodash
import { decodeInvoice, isValidUUID } from "@/utils/tools";
import { SignedInvoice } from "@/types";
import { Notif } from "../context/NotificationContext";

export const useInvoiceInput = (
  jwtToken: string | null,
  addNotification: (notification: Omit<Notif, "id">) => void,
  setSignedInvoice: (invoice: SignedInvoice | null) => void,
  setIsReceivedInvoicePaid: (
    status: { isPaid: boolean; create_tx: string; out_tx: string } | undefined
  ) => void
) => {
  const [invoiceId, setInvoiceId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvoiceChange = debounce(async (value: string) => {
    setInvoiceId(value); // Update the invoice ID state
    console.log("Invoice ID:", value);

    if (!value) {
      addNotification({ color: "warning", message: "Invoice ID is empty" });
      return;
    }

    try {
      setLoading(true);

      let invoiceId: string | null = null;
      if (value.startsWith("https://")) {
        const url = new URL(value);
        const sParams = url.searchParams.get("start");
        if (sParams) {
          invoiceId = sParams.split("invoice=")[1];
        }
      } else {
        invoiceId = value;
      }
      if (invoiceId && !isValidUUID(invoiceId)) {
        addNotification({
          color: "error",
          message: "Invalid Invoice ID: Must be a valid UUID",
        });
        return;
      }

      if (invoiceId) {
        const res = await fetch(`/api/invoice/get-validated?id=${invoiceId}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (!res.ok) throw new Error("Failed to fetch invoice details");
        const data = await res.json();
        const decodedInvoice = decodeInvoice<SignedInvoice>(data.invoice);
        if (data.create_tx || data.out_tx) {
          setIsReceivedInvoicePaid({
            isPaid: true,
            create_tx: data.create_tx,
            out_tx: data.create_tx,
          });
        }
        setSignedInvoice(decodedInvoice);
      }
    } catch (error) {
      console.error("Failed to fetch invoice details:", error);
      addNotification({
        message: "Failed to fetch invoice details",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  }, 10); // Debounce for 500ms

  useEffect(() => {
    return () => {
      handleInvoiceChange.cancel();
    };
  }, [handleInvoiceChange]);

  return { invoiceId, loading, handleInvoiceChange };
};
