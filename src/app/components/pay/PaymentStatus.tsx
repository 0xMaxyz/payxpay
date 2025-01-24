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
          <div className="text-green-500 text-8xl">✔</div>
          <p className="tg-text font-bold">Payment completed</p>
          <p className="tg-text overflow-hidden whitespace-nowrap text-ellipsis max-w-full">
            Transaction Hash:{" "}
            <span
              onClick={async () => {
                await navigator.clipboard.writeText(txHash || "");
              }}
              className="material-symbols-outlined cursor-pointer hover:text-blue-500"
            >
              content_copy
            </span>{" "}
            <span
              className="inline-block overflow-hidden whitespace-nowrap text-ellipsis max-w-[80%]"
              title={txHash}
            >
              {txHash}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
