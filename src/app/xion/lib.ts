import { env } from "process";
import {
  AccountData,
  Coin,
  DirectSecp256k1Wallet,
} from "@cosmjs/proto-signing";
import {
  CosmWasmClient,
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
