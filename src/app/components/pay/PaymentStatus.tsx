import React from "react";

interface PaymentStatusProps {
  transmitting: boolean;
  waitingConfirmation: boolean;
  done: boolean;
  txHash?: string | null;
  txFailure?: boolean;
  txFailureMessage?: string;
  invoiceId?: string;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({
  transmitting,
  waitingConfirmation,
  done,
  txHash,
  txFailure,
  txFailureMessage,
  invoiceId,
}) => {
  return (
    <div className="flex flex-col justify-center items-center">
      {transmitting && (
        <p>
          Transmitting transaction{" "}
          <span className="loading loading-spinner loading-sm"></span>
        </p>
      )}
      {waitingConfirmation && (
        <p>
          Saving the tx info{" "}
          <span className="loading loading-spinner loading-sm"></span>
        </p>
      )}

      {done && txHash && !txFailure && (
        <div className="flex flex-col w-full items-center justify-center">
          <div className="text-green-500 text-8xl">✔</div>
          <p className="tg-text font-bold my-8">Payment completed</p>
        </div>
      )}

      {txFailure && (
        <div className="flex flex-col w-full items-center justify-center">
          <span
            className="material-symbols-outlined text-red-500"
            style={{ fontSize: "5rem" }}
          >
            error
          </span>
          <p className="tg-text font-bold text-3xl my-8">Payment Failed</p>
          {txFailureMessage && (
            <p className="whitespace-normal break-words max-w-full text-red-700 h-14 overflow-y-auto">
              {txFailureMessage}
            </p>
          )}

          {invoiceId && (
            <p className="tg-text overflow-hidden whitespace-nowrap text-ellipsis max-w-full mt-4">
              Invoice ID:{" "}
              <span
                title="Copy Invoice ID"
                onClick={async () => {
                  await navigator.clipboard.writeText(invoiceId || "");
                }}
                className="material-symbols-outlined cursor-pointer  mx-2 hover:text-blue-500"
                style={{ fontSize: "1rem" }}
              >
                content_copy
              </span>{" "}
              <span className="text-xs" title={invoiceId}>
                {invoiceId}
              </span>
            </p>
          )}
        </div>
      )}

      {txHash && (
        <p className="tg-text overflow-hidden whitespace-nowrap text-ellipsis max-w-full mt-4">
          Transaction Hash:{" "}
          <span
            title="Copy Transaction Hash"
            onClick={async () => {
              await navigator.clipboard.writeText(txHash || "");
            }}
            className="material-symbols-outlined cursor-pointer mx-2 hover:text-blue-500"
            style={{ fontSize: "1rem" }}
          >
            content_copy
          </span>{" "}
          <span
            className="overflow-hidden whitespace-nowrap text-ellipsis max-w-[80%] text-xs"
            title={txHash}
          >
            {txHash}
          </span>
        </p>
      )}
    </div>
  );
};
