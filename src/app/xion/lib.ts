import { env } from "process";
import {
  AccountData,
  Coin,
  DirectSecp256k1Wallet,
} from "@cosmjs/proto-signing";
import {
  CosmWasmClient,
  IndexedTx,
  JsonObject,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import { StdFee } from "@cosmjs/amino";

const privateKeyHex = env.ARBITER_PK!;
const nodeRpc = env.NEXT_PUBLIC_XION_RPC!;

const getWallet = async (): Promise<DirectSecp256k1Wallet> => {
  const wallet = await DirectSecp256k1Wallet.fromKey(
    Buffer.from(privateKeyHex, "hex"),
    "xion"
  );
  return wallet;
};

export const getClient = async (): Promise<CosmWasmClient> => {
  const client: CosmWasmClient = await CosmWasmClient.connect(nodeRpc);
  return client;
};

const getSigner = async (
  wallet: DirectSecp256k1Wallet
): Promise<SigningCosmWasmClient> => {
  const signingClient = await SigningCosmWasmClient.connectWithSigner(
    nodeRpc,
    wallet
  );
  return signingClient;
};

export const executeTx = async (
  contractAddress: string,
  msg: JsonObject,
  fee: StdFee | "auto" | number,
  memo?: string,
  funds?: Coin[]
) => {
  const wallet = await getWallet();
  const accountData: readonly AccountData[] = await wallet.getAccounts();
  const signer = await getSigner(wallet);

  const res = await signer.execute(
    accountData[0].address,
    contractAddress,
    msg,
    fee,
    memo,
    funds
  );
  return res;
};

/**
 * Check if a user received a specific amount of a token in a transaction.
 * @param transaction The transaction object.
 * @param recipientAddress The recipient's address.
 * @param denom The expected token denomination.
 * @returns True if the recipient received the specified amount of the token, otherwise false.
 */
export function didUserReceiveToken(
  transaction: IndexedTx,
  recipientAddress: string,
  denom: string = "ibc/57097251ED81A232CE3C9D899E7C8096D6D87EF84BA203E12E424AA4C9B57A64"
): { found: boolean; amount: string | null } {
  for (const event of transaction.events) {
    if (event.type === "transfer") {
      let recipient: string | undefined;
      let transferAmount: string | undefined;

      for (const attr of event.attributes) {
        if (attr.key === "recipient") {
          recipient = attr.value;
        } else if (attr.key === "amount") {
          transferAmount = attr.value;
        }
      }

      if (recipient === recipientAddress && transferAmount) {
        // Split the amount string into individual tokens (e.g., "1000ibc/...")
        const tokens = transferAmount.split(",");
        // Check if any token matches the expected amount and denomination
        for (const token of tokens) {
          // match the token using regex (index 1: amount, index 2: denom)
          const match = token.match(/^(\d+)(.*)$/);

          if (match && match[2] === denom) {
            return { found: true, amount: match[1] };
          }
        }
      }
    }
  }

  return { found: false, amount: null };
}

export const getTransactionDetails = async (txHash: string) => {
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

export const getBlockTimestamp = async (block: number) => {
  const client = await getClient();

  const b = await client.getBlock(block);
  if (b) {
    return { block: b, timestamp: new Date(b.header.time).getTime() };
  } else {
    return null;
  }
};

export const getTransaction = async (txHash: string) => {
  const client = await getClient();

  return (await client.getTx(txHash)) ?? null;
};
