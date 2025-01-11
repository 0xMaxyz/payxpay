import type { ExecuteResult } from "@cosmjs/cosmwasm-stargate";

export type EnvironmentType = "production" | "development";
export interface TgUserData {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  language_code: string;
  allows_write_to_pm: boolean;
  photo_url: string;
  [key: string]: unknown;
}
export type ExecuteResultOrUndefined = ExecuteResult | undefined;

export interface Invoice {
  // The id of the invoice
  id: string;
  // The description of the invoice
  description: string;
  // The telegram id of the issuer
  issuerTelegramId: number;
  // The first name of the issuer
  issuerFirstName: string;
  // The last name of the issuer
  issuerLastName: string | null;
  // The telegram handle of the issuer
  issuerTelegramHandle: string | null;
  // The date when the invoice was created
  issueDate: number;
  // The validity of the invoice in seconds
  invoiceValidity: number | "valid";
  // optional Id for the product or the service that the seller is creating the invoice
  issuerPrivateId: string | null;
  // The amount of the invoice
  amount: number;
  // The currency of the invoice
  unit: string;
  // The address of the seller
  address: string;
}
export interface SignedInvoice extends Invoice {
  signature: string;
  // // The auth hash of the user which shows that the user is the owner of the invoice
  // tgHash: string;
}

export interface Currency {
  name: string;
  unit: string;
  contract: string;
}

export interface TelegramUpdate {
  update_id: number;
  message: TelegramMessage;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number; // Unix timestamp
  text: string;
  entities?: TelegramEntity[]; // Optional because it might not always exist
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string; // Optional because `last_name` may not always be present
  username?: string; // Optional because `username` may not always be present
  language_code?: string; // Optional because `language_code` may not always be present
}

export interface TelegramChat {
  id: number;
  first_name?: string; // Optional because group chats may not have `first_name`
  last_name?: string; // Optional because group chats may not have `last_name`
  username?: string; // Optional because group chats may not have `username`
  type: "private" | "group" | "supergroup" | "channel";
}

export interface TelegramEntity {
  offset: number;
  length: number;
  type:
    | "mention"
    | "hashtag"
    | "cashtag"
    | "bot_command"
    | "url"
    | "email"
    | "phone_number"
    | "bold"
    | "italic"
    | "underline"
    | "strikethrough"
    | "code"
    | "pre"
    | "text_link"
    | "text_mention";
}

export interface InlineQueryResultArticle {
  type: "article";
  id: string; //1-64 Bytes
  title: string;
  input_message_content: InputMessageContent;
  description?: string;
  url?: string;
  hide_url?: boolean;
}

export interface InputMessageContent {
  message_text: string;
  parse_mode?: "HTML" | "MarkdownV2";
  entities?: TelegramEntity[];
  link_preview_options?: LinkPreviewOptions;
}

export interface LinkPreviewOptions {
  is_disabled?: boolean;
  url?: string;
  prefer_small_media?: boolean;
  prefer_large_media?: boolean;
  show_above_text?: boolean;
}

export interface savePreparedInlineMessage {
  user_id: number;
  result: InlineQueryResultArticle;
  allow_user_chats?: boolean;
  allow_bot_chats?: boolean;
  allow_group_chats?: boolean;
  allow_channel_chats?: boolean;
}

export interface PreparedInlineMessage {
  id: string;
  expiration_date: number;
}
