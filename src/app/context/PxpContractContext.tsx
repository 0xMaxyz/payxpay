/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  useAbstraxionSigningClient,
  useAbstraxionAccount,
} from "@burnt-labs/abstraxion";
import {
  Block,
  Coin,
  DeliverTxResponse,
  IndexedTx,
  StdFee,
} from "@cosmjs/stargate";
import { CosmWasmClient, ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import React, { createContext, useContext } from "react";
import { queryIbcDenom } from "@/utils/tools";
import { MsgTransferEncodeObject } from "@cosmjs/stargate";

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
  getTransaction: (txHash: string) => Promise<IndexedTx | null>;
  getBlockTimestamp: (block: number) => Promise<{
    block: Block;
    timestamp: number;
  } | null>;
  getTransactionDetails: (txHash: string) => Promise<{
    tx: IndexedTx;
    block: Block;
    timestamp: number;
  } | null>;
  getMyBalances: () => Promise<(Coin | null)[]>;
  performIbcTransfer: (
    sourceChannel: string,
    coin: Coin,
    receiver: string,
    memo?: string
  ) => Promise<DeliverTxResponse | undefined>;
}

const PxpContractContext = createContext<PxpContractContextType | null>(null);
export const PxpContractProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { client } = useAbstraxionSigningClient();
  const { data: xionAccount } = useAbstraxionAccount();
  const TREASURY = process.env.NEXT_PUBLIC_TREASURY!;

  const pxpContract = process.env.NEXT_PUBLIC_CONTRACT!;
  const getTransaction = async (txHash: string) => {
    return (await client?.getTx(txHash)) ?? null;
  };
  const getTransactionDetails = async (txHash: string) => {
    const tx = await getTransaction(txHash);
    if (tx) {
      const b = await getBlockTimestamp(tx.height);
      if (b) {
        return {
          tx: tx,
          block: b.block,
          timestamp: b.timestamp,
        };
      } else {
        return null;
      }
    } else {
      return null;
    }
  };
  const getBlockTimestamp = async (block: number) => {
    const b = await client?.getBlock(block);
    if (b) {
      return { block: b, timestamp: new Date(b.header.time).getTime() };
    } else {
      return null;
    }
  };
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

  const performIbcTransfer = async (
    sourceChannel: string,
    coin: Coin,
    receiver: string,
    memo?: string
  ) => {
    // IBC transfer message
    const msgTransfer: MsgTransferEncodeObject = {
      typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
      value: {
        sourcePort: "transfer",
        sourceChannel: sourceChannel,
        token: coin,
        sender: xionAccount.bech32Address,
        receiver: receiver,
        timeoutTimestamp: BigInt(1000_000 * (Date.now() + 300_000)), // 5 minutes
      },
    };

    const fee: StdFee = {
      amount: [
        {
          denom: "uxion",
          amount: "10",
        },
      ],
      gas: "300000",
    };

    // Broadcast the transaction
    const result = await client?.signAndBroadcast(
      xionAccount.bech32Address,
      [msgTransfer],
      fee,
      memo
    );
    console.log("Transaction result:", result);
    return result;
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
  const getMyBalances = async () => {
    const denoms: string[] = [
      "uxion",
      "ibc/57097251ED81A232CE3C9D899E7C8096D6D87EF84BA203E12E424AA4C9B57A64",
    ];
    return await Promise.all(
      denoms.map((denom) => queryBankBalance(xionAccount.bech32Address, denom))
    );
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
        getTransaction,
        getBlockTimestamp,
        getTransactionDetails,
        getMyBalances,
        performIbcTransfer,
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
