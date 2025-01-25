"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { CURRENCIES } from "../consts";
import { Invoice } from "@/types";
import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { useNotification } from "../context/NotificationContext";
import { useTelegramContext } from "../context/TelegramContext";
import Image from "next/image";
import QrCode from "qrcode";
import { getShareableLink } from "@/utils/tools";
import * as Telegram from "@/types/telegram";

const CreateInvoicePage = () => {
  const { addNotification } = useNotification();
  const {
    userData: telegramUserData,
    WebApp: TgWebApp,
    cloudStorage,
    token: jwtToken,
  } = useTelegramContext();
  const [createInvoiceBtnLoading, setCreateInvoiceBtnLoading] = useState(false);
  const { data: account } = useAbstraxionAccount();
  const [createInvoiceEnabled, setCreateInvoiceEnabled] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>("");
  const [description, setDescription] = useState("");
  const [createdQrCode, setCreatedQrCode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [preppedMsg, setPreppedMsg] = useState<
    Telegram.PreparedInlineMessage | undefined
  >(undefined);
  const [shareableLink, setShareableLink] = useState<string | undefined>(
    undefined
  );
  const [tgShareLoading, setTgShareLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useModal();
  const changeAbstraxionModalState = () => setModalOpen(!isModalOpen);

  useEffect(() => {
    if (Number.parseInt(amount) > 0 && currency) {
      setCreateInvoiceEnabled(true);
    } else {
      setCreateInvoiceEnabled(false);
    }
  }, [amount, currency]);

  const MAX_DESCRIPTION_LENGTH = 200;
  const clearPage = () => {
    setAmount("");
    setCurrency("");
    setDescription("");
    setCreatedQrCode("");
    setShareableLink(undefined);
    setInvoiceId("");
    setPreppedMsg(undefined);
  };
  const handleDescriptionInput = (
    event: ChangeEvent<HTMLTextAreaElement>
  ): void => {
    const text = event.target.value;
    if (text.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(text);
    }
  };

  const showInvoiceSuccessfullModal = () => {
    const dialog = document.getElementById("invoice-created-modal");
    if (dialog) {
      (dialog as HTMLDialogElement).showModal();
    }
  };

  const handleCopyToClipboard = async () => {
    if (shareableLink) {
      await navigator.clipboard.writeText(shareableLink);
      addNotification({
        color: "success",
        message: "Invoice copied to clipboard",
      });
    }
  };
  const handleTgShare = async () => {
    if (preppedMsg) {
      window.Telegram.WebApp.shareMessage(preppedMsg.id, (state: boolean) =>
        console.log(state ? "Message shared." : "Error sharing the message")
      );
    } else if (!tgShareLoading) {
      setTgShareLoading(true);
      try {
        const resp = await fetch("/api/telegram/prepare-message", {
          body: JSON.stringify({ invoiceId }),
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        console.log("Response from prepare-message", resp);
        if (resp.ok) {
          const parsed = await resp.json();
          const prepMsg = JSON.parse(parsed) as Telegram.PreparedInlineMessage;
          window.Telegram.WebApp.shareMessage(prepMsg.id, (state: boolean) =>
            console.log(state ? "Message shared." : "Error sharing the message")
          );
          console.log("HandleTgShare - Prepared Message: ", prepMsg);
          setPreppedMsg(prepMsg);
        } else {
          console.error("Failed to prepare the message");
          throw new Error("Failed to prepare the message");
        }
      } catch (error) {
        console.error("Error in creating the telegram share message", error);
        addNotification({
          color: "error",
          message: "Can't create the share message",
        });
      } finally {
        setTgShareLoading(false);
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share !== undefined && shareableLink) {
      try {
        await navigator.share({
          title: "Invoice",
          url: shareableLink,
        });
        addNotification({
          color: "success",
          message: "Invoice shared successfully",
        });
      } catch (error) {
        console.error("Failed to share invoice:", error);
        addNotification({
          color: "error",
          message: "Failed to share invoice",
        });
      }
    }
  };

  const handleConnect = () => {
    if (!isConnecting) {
      setIsConnecting(true);
      changeAbstraxionModalState();
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
      if (!cloudStorage) {
        console.error("Cloud Storage is not available");
        addNotification({
          color: "error",
          message: "Cloud Storage is not available",
        });
        return;
      }
      // so the required inputs are filled, we can now create the invoice
      setCreateInvoiceBtnLoading(true);

      console.log("Creating invoice...");
      console.log("Time", Date.now() / 1000);
      const invoice: Invoice = {
        id: crypto.randomUUID(),
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
      try {
        const resp = await fetch(`/api/invoice/create`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            invoice: encodeURIComponent(JSON.stringify(invoice)),
            tgHash: encodeURIComponent(TgWebApp?.initData ?? ""),
          }),
          method: "POST",
        });
        if (resp.ok) {
          const data = await resp.json();
          const signedInvoice: string = data.signedInvoice;
          console.log("Signed Invoice: ", signedInvoice);
          // save to tg cloud storage
          cloudStorage?.saveInvoice(signedInvoice);
          // inform the user that the invoice has been created
          addNotification({
            color: "success",
            message: "Invoice created successfully",
          });
          // set the shareable link
          setShareableLink(getShareableLink(invoice.id));
          setInvoiceId(invoice.id);
          // create the qr code
          QrCode.toDataURL(
            getShareableLink(invoice.id),
            { errorCorrectionLevel: "H" },
            (err, url) => {
              if (err) {
                console.error("Failed to generate QR code:", err);
                addNotification({
                  color: "error",
                  message: "Failed to generate QR code",
                });
              } else {
                console.log("QR Code Data URL:", url);
                setCreatedQrCode(url);
              }
            }
          );
          showInvoiceSuccessfullModal();
        } else {
          addNotification({
            color: "error",
            message: "Failed to create invoice",
          });
        }
      } catch (error) {
        console.error("An error occurred while creating invoice:", error);
        addNotification({
          color: "error",
          message: "An error occurred while creating invoice",
        });
      }

      setCreateInvoiceBtnLoading(false);
    }
  };

  return (
    <>
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
            <option value="" disabled>
              Select a currency ...
            </option>
            {CURRENCIES.sort((a, b) => a.name.localeCompare(b.name)).map(
              (c) => {
                return (
                  <option key={c.contract}>
                    {c.name} - {c.unit}
                  </option>
                );
              }
            )}
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
            disabled={!createInvoiceEnabled}
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
        {/* <div>
          <button
            className="btn btn-primary w-full mt-2"
            onClick={async () => {
              if (cloudStorage) {
                await cloudStorage.saveInvoice(
                  `Invoice ${crypto.randomUUID()}`
                );
                console.log("Invoice added");
              }
            }}
          >
            Add Invoice
          </button>
          <button
            className="btn btn-secondary w-full mt-2"
            onClick={async () => {
              const invoiceId = 25;
              if (cloudStorage) {
                await cloudStorage.removeInvoice(invoiceId);
                console.log("Invoice removed:", invoiceId);
              }
            }}
          >
            Remove Invoice
          </button>
          <button
            className="btn btn-info w-full mt-2"
            onClick={async () => {
              const invoiceId = 1;
              if (cloudStorage) {
                const invoice = await cloudStorage.getInvoice(invoiceId);
                console.log("Fetched Invoice:", invoice);
              }
            }}
          >
            Get Invoice
          </button>
          <button
            className="btn btn-warning w-full mt-2"
            onClick={async () => {
              if (cloudStorage) {
                const invoices = await cloudStorage.getInvoices(1, 10);
                console.log("Fetched Invoices:", invoices);
              }
            }}
          >
            Get Invoices
          </button>
          <button
            className="btn btn-warning w-full mt-2"
            onClick={async () => {
              if (cloudStorage) {
                const isRemoved = await cloudStorage.removeAllInvoices();
                console.log("Removed All Invoices:", isRemoved);
              }
            }}
          >
            Remove All Invoices
          </button>
        </div> */}
      </div>
      <dialog
        id="invoice-created-modal"
        className="modal w-full"
        onClose={clearPage}
      >
        <div className="modal-box tg-bg-secondary w-11/12 max-w-5xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <div className="flex flex-col items-center justify-center p-4">
            <span
              className="material-symbols-outlined text-green-500"
              style={{ fontSize: "4rem", fontWeight: "bolder" }}
            >
              check
            </span>
            <h3 className="font-bold text-lg tg-text">
              Invoice has been created successfully. You can share it.
            </h3>
            <Image
              className="mt-4 w-64 h-64 object-cover aspect-square"
              src={
                createdQrCode === ""
                  ? "/assets/img/qr-placeholder.png"
                  : createdQrCode
              }
              alt="QR Code"
              width={200}
              height={200}
            ></Image>
          </div>
          <div className="flex flex-row justify-between items-center p-3">
            <button
              className="btn btn-primary btn-sm text-white"
              onClick={handleCopyToClipboard}
            >
              <span className="material-symbols-outlined">content_copy</span>
              Copy
            </button>
            {navigator.share !== undefined && (
              <button
                className="btn btn-primary btn-sm text-white"
                onClick={handleShare}
              >
                <span className="material-symbols-outlined">share</span>
                Share
              </button>
            )}
            <button
              className="btn btn-primary btn-sm text-white"
              onClick={handleTgShare}
            >
              <span className="material-symbols-outlined">send</span>
              Telegram
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default CreateInvoicePage;
