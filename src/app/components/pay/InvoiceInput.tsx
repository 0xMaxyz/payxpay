import { Notif } from "@/app/context/NotificationContext";
import { useInvoiceInput } from "@/app/hooks/useInvoiceInput";
import { SignedInvoice } from "@/types";
import React, { useEffect, useState } from "react";

export const InvoiceInput = ({
  onScan,
  onPaste,
  platform,
  jwtToken,
  addNotification,
  setSignedInvoice,
  setIsReceivedInvoicePaid,
}: {
  onScan: () => void;
  onPaste: () => void;
  platform: string | null;
  jwtToken: string | null;
  addNotification: (notification: Omit<Notif, "id">) => void;
  setSignedInvoice: (invoice: SignedInvoice | null) => void;
  setIsReceivedInvoicePaid: (
    status: { isPaid: boolean; create_tx: string; out_tx: string } | undefined
  ) => void;
}) => {
  const { invoiceId, loading, handleInvoiceChange } = useInvoiceInput(
    jwtToken,
    addNotification,
    setSignedInvoice,
    setIsReceivedInvoicePaid
  );
  const [clipboardAccess, setclipboardAccess] = useState(false);
  useEffect(() => {
    const requestClipboardPermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: "clipboard-read" as PermissionName,
        });
        setclipboardAccess(permissionStatus.state === "granted");
      } catch (error) {
        console.error("Error checking clipboard permission:", error);
        setclipboardAccess(false);
      }
    };
    requestClipboardPermission();
  }, []);

  return (
    <div className="form-control mb-6">
      <label className="label">
        <span className="label-text">Invoice ID</span>
      </label>
      <input
        type="text"
        placeholder="Scan the QR code or paste the invoice"
        className="input input-bordered w-full tg-input"
        value={invoiceId}
        onChange={(e) => handleInvoiceChange(e.target.value)} // Handle input changes
        disabled={loading} // Disable input while loading
      />
      {loading && (
        <div className="flex justify-center items-center mt-2">
          <span className="loading loading-spinner loading-sm"></span>
          <span className="ml-2">Validating invoice...</span>
        </div>
      )}
      <div className="flex gap-4 mt-4">
        {(platform === "android" || platform === "ios") && (
          <button onClick={onScan} className="btn btn-primary flex-1">
            <span className="material-symbols-outlined">qr_code_scanner</span>
            Scan QR Code
          </button>
        )}
        {clipboardAccess && (
          <button onClick={onPaste} className="btn btn-secondary flex-1">
            <span className="material-symbols-outlined">content_paste</span>
            Paste from Clipboard
          </button>
        )}
      </div>
    </div>
  );
};
