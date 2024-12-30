"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { CURRENCIES } from "./consts";
import { Invoice, PreparedInlineMessage } from "./types";
import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { useNotification } from "./context/NotificationContext";
import { useTelegramContext } from "./context/TelegramContext";
import Image from "next/image";
import QrCode from "qrcode";
import { getShareableLink } from "@/lib/tools";

const CreateInvoicePage = () => {
  const { addNotification } = useNotification();
  const {
    userData: telegramUserData,
    WebApp: TgWebApp,
    cloudStorage,
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
    PreparedInlineMessage | undefined
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

  useEffect(() => {
    console.log("USE EFFECT - Prepped Message: ", preppedMsg);
    if (preppedMsg) {
      // savedMessage is received
      // window.Telegram.WebApp.shareMessage(preppedMsg.id, (state: boolean) =>
      //   console.log(state ? "Message shared." : "Error sharing the message")
      // );
      console.log("Prepped message id is", preppedMsg.id);
      console.log("Message shared.");
    }
  }, [preppedMsg]);

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

  const testShareMessage = () => {
    try {
      const testId = "cg06u6qnSR8KpfKG"; // Replace with a real ID
      console.log("Testing shareMessage with ID:", testId);
      if (window?.Telegram?.WebApp) {
        window.Telegram.WebApp.shareMessage(testId, (state: boolean) => {
          console.log(state ? "Message shared." : "Error sharing the message");
        });
      } else {
        console.error("Telegram WebApp is not available");
        addNotification({
          color: "error",
          message: "Telegram WebApp is not available",
        });
      }
    } catch (error) {
      console.error("Error during testShareMessage:", error);
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
          const prepMsg = (await resp.json()) as PreparedInlineMessage;
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
        <div>
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
        </div>
      </div>
      <dialog
        id="invoice-created-modal"
        className="modal w-full"
        onClose={clearPage}
      >
        <div className="modal-box tg-bg-secondary w-9/12 max-w-5xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <div className="flex flex-col items-center justify-center p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-20 h-20"
              viewBox="0 -960 960 960"
              fill="green"
            >
              <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
            </svg>
            <h3 className="font-bold text-lg tg-text">
              Invoice has been created successfully. You can share it.
            </h3>
            <Image
              className="mt-4 w-64 h-64"
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
          <div className="flex flex-row justify-between items-center pt-3 ps-8 pe-8">
            <button
              className="btn btn-primary me-2"
              onClick={handleCopyToClipboard}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="white"
                viewBox="0 0 24 24"
                stroke="currentColor"
                role="img"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="0.1"
                  className="svg-fill"
                  d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"
                ></path>
              </svg>
              Copy
            </button>
            {navigator.share !== undefined && (
              <button className="btn btn-primary me-2" onClick={handleShare}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 -960 960 960"
                  fill="white"
                >
                  <path d="M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T720-200q0-17-11.5-28.5T680-240q-17 0-28.5 11.5T640-200q0 17 11.5 28.5T680-160ZM200-440q17 0 28.5-11.5T240-480q0-17-11.5-28.5T200-520q-17 0-28.5 11.5T160-480q0 17 11.5 28.5T200-440Zm480-280q17 0 28.5-11.5T720-760q0-17-11.5-28.5T680-800q-17 0-28.5 11.5T640-760q0 17 11.5 28.5T680-720Zm0 520ZM200-480Zm480-280Z" />
                </svg>
                Share
              </button>
            )}
            <button className="btn btn-primary" onClick={handleTgShare}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 -960 960 960"
                fill="white"
              >
                <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
              </svg>
              Send to Telegram
            </button>
            <button className="btn btn-primary" onClick={testShareMessage}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 -960 960 960"
                fill="white"
              >
                <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
              </svg>
              TEST
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default CreateInvoicePage;
