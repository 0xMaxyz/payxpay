import { decodeInvoice } from "@/utils/tools";
import { SignedInvoice } from "@/types";
import { Notif } from "@/app/context/NotificationContext";

export const handleScanQrCode = async (
  scanQrCode: (options: { text: string }) => Promise<string | null>,
  jwtToken: string | null,
  addNotification: (notification: Omit<Notif, "id">) => void,
  setSignedInvoice: (invoice: SignedInvoice | null) => void,
  setIsReceivedInvoicePaid: (
    status: { isPaid: boolean; create_tx: string; out_tx: string } | undefined
  ) => void,
  setLoading: (b: boolean) => void
) => {
  try {
    setLoading(true);
    const qrText = await scanQrCode({ text: "Scan the QR code of an invoice" });
    if (!qrText) {
      addNotification({ color: "warning", message: "QR code is empty" });
      return;
    }

    let invoiceId: string | null = "";
    if (qrText.startsWith("https://")) {
      const sParams = new URL(qrText).searchParams.get("start");
      if (sParams) {
        invoiceId = sParams.split("invoice=")[1];
      }
    } else {
      invoiceId = qrText;
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
    console.error("Failed to scan the QR code:", error);
    addNotification({ message: "Failed to scan the QR code", color: "error" });
  } finally {
    setLoading(false);
  }
};

export const handlePasteFromClipboard = async (
  jwtToken: string | null,
  addNotification: (notification: Omit<Notif, "id">) => void,
  setSignedInvoice: (invoice: SignedInvoice | null) => void,
  setIsReceivedInvoicePaid: (
    status: { isPaid: boolean; create_tx: string; out_tx: string } | undefined
  ) => void,
  setLoading: (b: boolean) => void
) => {
  try {
    setLoading(true);
    const textFromClipboard = await navigator.clipboard.readText();
    if (!textFromClipboard) {
      addNotification({ color: "warning", message: "Clipboard is empty" });
      return;
    }

    let invoiceId: string | null = null;
    if (textFromClipboard.startsWith("https://")) {
      const url = new URL(textFromClipboard);
      const sParams = url.searchParams.get("start");
      if (sParams) {
        invoiceId = sParams.split("invoice=")[1];
      }
    } else {
      invoiceId = textFromClipboard;
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
    console.error("Failed to copy text from clipboard:", error);
    addNotification({
      message: "Failed to copy text from clipboard",
      color: "error",
    });
  } finally {
    setLoading(false);
  }
};
