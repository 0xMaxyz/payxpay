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
      {done && txHash && <p>Payment completed. Transaction Hash: {txHash}</p>}
    </div>
  );
};
