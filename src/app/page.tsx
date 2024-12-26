"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { CURRENCIES } from "./consts";
import { Invoice } from "./types";
import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { useNotification } from "./context/NotificationContext";
import { useTelegramContext } from "./hooks/useTelegramContext";
// import { useAbstraxionAccount } from "@burnt-labs/abstraxion";

const CreateInvoicePage = () => {
  // const { data: account } = useAbstraxionAccount();
  const { addNotification } = useNotification();
  const { userData: telegramUserData } = useTelegramContext();
  const [createInvoiceBtnLoading, setCreateInvoiceBtnLoading] = useState(false);
  const { data: account } = useAbstraxionAccount();
  const [createInvoiceEnabled, setCreateInvoiceEnabled] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isModalOpen, setModalOpen] = useModal();
  const changeModalState = () => setModalOpen(!isModalOpen);
  useEffect(() => {
    if (Number.parseInt(amount) > 0 && currency) {
      setCreateInvoiceEnabled(true);
    } else {
      setCreateInvoiceEnabled(false);
    }
  }, [amount, currency]);

  const MAX_DESCRIPTION_LENGTH = 200;
  const handleDescriptionInput = (
    event: ChangeEvent<HTMLTextAreaElement>
  ): void => {
    const text = event.target.value;
    if (text.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(text);
    }
  };

  const [isConnecting, setIsConnecting] = useState(false);
  const handleConnect = () => {
    if (!isConnecting) {
      setIsConnecting(true);
      changeModalState();
    }
  };

  const handleAmountInput = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmitInvoice = async () => {
    if (!createInvoiceBtnLoading) {
      if (!account?.bech32Address) {
        addNotification({
          color: "error",
          message: "Please connect your wallet first.",
          children: (
            <button
              className="btn btn-success btn-xs"
              onClick={() => setModalOpen(true)}
            >
              Connect
            </button>
          ),
        });
        return;
      }
      // so the required inputs are filled, we can now create the invoice
      setCreateInvoiceBtnLoading(true);
      console.log("Creating invoice...");
      const invoice: Invoice = {
        id: "",
        description: description,
        issuerTelegramId: telegramUserData?.id ?? 0,
        issuerFirstName: telegramUserData?.first_name ?? "",
        issuerLastName: telegramUserData?.last_name ?? "",
        issuerTelegramHandle: telegramUserData?.username ?? "",
        issueDate: Date.now() / 1000,
        invoiceValidity: "valid",
        issuerPrivateId: "",
        amount: Number.parseInt(amount),
        unit: currency,
        address: account.bech32Address,
      };
      console.log(`invoice is: \n${JSON.stringify(invoice)}`);

      const resp = await fetch(
        `/api/invoice/sign?invoice=${encodeURIComponent(
          JSON.stringify(invoice)
        )}`,
        { method: "POST" }
      );
      if (resp.ok) {
        const data = await resp.json();
        const signedInvoice: string = data.signedInvoice;
        console.log("Signed Invoice: ", signedInvoice);
        // now we have a signed invoice, we can use it to create a payment link or QR code and we also need to save it in the database (or someplace else). for now I'm going to use Telegram's cloud storage to save the invoice.
      }
      setCreateInvoiceBtnLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Create Invoice</h1>

      <label className="form-control w-full mb-2">
        <div className="label">
          <span className="label-text">Amount</span>
        </div>
        <input
          type="text"
          placeholder="Enter the amount"
          className="input input-bordered input-sm w-full tg-input"
          value={amount}
          onChange={handleAmountInput}
        />
      </label>
      <label className="form-control w-full ">
        <div className="label">
          <span className="label-text">Currency</span>
        </div>
        <select
          className="select select-bordered tg-input"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {CURRENCIES.sort((a, b) => a.name.localeCompare(b.name)).map((c) => {
            return (
              <option key={c.contract}>
                {c.name} - {c.unit}
              </option>
            );
          })}
        </select>
        {/* <div className="label">
          <span className="label-text-alt"></span>
          <span className="label-text-alt">{currency}</span>
        </div> */}
      </label>
      <label className="form-control">
        <div className="label">
          <span className="label-text">Description</span>
        </div>
        <textarea
          className="textarea textarea-bordered textarea-sm h-24 max-h-48 min-h-20 tg-input"
          placeholder="Description"
          value={description}
          onChange={handleDescriptionInput}
        ></textarea>
        <div className="label">
          <span className="label-text-alt"></span>
          <span className="label-text-alt text-success">
            {description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
      </label>
      {account?.bech32Address ? (
        <button
          className="btn btn-success w-full"
          disabled={createInvoiceEnabled}
          onClick={handleSubmitInvoice}
        >
          {!createInvoiceBtnLoading ? (
            <p className="text-white">Create Invoice</p>
          ) : (
            <span className="loading loading-dots loading-lg text-white"></span>
          )}
        </button>
      ) : (
        <button
          className="btn btn-success w-full"
          onClick={() => handleConnect()}
        >
          {!isConnecting ? (
            "Connect"
          ) : (
            <span className="loading loading-dots loading-lg text-white"></span>
          )}
        </button>
      )}
      <button
        className="btn btn-secondary w-full mt-2"
        onClick={() => {
          addNotification({
            message: "1",
            color: "warning",
            duration: 500000,
          });
        }}
      >
        Add toast
      </button>
    </div>
  );
};

export default CreateInvoicePage;
