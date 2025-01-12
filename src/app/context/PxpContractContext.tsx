/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  useAbstraxionSigningClient,
  useAbstraxionAccount,
} from "@burnt-labs/abstraxion";
import { Coin, DeliverTxResponse } from "@cosmjs/stargate";
import { CosmWasmClient, ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import React, { createContext, useContext } from "react";
import { env } from "process";
import { queryIbcDenom } from "@/utils/tools";

type ExecuteCreateMsg = {
  create: CreateMsg;
};

interface Cw20SendMsg {
  send: { contract: string; amount: string; msg: string };
}

export interface InvoiceAmount {
  amount: string;
  currency: string;
}
type QueryBalanceResponse = Cw20TokenBalanceResponse & Cw20TokenInfoResponse;
export type EscrowType =
  | { invoice: { amount: InvoiceAmount } }
  | { blind_transfer: { transfer: "Email" | "Telegram" } };
export interface CreateMsg {
  id: string;
  escrow_type: EscrowType;
  recipient?: string;
  recepient_email?: string;
  recepient_telegram_id?: string;
  source_telegram_id?: string;
  title: string;
  description: string;
  end_height?: number; // u64
  end_time?: number; // u64
  cw20_whitelist?: string[];
}
type QueryMsg =
  | { type: "listAll" }
  | { type: "details"; id: string }
  | { type: "blindTransfers"; transfer_type: "Email" | "Telegram" };

export interface Balance {
  native_balance: Coin[];
  cw20_balance: Cw20Coin[];
}
type BlindTransfersResponse = Balance;
interface ListResponse {
  escrows: string[];
}
interface Cw20Coin {
  address: string;
  amount: string; // Uint128
}

interface DetailsResponse {
  escrow_type: EscrowType;
  id: string;
  recipient?: string;
  recepient_email?: string;
  recepient_telegram_id?: string;
  source: string;
  source_telegram_id?: string;
  title: string;
  description: string;
  end_height?: number; // u64
  end_time?: number; // u64
  native_balance: Coin[];
  cw20_balance: Cw20Coin[];
  cw20_whitelist: string[];
}
interface Cw20TokenInfoResponse {
  name: string;
  symbol: string;
  decimals: number; // u8
  total_supply: string; // Uint128
}
interface Cw20TokenBalanceResponse {
  balance: string;
}
interface PxpContractContextType {
  createEscrow: (
    msg: CreateMsg,
    balance: Balance
  ) => Promise<ExecuteResult | undefined>;
  queryCw20Balance: (
    tokenAddress: string,
    accountAddress: string
  ) => Promise<QueryBalanceResponse | null>;
  queryBankBalance: (address: string, denom: string) => Promise<Coin | null>;
  xionClient: CosmWasmClient | undefined;
  bankTransfer: (
    amount: Coin[],
    recipientAddress: string,
    memo?: string
  ) => Promise<DeliverTxResponse | undefined>;
  myAddress: string;
}

const PxpContractContext = createContext<PxpContractContextType | null>(null);
export const PxpContractProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { client } = useAbstraxionSigningClient();
  const { data: xionAccount } = useAbstraxionAccount();
  const TREASURY = process.env.NEXT_PUBLIC_TREASURY!;

  const pxpContract = process.env.NEXT_PUBLIC_CONTRACT!;
  const createEscrow = async (
    msg: CreateMsg,
    balance: Balance
  ): Promise<ExecuteResult | undefined> => {
    let isNative: boolean;
    // check if a token is attached
    if (
      balance.native_balance.length == 0 &&
      balance.cw20_balance.length == 0
    ) {
      throw new Error("No token is sent");
    }
    // check if attached balance is cw20 or nativeCoin
    if (balance.native_balance.length > 0 && balance.cw20_balance.length == 0) {
      isNative = true;
      // then native coins attached
      // check the balance of the received tokens
      let enoughBalance: boolean = true;
      balance.native_balance.forEach(async (token) => {
        const receivedBalance = await queryBankBalance(
          xionAccount.bech32Address,
          token.denom
        );
        if (!receivedBalance) {
          // nothing returned from the function
          enoughBalance = false;
        } else {
          enoughBalance =
            enoughBalance &&
            BigInt(receivedBalance.amount) >= BigInt(token.amount);
        }
      });
      if (!enoughBalance) {
        throw new Error("Top up your account, you don't have enough tokens");
      }
    } else if (
      balance.cw20_balance.length > 0 &&
      balance.native_balance.length == 0
    ) {
      // then cw20 coins attached
      isNative = false;
      let enoughBalance: boolean = true;
      balance.cw20_balance.forEach(async (token) => {
        const res = await queryCw20Balance(token.address);
        if (!res) {
          throw new Error("Can't query token balance");
        }
        enoughBalance =
          enoughBalance && BigInt(res.balance) >= BigInt(token.amount);
      });
      if (!enoughBalance) {
        throw new Error("Top up your account, you don't have enough tokens");
      }
    } else {
      throw new Error(
        "You can either escrow native tokens or cw20 tokens at the moment."
      );
    }
    // at this point we know some tokens are sent (cw20 or bank trokens), we're not going to check the create escrow msg (we assume it is correct)
    // TODO: the way we handle the cw20 or native token differs
    if (isNative) {
      // create an escrow by sending CreateMsg
      const exMsg: ExecuteCreateMsg = { create: msg };

      const res = await client?.execute(
        xionAccount.bech32Address,
        pxpContract,
        exMsg,
        {
          amount: [{ amount: "1", denom: "uxion" }],
          gas: "300000",
          granter: TREASURY,
        },
        "",
        balance.native_balance
      );

      return res;
    } else {
      // create an escrow by sending Receive msg(createMsg will be encoded inside CreateMsg)
      if (balance.cw20_balance.length == 1) {
        // only one token is sent to be escrowed
        const token = balance.cw20_balance[0];
        const innerMsg: ExecuteCreateMsg = { create: msg };
        const exMsg: Cw20SendMsg = {
          send: {
            contract: pxpContract, // send to pxpcontract
            amount: token.amount,
            msg: btoa(JSON.stringify(innerMsg)),
          },
        };
        const res = await client?.execute(
          xionAccount.bech32Address,
          token.address,
          exMsg,
          {
            amount: [{ amount: "1", denom: "uxion" }],
            gas: "500000",
            granter: TREASURY,
          }
        );
        return res;
      } else if (balance.cw20_balance.length > 1) {
        // TODO: then escrow first and top up the first escrow
      }
    }
  };

  const bankTransfer = async (
    amount: Coin[],
    recipientAddress: string,
    memo?: string
  ) => {
    const res = client?.sendTokens(
      xionAccount.bech32Address,
      recipientAddress,
      amount,
      {
        amount: [{ amount: "1", denom: "uxion" }],
        gas: "500000",
        granter: TREASURY,
      },
      memo
    );
    return res;
  };

  const queryCw20Balance = async (
    tokenAddress: string,
    accountAddress: string = xionAccount.bech32Address
  ): Promise<QueryBalanceResponse | null> => {
    const readBalanceMsg = {
      balance: {
        address: accountAddress,
      },
    };
    const tokenInfoMsg = {
      token_info: {},
    };
    const tokenInfoRes: Cw20TokenInfoResponse =
      await client?.queryContractSmart(tokenAddress, tokenInfoMsg);
    if (tokenInfoRes) {
      const balanceRes: Cw20TokenBalanceResponse =
        await client?.queryContractSmart(tokenAddress, readBalanceMsg);
      if (balanceRes) {
        return { ...balanceRes, ...tokenInfoRes };
      }
    }
    return null;
  };
  const queryBankBalance = async (
    address: string,
    denom: string = "uxion"
  ): Promise<Coin | null> => {
    const res = await client?.getBalance(address, denom);
    if (res) {
      // if the query is for ibc token, then get the base denom and return the amount with base amount
      if (denom.startsWith("ibc")) {
        const ibcHash = denom.split("ibc/")[1];
        const baseDenom = await queryIbcDenom(ibcHash);
        return {
          amount: res.amount,
          denom: baseDenom.denom_trace.base_denom.toUpperCase(),
        };
      }
      return res;
    } else {
      throw new Error("Can't read the token balance");
    }
  };
  return (
    <PxpContractContext.Provider
      value={{
        createEscrow,
        xionClient: client,
        queryCw20Balance,
        queryBankBalance,
        bankTransfer,
        myAddress: xionAccount.bech32Address,
      }}
    >
      {children}
    </PxpContractContext.Provider>
  );
};
export const usePxpContract = () => {
  const context = useContext(PxpContractContext);
  if (!context) {
    throw new Error(
      "usePxpContract should be used within a PxpContractProvider"
    );
  }
  return context;
};
