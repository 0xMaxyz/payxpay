import { useState } from "react";
import { usePxpContract } from "../context/PxpContractContext";
import { useNotification } from "../context/NotificationContext";
import { useTelegramContext } from "../context/TelegramContext";
import { PaymentParams } from "@/types/payment";

export const usePayment = (paymentParams: PaymentParams) => {
  const { bankTransfer, createEscrow, myAddress } = usePxpContract();
  const { addNotification } = useNotification();
  const { userData: tgData, token: jwtToken } = useTelegramContext();
  const [paymentSteps, setPaymentSteps] = useState({
    transmitting: false,
    waitingConfirmation: false,
    done: false,
  });
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [txFailError, setTxFailError] = useState<string | null>(null);

  const handlePayment = async () => {
    let tHash = "";
    try {
      if (paymentParams.paymentType === "direct") {
        setPaymentSteps((prev) => ({ ...prev, transmitting: true }));
        const res = await bankTransfer(
          [
            {
              amount: paymentParams.token.amount,
              denom: paymentParams.token.denom,
            },
          ],
          paymentParams.invoice.address,
          "payxpay"
        );
        if (res && res.code === 0) {
          addNotification({
            color: "success",
            message: "Payment completed successfully",
          });
          setTxHash(res.transactionHash);
          setTxFailed(res.code !== 0);
          setTxFailError(res.rawLog ?? null);
          tHash = res.transactionHash;
          setPaymentSteps((prev) => ({
            ...prev,
            transmitting: false,
            waitingConfirmation: true,
          }));
        } else if (res && res.code !== 0) {
          setTxFailed(true);
          setTxFailError(`Payment failed, tx hash: ${res.transactionHash}`);
          throw new Error(`Payment failed, tx hash: ${res.transactionHash}`);
        }
      } else {
        setPaymentSteps((prev) => ({ ...prev, transmitting: true }));
        const escrowType = {
          invoice: {
            amount: {
              amount: paymentParams.invoice.amount.toString(),
              currency: paymentParams.invoice.unit,
            },
          },
        };
        const createMsg = {
          id: paymentParams.invoice.id,
          escrow_type: escrowType,
          recipient: paymentParams.invoice.address,
          recepient_email: "",
          recepient_telegram_id:
            paymentParams.invoice.issuerTelegramId.toString(),
          source_telegram_id: tgData?.id?.toString(),
          title: `Payment of ${paymentParams.invoice.amount} ${paymentParams.invoice.unit}`,
          description: paymentParams.invoice.description,
        };
        const balance = {
          cw20_balance: [],
          native_balance: [
            {
              amount: paymentParams.token.amount,
              denom: paymentParams.token.denom,
            },
          ],
        };
        const res = await createEscrow(createMsg, balance);
        if (
          res &&
          res.events
            .flatMap((event) => event.attributes)
            .some((x) => x.key === "action" && x.value === "create")
        ) {
          addNotification({
            color: "success",
            message: "Payment completed successfully",
          });
          setTxHash(res.transactionHash);
          tHash = res.transactionHash;
          setPaymentSteps((prev) => ({
            ...prev,
            transmitting: false,
            waitingConfirmation: true,
          }));
        } else if (res) {
          setTxFailed(true);
          setTxFailError(`Payment failed, tx hash: ${res.transactionHash}`);
          throw new Error(`Payment failed, tx hash: ${res.transactionHash}`);
        }
      }

      await finalizePayment(tHash);
      setPaymentSteps({
        transmitting: false,
        waitingConfirmation: false,
        done: true,
      });
    } catch (error) {
      setPaymentSteps({
        done: false,
        transmitting: false,
        waitingConfirmation: false,
      });
      addNotification({ color: "error", message: "Payment failed." });
      console.error("Payment failed.", error);
    }
  };

  const finalizePayment = async (hash: string) => {
    if (hash) {
      const res = await fetch("/api/invoice/payment", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          invoiceId: encodeURIComponent(paymentParams.invoice.id),
          txHash: encodeURIComponent(hash),
          paymentType: encodeURIComponent(paymentParams.paymentType),
          payerTgId: tgData?.id,
          payerAddress: myAddress,
        }),
        method: "POST",
      });
      if (!res.ok) {
        setTxFailed(true);
        setTxFailError(
          "Something wrong happened while updating the invoice, please contact the support with the txHash and invoice id."
        );
        throw new Error("Something wrong happened while updating the invoice.");
      }
    } else {
      setTxFailed(true);
      setTxFailError("No txHash found.");
      throw new Error("No txHash found.");
    }
  };

  const resetFailure = () => {
    setTxFailed(false);
    setTxFailError(null);
  };

  return {
    paymentSteps,
    txHash,
    handlePayment,
    txFailError,
    txFailed,
    resetFailure,
  };
};
