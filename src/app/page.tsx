"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Image from "next/image";
import { CURRENCIES } from "./consts";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion";

const CreateInvoicePage = () => {
  const { data: account } = useAbstraxionAccount();
  const { logout } = useAbstraxionSigningClient();
  useEffect(() => {
    if (account.bech32Address) {
      setWalletAddress(account.bech32Address);
    } else {
      setWalletAddress("");
    }
  }, [account.bech32Address]);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>("");
  const [description, setDescription] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const MAX_DESCRIPTION_LENGTH = 200;
  const handleDescriptionInput = (
    event: ChangeEvent<HTMLTextAreaElement>
  ): void => {
    const text = event.target.value;
    if (text.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(text);
    }
  };

  const handleAmountInput = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = () => {
    // Perform API call to create an invoice
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
          className="input input-bordered input-sm w-full"
          value={amount}
          onChange={handleAmountInput}
        />
      </label>
      <label className="form-control w-full ">
        <div className="label">
          <span className="label-text">Currency</span>
        </div>
        <select
          className="select select-bordered"
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
          className="textarea textarea-bordered textarea-sm h-24 max-h-48 min-h-20"
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

      <p>{walletAddress}</p>
      <button className="btn btn-primary" onClick={async () => logout?.()}>
        Dis
      </button>
      <button
        className="btn btn-primary w-full"
        disabled={amount ? (Number.parseInt(amount) <= 0 ? true : false) : true}
        onClick={handleSubmit}
      >
        Create Invoice
      </button>
      <video
        className="fire-video test mb-24 h-24 w-24"
        muted
        loop
        autoPlay
        playsInline
      >
        <source src="/assets/vid/fire.mp4" type="video/mp4" />
      </video>
      <Image
        className="rounded-full fire-video mb-24 ms-24"
        height="50"
        width="50"
        alt="xion"
        src="/assets/img/flame.jpg"
      />
      <>
        <div className="mask-diamond"></div>
      </>
    </div>
  );
};

export default CreateInvoicePage;
