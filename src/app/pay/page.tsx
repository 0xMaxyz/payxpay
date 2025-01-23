"use client";
import { useSearchParams } from "next/navigation";
import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { useNotification } from "../context/NotificationContext";
import { useTelegramContext } from "../context/TelegramContext";
import { useInvoiceData } from "../hooks/useInvoiceData";
import { usePaymentParams } from "../hooks/usePaymentParams";
import { useEffect, useState } from "react";
import { InvoiceInput } from "../components/pay/InvoiceInput";
import { InvoiceDetails } from "../components/pay/InvoiceDetails";
import PaymentDialog from "../components/paymentDialog";
import { LoadingSpinner } from "../components/LoadingSpinner";
import {
  handlePasteFromClipboard,
  handleScanQrCode,
} from "@/utils/invoiceHandlers";

const PayPage = () => {
  const { data: xionAccount } = useAbstraxionAccount();
  const { addNotification } = useNotification();
  const {
    scanQrCode,
    mainButton,
    platform,
    token: jwtToken,
  } = useTelegramContext();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice");

  const { invoice, loading, setInvoice, setIsReceivedInvoicePaid, setLoading } =
    useInvoiceData(invoiceId, jwtToken);
  const { paymentParams, latestPrice } = usePaymentParams(invoice);
  const [paymentType, setPaymentType] = useState<"direct" | "escrow">("direct");
  const [isPaymentDialogVisible, setIsPaymentDialogVisible] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isModalOpen, setModalOpen] = useModal();

  useEffect(() => {
    return () => mainButton?.disableMainButton();
  }, [mainButton]);

  const onScan = async () => {
    if (scanQrCode) {
      await handleScanQrCode(
        scanQrCode.showScanQrPopup,
        jwtToken,
        addNotification,
        setInvoice,
        setIsReceivedInvoicePaid,
        setLoading
      );
    }
  };

  const onPaste = async () => {
    await handlePasteFromClipboard(
      jwtToken,
      addNotification,
      setInvoice,
      setIsReceivedInvoicePaid,
      setLoading
    );
  };

  if (!xionAccount?.bech32Address) {
    return (
      <div className="flex flex-col align-middle justify-center">
        <p className="tg-text mb-2">
          Please connect to your Xion account before proceeding with the
          payment.
        </p>
        <button
          className="btn btn-sm btn-success"
          onClick={() => setModalOpen(true)}
        >
          Connect
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full p-4">
      <h1 className="text-xl font-bold mb-4">Pay</h1>
      <InvoiceInput onScan={onScan} onPaste={onPaste} platform={platform} />
      {loading && <LoadingSpinner />}
      {invoice && (
        <InvoiceDetails
          invoice={invoice}
          latestPrice={latestPrice}
          paymentType={paymentType}
          onPaymentTypeChange={setPaymentType}
          onPay={() => setIsPaymentDialogVisible(true)}
        />
      )}
      {isPaymentDialogVisible && paymentParams && (
        <PaymentDialog
          paymentParams={paymentParams}
          isOpen={isPaymentDialogVisible}
          onClose={() => setIsPaymentDialogVisible(false)}
        />
      )}
    </div>
  );
};

export default PayPage;
