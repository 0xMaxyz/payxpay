import React, { useState, useEffect, useRef } from "react";
import { useNotification } from "../context/NotificationContext";
import {
  Balance,
  CreateMsg,
  EscrowType,
  usePxpContract,
} from "../context/PxpContractContext";
import { useTelegramContext } from "../context/TelegramContext";
import { Coin } from "@cosmjs/stargate";
import Decimal from "decimal.js";
import { SignedInvoice } from "../types";

export interface NamedCoin extends Coin {
  name: string;
}

export interface PaymentParams {
  amount: Decimal;
  token: NamedCoin;
  invoice: SignedInvoice;
  paymentType: "direct" | "escrow";
}

interface PaymentDialogProps {
  paymentParams: PaymentParams;
  onClose?: () => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  paymentParams,
  onClose,
}) => {
  const {
    token: jwtToken,
    userData: tgData,
    mainButton,
    WebApp: tgWebApp,
  } = useTelegramContext();
  const { queryBankBalance, myAddress, bankTransfer, createEscrow } =
    usePxpContract();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<Decimal | null>(null);
  const [isBalanceSufficient, setIsBalanceSufficient] = useState(false);
  const [paymentSteps, setPaymentSteps] = useState({
    transmitting: false,
    waitingConfirmation: false,
    done: false,
  });
  const [txHash, setTxHash] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // disable main button, as soon as the dialog is shown, we don't want to show the proceed to payment button
  useEffect(() => {
    mainButton?.disableMainButton();
  }, [mainButton]);

  useEffect(() => {
    const queryBalance = async (token: NamedCoin) => {
      try {
        const balance = await queryBankBalance(myAddress, token.denom);
        console.log(`Balance of ${token.denom} is:`, balance);
        return balance;
      } catch (error) {
        addNotification({ color: "error", message: "Can't query balance." });
        console.error("Can't query balance.", error);
      }
    };
    const checkBalance = async () => {
      try {
        const fetchedBalance = await queryBalance(paymentParams.token);
        if (fetchedBalance) {
          const balance = new Decimal(fetchedBalance.amount);
          setBalance(balance);
          setIsBalanceSufficient(
            balance.minus(paymentParams.amount).greaterThanOrEqualTo(0)
          );
        } else {
          throw new Error("Can't query the token balance");
        }
      } catch (error) {
        addNotification({
          color: "error",
          message: "Failed to fetch balance.",
        });
        console.error("Failed to fetch balance.", error);
      } finally {
        setLoading(false);
      }
    };

    checkBalance();
  }, [
    paymentParams.token,
    paymentParams.amount,
    addNotification,
    queryBankBalance,
    myAddress,
  ]);
  useEffect(() => {
    dialogRef?.current?.showModal();
  }, []);

  const showConfirmation = () => {
    const handleConfirmationDialog = (id: string) => {
      if (id === "1") {
        // close confirmation dialog
        handlePayment();
      }
    };
    tgWebApp?.showPopup(
      {
        message: ` Do you confirm the ${paymentParams.amount
          .toDecimalPlaces(2)
          .toString()} ${paymentParams.token.name.toLocaleUpperCase()} payment?`,
        title: "Confirm Payment",
        buttons: [
          { type: "cancel" },
          { type: "default", id: "1", text: "Pay" },
        ],
      },
      handleConfirmationDialog
    );
  };

  const handlePayment = async () => {
    try {
      if (paymentParams.paymentType === "direct") {
        // change payment step
        setPaymentSteps((prev) => ({
          ...prev,
          preparing: false,
          transmitting: true,
        }));
        // transfer to the address of the invoice issuer
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
          console.log("Received result is: ", res);
          // set tx hash
          setTxHash(res.transactionHash);
          // change payment step
          setPaymentSteps((prev) => ({
            ...prev,
            transmitting: false,
            waitingConfirmation: true,
          }));
        } else if (res && res.code !== 0) {
          throw new Error(`Payment failed, tx hash: ${res.transactionHash}`);
        }
      } else {
        // create a escrow
        // change payment step
        setPaymentSteps((prev) => ({
          ...prev,
          preparing: false,
          transmitting: true,
        }));
        // transfer to the address of the invoice issuer
        const escrowType: EscrowType = {
          invoice: {
            amount: {
              amount: paymentParams.invoice.amount.toString(),
              currency: paymentParams.invoice.unit,
            },
          },
        };
        const createMsg: CreateMsg = {
          id: paymentParams.invoice.id,
          escrow_type: escrowType,
          recipient: paymentParams.invoice.address, // address of the invoice issuer
          recepient_email: "",
          recepient_telegram_id:
            paymentParams.invoice.issuerTelegramId.toString(),
          source_telegram_id: tgData?.id?.toString(),
          title: `Payment of ${paymentParams.invoice.amount} ${paymentParams.invoice.unit}`,
          description: paymentParams.invoice.description,
        };
        const balance: Balance = {
          cw20_balance: [],
          native_balance: [
            {
              amount: paymentParams.token.amount,
              denom: paymentParams.token.denom,
            },
          ],
        };
        const res = await createEscrow(createMsg, balance);
        console.log("Received result is: ", res);
        //
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
          // set tx hash
          setTxHash(res.transactionHash);
          // change payment step
          setPaymentSteps((prev) => ({
            ...prev,
            transmitting: false,
            waitingConfirmation: true,
          }));
        } else if (res) {
          throw new Error(`Payment failed, tx hash: ${res.transactionHash}`);
        }
      }

      // at this point the transfer is done, either we paid directly or with escrow
      // Call the API endpoint to finalize the payment

      await finalizePayment();
      // set payment step as done
      setPaymentSteps((prev) => ({
        ...prev,
        waitingConfirmation: false,
        done: true,
      }));
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

  const finalizePayment = async () => {
    console.log("Finalize payment is called with tx hash of: ", txHash);
    if (txHash) {
      const res = await fetch("/api/invoice/payment", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          invoiceId: encodeURIComponent(paymentParams.invoice.id),
          txHash: encodeURIComponent(txHash),
          paymentType: encodeURIComponent(paymentParams.paymentType),
          payerTgId: tgData?.id,
          payerAddress: myAddress,
        }),
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Something wrong happened while updating the invoice.");
      }
    } else {
      throw new Error("No txHash found.");
    }
  };
  const handleDialogClose = async (event: React.FormEvent) => {
    if (paymentSteps.transmitting || paymentSteps.waitingConfirmation) {
      event.preventDefault(); // Prevent the dialog from closing
      const confirmClose = window.confirm(
        "Payment is in process. By closing the the payment dialog, you may loose the paid balance. Do you want to proceed?"
      );
      if (confirmClose) {
        onClose?.(); // invoke the provided onClose (if any)
        dialogRef.current?.close();
      }
    }
  };

  return (
    <>
      <dialog
        ref={dialogRef}
        id="payment-modal"
        className="modal w-full max-w-md mx-auto"
        onCancel={handleDialogClose}
        onClose={handleDialogClose}
      >
        <div className="modal-box tg-bg-secondary">
          {paymentSteps.done ||
            (!paymentSteps.transmitting &&
              !paymentSteps.waitingConfirmation && (
                <form method="dialog">
                  <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                    ✕
                  </button>
                </form>
              ))}

          <h1 className="text-2xl font-bold text-center tg-text">Payment</h1>
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : isBalanceSufficient ? (
            <div>
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
                          className={` ml-2 ${
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
                      onClick={showConfirmation}
                      disabled={balance?.lessThan(paymentParams.token.amount)}
                    >
                      Pay
                      {` ${paymentParams.amount
                        .toDecimalPlaces(2)
                        .toString()} ${paymentParams.token.name.toLocaleUpperCase()}`}
                    </button>
                    {/* <p className="tg-text text-xs mt-2">
                    <strong>Transaction Fee:</strong> 1 uxion
                  </p> */}
                    <p className="tg-text text-xs">
                      <strong>Service Fee:</strong> 0 uxion
                    </p>
                  </>
                )}

              <div className="m-3 p-3 shadow-2xl w-full">
                {paymentSteps.transmitting && (
                  <p className="tg-text">
                    Transmitting transaction
                    <span className="loading loading-dots loading-xs"></span>
                  </p>
                )}

                {paymentSteps.waitingConfirmation && (
                  <p className="tg-text ">
                    Waiting for confirmation
                    <span className="loading loading-dots loading-xs"></span>
                  </p>
                )}
                {paymentSteps.done && (
                  <div className="mt-4 text-center">
                    <div className="text-green-500 text-8xl">✔</div>
                    <p className="mt-2">
                      Payment of{" "}
                      {paymentParams.amount.toDecimalPlaces(2).toString()}{" "}
                      {paymentParams.token.name.toUpperCase()} completed.
                    </p>
                    <p className="overflow-hidden whitespace-nowrap text-ellipsis">
                      Transaction Hash:{" "}
                      <span
                        className="text-blue-500 underline cursor-pointer"
                        onClick={async () => {
                          await navigator.clipboard.writeText(txHash || "");
                          addNotification({
                            color: "success",
                            message: "Tx hash copied to clipboard.",
                          });
                        }}
                      >
                        {txHash}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-red-500">
              Insufficient balance for payment.
            </p>
          )}
          {/* <div className="modal-action">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div> */}
        </div>
      </dialog>
    </>
  );
};

export default PaymentDialog;
