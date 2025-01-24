import React, { useEffect, useRef, useState } from "react";
import { useTelegramContext } from "../context/TelegramContext";
import { PaymentParams } from "@/types/payment";
import { useBalanceCheck } from "../hooks/useBalanceCheck";
import { usePayment } from "../hooks/usePayment";
import { PaymentStatus } from "./pay/PaymentStatus";

interface PaymentDialogProps {
  paymentParams: PaymentParams;
  isOpen: boolean;
  onClose: () => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  paymentParams,
  isOpen,
  onClose,
}) => {
  const { mainButton } = useTelegramContext();
  const { loading, balance, isBalanceSufficient } = useBalanceCheck(
    paymentParams.token,
    paymentParams.amount
  );
  const { paymentSteps, txHash, handlePayment } = usePayment(paymentParams);
  const modalRef = useRef<HTMLDivElement>(null);
  const [showReviewElement, setShowReviewElement] = useState(false); // State for review confirmation

  useEffect(() => {
    mainButton?.disableMainButton();
  }, [mainButton]);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.classList.remove("hidden");
    } else {
      modalRef.current?.classList.add("hidden");
    }
  }, [isOpen]);

  const handleModalClose = async (event: React.FormEvent) => {
    if (paymentSteps.transmitting || paymentSteps.waitingConfirmation) {
      event.preventDefault();
      const confirmClose = window.confirm(
        "Payment is in process. By closing the payment dialog, you may lose the paid balance. Do you want to proceed?"
      );
      if (confirmClose) {
        onClose?.();
        modalRef.current?.classList.add("hidden");
      }
    } else {
      onClose?.();
      modalRef.current?.classList.add("hidden");
    }
  };

  const handleConfirmPayment = () => {
    //setShowReviewElement(false); // Close the review confirmation
    handlePayment(); // Initiate the payment
  };

  return (
    <div className="relative w-full">
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 tg-bg-secondary-5 bg-opacity-50 backdrop-blur-sm"
          style={{ opacity: 0.7 }}
        ></div>
      )}

      {/* Modal */}
      <div
        ref={modalRef}
        id="payment-modal"
        className="fixed inset-0 flex items-center justify-center hidden"
      >
        <div className="modal-box tg-bg-secondary w-full max-w-md mx-auto flex flex-col items-center justify-center">
          {!paymentSteps.done &&
            !paymentSteps.transmitting &&
            !paymentSteps.waitingConfirmation && (
              <form method="dialog">
                <button
                  className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                  onClick={handleModalClose}
                >
                  ✕
                </button>
              </form>
            )}
          <h1 className="text-2xl font-bold text-center tg-text">Payment</h1>
          {loading ? (
            <div className="w-full space-y-4">
              {/* Skeleton Loading */}
              <div className="skeleton h-6 w-3/4 mx-auto"></div>
              <div className="skeleton h-4 w-1/2 mx-auto"></div>
              <div className="skeleton h-12 w-full mt-4"></div>
              <div className="skeleton h-4 w-1/3 mx-auto mt-2"></div>
            </div>
          ) : isBalanceSufficient ? (
            <div className="w-full">
              {!paymentSteps.done &&
                !paymentSteps.transmitting &&
                !paymentSteps.waitingConfirmation && (
                  <>
                    <div className="py-2">
                      <p className="tg-text">
                        <strong>Amount:</strong>{" "}
                        {`${paymentParams.amount
                          .toDecimalPlaces(2)
                          .toString()} ${paymentParams.token.name.toLocaleUpperCase()}`}
                        <span
                          className={`ml-2 ${
                            balance?.lessThan(paymentParams.token.amount)
                              ? "text-red-500"
                              : "text-green-500"
                          } text-sm`}
                        >
                          {`[current balance: ${balance
                            ?.mul(10 ** -6)
                            .toDecimalPlaces(2)
                            .toString()} USDC]`}
                        </span>
                      </p>
                    </div>
                    <button
                      className="btn btn-success w-full mt-4"
                      onClick={() => setShowReviewElement(true)}
                      disabled={balance?.lessThan(paymentParams.token.amount)}
                    >
                      Pay{" "}
                      {`${paymentParams.amount
                        .toDecimalPlaces(2)
                        .toString()} ${paymentParams.token.name.toLocaleUpperCase()}`}
                    </button>
                    <p className="tg-text text-xs mt-1">
                      <strong>Service Fee:</strong> 0 uxion
                    </p>
                  </>
                )}
              {/* <PaymentStatus
                transmitting={paymentSteps.transmitting}
                waitingConfirmation={paymentSteps.waitingConfirmation}
                done={paymentSteps.done}
                txHash={txHash}
              /> */}
            </div>
          ) : (
            <p className="text-center text-red-500">
              Insufficient balance for payment.
            </p>
          )}
        </div>
      </div>

      {/* Review Confirmation */}
      {showReviewElement && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="tg-bg-secondary p-6 rounded-lg shadow-lg w-full max-w-md">
            {!paymentSteps.done &&
              !paymentSteps.transmitting &&
              !paymentSteps.waitingConfirmation && (
                <>
                  <div className="flex flex-col items-center justify-center tg-text">
                    <p className="tg-text text-2xl font-bold">Review Payment</p>
                    <div className="border-t-2 w-full tg-border-text-color my-4"></div>
                    <p className="text-xs font-bold">Payment Amount</p>
                    <p className="text-xl font-bold">
                      {paymentParams.amount.toDecimalPlaces(2).toString()}{" "}
                      <span className="opacity-35">
                        {paymentParams.token.name.toLocaleUpperCase()}
                      </span>
                    </p>
                    <div className="border-t-2 w-full tg-border-text-color my-4"></div>
                    <p className="text-xs font-bold">Current Balance</p>
                    <p className="text-xs">
                      {balance
                        ?.mul(10 ** -6)
                        .toDecimalPlaces(2)
                        .toString()}{" "}
                      USDC
                    </p>
                  </div>
                  <div className="flex flex-row justify-around mt-5">
                    <button
                      className="btn text-white btn-error btn-sm"
                      onClick={() => setShowReviewElement(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn text-white btn-success btn-sm"
                      onClick={handleConfirmPayment}
                      disabled={
                        paymentSteps.transmitting ||
                        paymentSteps.waitingConfirmation
                      }
                    >
                      Confirm
                    </button>
                  </div>
                </>
              )}

            {/* Payment Steps */}
            <div className="mt-4">
              <PaymentStatus
                transmitting={paymentSteps.transmitting}
                waitingConfirmation={paymentSteps.waitingConfirmation}
                done={paymentSteps.done}
                txHash={txHash}
              />
            </div>

            {/* Close Button when Payment is Done */}
            {paymentSteps.done && (
              <div className="flex justify-center mt-5">
                <button
                  className="btn btn-sm btn-circle btn-ghost"
                  onClick={() => {
                    setShowReviewElement(false); // Close review confirmation
                    onClose(); // Close the payment dialog
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDialog;
