import type { ExecuteResult } from "@cosmjs/cosmwasm-stargate";

export type EnvironmentType = "production" | "development";
export interface TgUserData {
  allows_write_to_pm: null;
  first_name: string;
  id: number;
  language_code: string;
  last_name: string | null;
  photo_url: string;
  username: string;
}
export type ExecuteResultOrUndefined = ExecuteResult | undefined;
