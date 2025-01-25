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
    token: jwtToken,
    platform: tgPlatform,
  } = useTelegramContext();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice");

  const {
    invoice,
    loading,
    setInvoice,
    setIsReceivedInvoicePaid,
    setLoading,
    isReceivedInvoicePaid,
  } = useInvoiceData(invoiceId, jwtToken);
  const { paymentParams, latestPrice, paymentType, setPaymentType } =
    usePaymentParams(invoice);
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
      <InvoiceInput
        onScan={onScan}
        onPaste={onPaste}
        platform={tgPlatform}
        jwtToken={jwtToken}
        addNotification={addNotification}
        setSignedInvoice={setInvoice}
        setIsReceivedInvoicePaid={setIsReceivedInvoicePaid}
      />
      {loading && <LoadingSpinner />}
      {invoice && !isReceivedInvoicePaid?.isPaid && (
        <InvoiceDetails
          invoice={invoice}
          latestPrice={latestPrice}
          paymentType={paymentType}
          onPaymentTypeChange={setPaymentType}
          onPay={() => setIsPaymentDialogVisible(true)}
        />
      )}
      {isReceivedInvoicePaid?.isPaid && (
        <div className="mt-4 text-center">
          <div className="text-green-500 text-8xl">✔</div>
          <p className="mt-2">Payment is Done.</p>
          <p className="overflow-hidden whitespace-nowrap text-ellipsis">
            Transaction Hash:{" "}
            <span
              className="text-blue-500 underline cursor-pointer"
              onClick={async () => {
                await navigator.clipboard.writeText(
                  isReceivedInvoicePaid.create_tx || ""
                );
                addNotification({
                  color: "success",
                  message: "Tx hash copied to clipboard.",
                });
              }}
            >
              {isReceivedInvoicePaid.create_tx}
            </span>
          </p>
        </div>
      )}
      {isPaymentDialogVisible && paymentParams && (
        <PaymentDialog
          paymentParams={paymentParams}
          isOpen={isPaymentDialogVisible}
          onClose={() => {
            setIsPaymentDialogVisible(false);
          }}
          setIsPaid={setIsReceivedInvoicePaid}
        />
      )}
    </div>
  );
};

export default PayPage;
