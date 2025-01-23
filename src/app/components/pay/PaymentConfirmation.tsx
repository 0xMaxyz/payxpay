import React from "react";

interface PaymentConfirmationProps {
  amount: string;
  tokenName: string;
  onConfirm: () => void;
}

export const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  amount,
  tokenName,
  onConfirm,
}) => {
  return (
    <div>
      <p>
        Do you confirm the {amount} {tokenName.toUpperCase()} payment?
      </p>
      <button onClick={onConfirm}>Pay</button>
    </div>
  );
};
