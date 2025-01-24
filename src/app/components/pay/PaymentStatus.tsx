import React from "react";

interface PaymentStatusProps {
  transmitting: boolean;
  waitingConfirmation: boolean;
  done: boolean;
  txHash?: string | null;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({
  transmitting,
  waitingConfirmation,
  done,
  txHash,
}) => {
  return (
    <div className="flex justify-center items-center">
      {transmitting && (
        <p>
          Transmitting transaction{" "}
          <span className="loading loading-spinner loading-sm"></span>
        </p>
      )}
      {waitingConfirmation && (
        <p>
          Waiting for confirmation{" "}
          <span className="loading loading-spinner loading-sm"></span>
        </p>
      )}
      {done && txHash && (
        <div className="flex flex-col w-full items-center justify-center">
          <p className="tg-text font-bold">Payment completed</p>
          <p className="tg-text overflow-hidden whitespace-nowrap text-ellipsis">
            Transaction Hash:
            <span
              onClick={async () => {
                await navigator.clipboard.writeText(txHash || "");
              }}
              className="material-symbols-outlined"
            >
              content_copy
            </span>{" "}
            {txHash}
          </p>
        </div>
      )}
    </div>
  );
};
