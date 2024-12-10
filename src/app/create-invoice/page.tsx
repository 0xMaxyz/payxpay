"use client";

import { useState } from "react";

const CreateInvoicePage = () => {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("TRY");
  const [token, setToken] = useState("USDC");
  const [chain, setChain] = useState("Injective");
  const [walletAddress, setWalletAddress] = useState("");

  const handleSubmit = () => {
    // Perform API call to create an invoice
    console.log({
      amount,
      currency,
      token,
      chain,
      walletAddress,
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Create Invoice</h1>

      <div className="form-control w-full mb-4">
        <label className="label">
          <span className="label-text">Amount</span>
        </label>
        <input
          type="text"
          placeholder="Enter the amount"
          className="input input-bordered w-full"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="form-control w-full mb-4">
        <label className="label">
          <span className="label-text">Currency</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="TRY">Turkish Lira (TRY)</option>
          <option value="USD">US Dollar (USD)</option>
          <option value="EUR">Euro (EUR)</option>
        </select>
      </div>

      <div className="form-control w-full mb-4">
        <label className="label">
          <span className="label-text">Payment Token</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        >
          <option value="USDC">USDC</option>
          <option value="DAI">DAI</option>
          <option value="ATOM">ATOM</option>
        </select>
      </div>

      <div className="form-control w-full mb-4">
        <label className="label">
          <span className="label-text">Destination Chain</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={chain}
          onChange={(e) => setChain(e.target.value)}
        >
          <option value="Injective">Injective</option>
          <option value="Osmosis">Osmosis</option>
          <option value="Juno">Juno</option>
        </select>
      </div>

      <div className="form-control w-full mb-4">
        <label className="label">
          <span className="label-text">Wallet Address</span>
        </label>
        <input
          type="text"
          placeholder="Enter the destination wallet address"
          className="input input-bordered w-full"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />
      </div>

      <button className="btn btn-primary w-full" onClick={handleSubmit}>
        Create Invoice
      </button>
    </div>
  );
};

export default CreateInvoicePage;
