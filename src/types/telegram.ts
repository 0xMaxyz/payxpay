/** This object represents an incoming update.
At most one of the optional parameters can be present in any given update. */
export interface Update {
  update_id: number;
  message: TelegramMessage;
}

export interface Entity {
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
  entities?: Entity[];
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

export interface MessageEntity {
  /**
   * Type of the entity. Currently, can be “mention” (@username), “hashtag” (#hashtag or #hashtag@chatusername),
   * “cashtag” ($USD or $USD@chatusername), “bot_command” (/start@jobs_bot), “url” (https://telegram.org),
   * “email” (do-not-reply@telegram.org), “phone_number” (+1-212-555-0123), “bold” (bold text),
   * “italic” (italic text), “underline” (underlined text), “strikethrough” (strikethrough text),
   * “spoiler” (spoiler message), “blockquote” (block quotation), “expandable_blockquote” (collapsed-by-default block quotation),
   * “code” (monowidth string), “pre” (monowidth block), “text_link” (for clickable text URLs),
   * “text_mention” (for users without usernames), “custom_emoji” (for inline custom emoji stickers).
   */
  type: string;

  /**
   * Offset in UTF-16 code units to the start of the entity.
   */
  offset: number;

  /**
   * Length of the entity in UTF-16 code units.
   */
  length: number;

  /**
   * Optional. For “text_link” only, URL that will be opened after user taps on the text.
   */
  url?: string;

  /**
   * Optional. For “text_mention” only, the mentioned user.
   */
  user?: User;

  /**
   * Optional. For “pre” only, the programming language of the entity text.
   */
  language?: string;

  /**
   * Optional. For “custom_emoji” only, unique identifier of the custom emoji.
   * Use getCustomEmojiStickers to get full information about the sticker.
   */
  custom_emoji_id?: string;
}

// User Type
export interface User {
  /**
   * Unique identifier for this user or bot. This number may have more than 32 significant bits and some programming
   * languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a
   * 64-bit integer or double-precision float type are safe for storing this identifier.
   */
  id: number;

  /**
   * True, if this user is a bot.
   */
  is_bot: boolean;

  /**
   * User's or bot's first name.
   */
  first_name: string;

  /**
   * Optional. User's or bot's last name.
   */
  last_name?: string;

  /**
   * Optional. User's or bot's username.
   */
  username?: string;

  /**
   * Optional. IETF language tag of the user's language.
   */
  language_code?: string;

  /**
   * Optional. True, if this user is a Telegram Premium user.
   */
  is_premium?: true;

  /**
   * Optional. True, if this user added the bot to the attachment menu.
   */
  added_to_attachment_menu?: true;

  /**
   * Optional. True, if the bot can be invited to groups. Returned only in getMe.
   */
  can_join_groups?: boolean;

  /**
   * Optional. True, if privacy mode is disabled for the bot. Returned only in getMe.
   */
  can_read_all_group_messages?: boolean;

  /**
   * Optional. True, if the bot supports inline queries. Returned only in getMe.
   */
  supports_inline_queries?: boolean;

  /**
   * Optional. True, if the bot can be connected to a Telegram Business account to receive its messages.
   * Returned only in getMe.
   */
  can_connect_to_business?: boolean;

  /**
   * Optional. True, if the bot has a main Web App. Returned only in getMe.
   */
  has_main_web_app?: boolean;
}

// LinkPreviewOptions Type
export interface LinkPreviewOptions {
  /**
   * Optional. True, if the link preview is disabled.
   */
  is_disabled?: boolean;

  /**
   * Optional. URL to use for the link preview. If empty, then the first URL found in the message text will be used.
   */
  url?: string;

  /**
   * Optional. True, if the media in the link preview is supposed to be shrunk; ignored if the URL isn't explicitly
   * specified or media size change isn't supported for the preview.
   */
  prefer_small_media?: boolean;

  /**
   * Optional. True, if the media in the link preview is supposed to be enlarged; ignored if the URL isn't explicitly
   * specified or media size change isn't supported for the preview.
   */
  prefer_large_media?: boolean;

  /**
   * Optional. True, if the link preview must be shown above the message text; otherwise, the link preview will be
   * shown below the message text.
   */
  show_above_text?: boolean;
}

export interface TelegramMessage {
  /**
   * Unique message identifier inside this chat. In specific instances (e.g., message containing a video sent to a
   * big chat), the server might automatically schedule a message instead of sending it immediately. In such cases,
   * this field will be 0 and the relevant message will be unusable until it is actually sent.
   */
  message_id: number;

  /**
   * Optional. Unique identifier of a message thread to which the message belongs; for supergroups only.
   */
  message_thread_id?: number;

  /**
   * Optional. Sender of the message; may be empty for messages sent to channels. For backward compatibility, if the
   * message was sent on behalf of a chat, the field contains a fake sender user in non-channel chats.
   */
  from?: User;

  /**
   * Optional. Sender of the message when sent on behalf of a chat. For example, the supergroup itself for messages
   * sent by its anonymous administrators or a linked channel for messages automatically forwarded to the channel's
   * discussion group. For backward compatibility, if the message was sent on behalf of a chat, the field from
   * contains a fake sender user in non-channel chats.
   */
  sender_chat?: Chat;

  /**
   * Date the message was sent in Unix time. It is always a positive number, representing a valid date.
   */
  date: number;

  /**
   * Chat the message belongs to.
   */
  chat: Chat;

  /**
   * Optional. For text messages, the actual UTF-8 text of the message.
   */
  text?: string;

  /**
   * Optional. For text messages, special entities like usernames, URLs, bot commands, etc. that appear in the text.
   */
  entities?: MessageEntity[];

  /**
   * Optional. Options used for link preview generation for the message, if it is a text message and link preview
   * options were changed.
   */
  link_preview_options?: LinkPreviewOptions;

  // Additional fields can be added as needed
}

export interface Chat {
  /**
   * Unique identifier for the chat or username of the target channel.
   */
  id: number | string;

  /**
   * Type of chat (e.g., "private", "group", "supergroup", "channel").
   */
  type: string;

  /**
   * Optional. Title, for supergroups, channels and group chats
   */
  title?: string;

  /**
   * Optional. Username, for private chats, supergroups and channels if available
   */
  username?: string;

  /**
   * Optional. First name of the other party in a private chat
   */
  first_name?: string;

  /**
   * Optional. Last name of the other party in a private chat
   */
  last_name?: string;

  /**
   * Optional. True, if the supergroup chat is a forum (has topics enabled)
   */
  is_forum?: true;
}

/**
 * Describes a Web App.
 */
export interface WebAppInfo {
  /**
   * An HTTPS URL of a Web App to be opened with additional data as specified in Initializing Web Apps.
   */
  url: string;
}

/**
 * This object represents type of a poll, which is allowed to be created and sent when the corresponding button is pressed.
 */
export interface KeyboardButtonPollType {
  /**
   * Optional. If quiz is passed, the user will be allowed to create only polls in the quiz mode.
   * If regular is passed, only regular polls will be allowed. Otherwise, the user will be allowed
   * to create a poll of any type.
   */
  type?: "quiz" | "regular";
}

/**
 * Represents the rights of an administrator in a chat.
 */
export interface ChatAdministratorRights {
  /**
   * True, if the user's presence in the chat is hidden.
   */
  is_anonymous: boolean;

  /**
   * True, if the administrator can access the chat event log, get boost list, see hidden supergroup
   * and channel members, report spam messages and ignore slow mode. Implied by any other administrator privilege.
   */
  can_manage_chat: boolean;

  /**
   * True, if the administrator can delete messages of other users.
   */
  can_delete_messages: boolean;

  /**
   * True, if the administrator can manage video chats.
   */
  can_manage_video_chats: boolean;

  /**
   * True, if the administrator can restrict, ban or unban chat members, or access supergroup statistics.
   */
  can_restrict_members: boolean;

  /**
   * True, if the administrator can add new administrators with a subset of their own privileges or
   * demote administrators that they have promoted, directly or indirectly (promoted by administrators
   * that were appointed by the user).
   */
  can_promote_members: boolean;

  /**
   * True, if the user is allowed to change the chat title, photo and other settings.
   */
  can_change_info: boolean;

  /**
   * True, if the user is allowed to invite new users to the chat.
   */
  can_invite_users: boolean;

  /**
   * True, if the administrator can post stories to the chat.
   */
  can_post_stories: boolean;

  /**
   * True, if the administrator can edit stories posted by other users, post stories to the chat page,
   * pin chat stories, and access the chat's story archive.
   */
  can_edit_stories: boolean;

  /**
   * True, if the administrator can delete stories posted by other users.
   */
  can_delete_stories: boolean;

  /**
   * Optional. True, if the administrator can post messages in the channel, or access channel statistics; for channels only.
   */
  can_post_messages?: boolean;

  /**
   * Optional. True, if the administrator can edit messages of other users and can pin messages; for channels only.
   */
  can_edit_messages?: boolean;

  /**
   * Optional. True, if the user is allowed to pin messages; for groups and supergroups only.
   */
  can_pin_messages?: boolean;

  /**
   * Optional. True, if the user is allowed to create, rename, close, and reopen forum topics; for supergroups only.
   */
  can_manage_topics?: boolean;
}

/**
 * This object defines the criteria used to request a suitable chat. Information about the selected chat
 * will be shared with the bot when the corresponding button is pressed. The bot will be granted requested
 * rights in the chat if appropriate. More about requesting chats ».
 */
export interface KeyboardButtonRequestChat {
  /**
   * Signed 32-bit identifier of the request, which will be received back in the ChatShared object.
   * Must be unique within the message.
   */
  request_id: number;

  /**
   * Pass True to request a channel chat, pass False to request a group or a supergroup chat.
   */
  chat_is_channel: boolean;

  /**
   * Optional. Pass True to request a forum supergroup, pass False to request a non-forum chat.
   * If not specified, no additional restrictions are applied.
   */
  chat_is_forum?: boolean;

  /**
   * Optional. Pass True to request a supergroup or a channel with a username, pass False to request
   * a chat without a username. If not specified, no additional restrictions are applied.
   */
  chat_has_username?: boolean;

  /**
   * Optional. Pass True to request a chat owned by the user. Otherwise, no additional restrictions are applied.
   */
  chat_is_created?: boolean;

  /**
   * Optional. A JSON-serialized object listing the required administrator rights of the user in the chat.
   * The rights must be a superset of bot_administrator_rights. If not specified, no additional restrictions are applied.
   */
  user_administrator_rights?: ChatAdministratorRights;

  /**
   * Optional. A JSON-serialized object listing the required administrator rights of the bot in the chat.
   * The rights must be a subset of user_administrator_rights. If not specified, no additional restrictions are applied.
   */
  bot_administrator_rights?: ChatAdministratorRights;

  /**
   * Optional. Pass True to request a chat with the bot as a member. Otherwise, no additional restrictions are applied.
   */
  bot_is_member?: boolean;

  /**
   * Optional. Pass True to request the chat's title.
   */
  request_title?: boolean;

  /**
   * Optional. Pass True to request the chat's username.
   */
  request_username?: boolean;

  /**
   * Optional. Pass True to request the chat's photo.
   */
  request_photo?: boolean;
}

/**
 * This object defines the criteria used to request suitable users. Information about the selected users
 * will be shared with the bot when the corresponding button is pressed. More about requesting users ».
 */
export interface KeyboardButtonRequestUsers {
  /**
   * Signed 32-bit identifier of the request that will be received back in the UsersShared object.
   * Must be unique within the message.
   */
  request_id: number;

  /**
   * Optional. Pass True to request bots, pass False to request regular users. If not specified,
   * no additional restrictions are applied.
   */
  user_is_bot?: boolean;

  /**
   * Optional. Pass True to request premium users, pass False to request non-premium users.
   * If not specified, no additional restrictions are applied.
   */
  user_is_premium?: boolean;

  /**
   * Optional. The maximum number of users to be selected; 1-10. Defaults to 1.
   */
  max_quantity?: number;

  /**
   * Optional. Pass True to request the users' first and last names.
   */
  request_name?: boolean;

  /**
   * Optional. Pass True to request the users' usernames.
   */
  request_username?: boolean;

  /**
   * Optional. Pass True to request the users' photos.
   */
  request_photo?: boolean;
}

/**
 * This object represents one button of the reply keyboard. At most one of the optional fields must be used
 * to specify type of the button. For simple text buttons, String can be used instead of this object to specify
 * the button text.
 */
export interface KeyboardButton {
  /**
   * Text of the button. If none of the optional fields are used, it will be sent as a message when the button is pressed.
   */
  text: string;

  /**
   * Optional. If specified, pressing the button will open a list of suitable users. Identifiers of selected users
   * will be sent to the bot in a “users_shared” service message. Available in private chats only.
   */
  request_users?: KeyboardButtonRequestUsers;

  /**
   * Optional. If specified, pressing the button will open a list of suitable chats. Tapping on a chat will send
   * its identifier to the bot in a “chat_shared” service message. Available in private chats only.
   */
  request_chat?: KeyboardButtonRequestChat;

  /**
   * Optional. If True, the user's phone number will be sent as a contact when the button is pressed.
   * Available in private chats only.
   */
  request_contact?: boolean;

  /**
   * Optional. If True, the user's current location will be sent when the button is pressed.
   * Available in private chats only.
   */
  request_location?: boolean;

  /**
   * Optional. If specified, the user will be asked to create a poll and send it to the bot when the button is pressed.
   * Available in private chats only.
   */
  request_poll?: KeyboardButtonPollType;

  /**
   * Optional. If specified, the described Web App will be launched when the button is pressed. The Web App will be
   * able to send a “web_app_data” service message. Available in private chats only.
   */
  web_app?: WebAppInfo;
}

/** A placeholder, currently holds no information. Use BotFather to set up your game. */
export type CallbackGame = unknown;

/**
 * This object represents an inline keyboard that appears right next to the message it belongs to.
 */
export interface InlineKeyboardMarkup {
  /**
   * Array of button rows, each represented by an Array of InlineKeyboardButton objects.
   */
  inline_keyboard: InlineKeyboardButton[][];
}

/**
 * This object represents a custom keyboard with reply options (see Introduction to bots for details and examples).
 * Not supported in channels and for messages sent on behalf of a Telegram Business account.
 */
export interface ReplyKeyboardMarkup {
  /**
   * Array of button rows, each represented by an Array of KeyboardButton objects.
   */
  keyboard: KeyboardButton[][];

  /**
   * Optional. Requests clients to always show the keyboard when the regular keyboard is hidden.
   * Defaults to false, in which case the custom keyboard can be hidden and opened with a keyboard icon.
   */
  is_persistent?: boolean;

  /**
   * Optional. Requests clients to resize the keyboard vertically for optimal fit (e.g., make the keyboard smaller
   * if there are just two rows of buttons). Defaults to false, in which case the custom keyboard is always of the
   * same height as the app's standard keyboard.
   */
  resize_keyboard?: boolean;

  /**
   * Optional. Requests clients to hide the keyboard as soon as it's been used. The keyboard will still be available,
   * but clients will automatically display the usual letter-keyboard in the chat - the user can press a special
   * button in the input field to see the custom keyboard again. Defaults to false.
   */
  one_time_keyboard?: boolean;

  /**
   * Optional. The placeholder to be shown in the input field when the keyboard is active; 1-64 characters.
   */
  input_field_placeholder?: string;

  /**
   * Optional. Use this parameter if you want to show the keyboard to specific users only. Targets:
   * 1) users that are @mentioned in the text of the Message object;
   * 2) if the bot's message is a reply to a message in the same chat and forum topic, sender of the original message.
   *
   * Example: A user requests to change the bot's language, bot replies to the request with a keyboard to select the
   * new language. Other users in the group don't see the keyboard.
   */
  selective?: boolean;
}

/**
 * Upon receiving a message with this object, Telegram clients will remove the current custom keyboard and display
 * the default letter-keyboard. By default, custom keyboards are displayed until a new keyboard is sent by a bot.
 * An exception is made for one-time keyboards that are hidden immediately after the user presses a button
 * (see ReplyKeyboardMarkup). Not supported in channels and for messages sent on behalf of a Telegram Business account.
 */
export interface ReplyKeyboardRemove {
  /**
   * Requests clients to remove the custom keyboard (user will not be able to summon this keyboard; if you want to
   * hide the keyboard from sight but keep it accessible, use one_time_keyboard in ReplyKeyboardMarkup).
   */
  remove_keyboard: true;

  /**
   * Optional. Use this parameter if you want to remove the keyboard for specific users only. Targets:
   * 1) users that are @mentioned in the text of the Message object;
   * 2) if the bot's message is a reply to a message in the same chat and forum topic, sender of the original message.
   *
   * Example: A user votes in a poll, bot returns confirmation message in reply to the vote and removes the keyboard
   * for that user, while still showing the keyboard with poll options to users who haven't voted yet.
   */
  selective?: boolean;
}

/**
 * Upon receiving a message with this object, Telegram clients will display a reply interface to the user (act as if
 * the user has selected the bot's message and tapped 'Reply'). This can be extremely useful if you want to create
 * user-friendly step-by-step interfaces without having to sacrifice privacy mode. Not supported in channels and for
 * messages sent on behalf of a Telegram Business account.
 *
 * Example: A poll bot for groups runs in privacy mode (only receives commands, replies to its messages and mentions).
 * There could be two ways to create a new poll:
 * 1) Explain the user how to send a command with parameters (e.g. /newpoll question answer1 answer2).
 *    May be appealing for hardcore users but lacks modern day polish.
 * 2) Guide the user through a step-by-step process. 'Please send me your question', 'Cool, now let's add the first
 *    answer option', 'Great. Keep adding answer options, then send /done when you're ready'.
 * The last option is definitely more attractive. And if you use ForceReply in your bot's questions, it will receive
 * the user's answers even if it only receives replies, commands and mentions - without any extra work for the user.
 */
export interface ForceReply {
  /**
   * Shows reply interface to the user, as if they manually selected the bot's message and tapped 'Reply'.
   */
  force_reply: true;

  /**
   * Optional. The placeholder to be shown in the input field when the reply is active; 1-64 characters.
   */
  input_field_placeholder?: string;

  /**
   * Optional. Use this parameter if you want to force reply from specific users only. Targets:
   * 1) users that are @mentioned in the text of the Message object;
   * 2) if the bot's message is a reply to a message in the same chat and forum topic, sender of the original message.
   */
  selective?: boolean;
}

/**
 * Describes reply parameters for the message that is being sent.
 */
export interface ReplyParameters {
  /**
   * Identifier of the message that will be replied to in the current chat, or in the chat chat_id if it is specified.
   */
  message_id: number;

  /**
   * Optional. If the message to be replied to is from a different chat, unique identifier for the chat or username
   * of the channel (in the format @channelusername). Not supported for messages sent on behalf of a business account.
   */
  chat_id?: number | string;

  /**
   * Optional. Pass True if the message should be sent even if the specified message to be replied to is not found.
   * Always False for replies in another chat or forum topic. Always True for messages sent on behalf of a business account.
   */
  allow_sending_without_reply?: boolean;

  /**
   * Optional. Quoted part of the message to be replied to; 0-1024 characters after entities parsing. The quote must
   * be an exact substring of the message to be replied to, including bold, italic, underline, strikethrough, spoiler,
   * and custom_emoji entities. The message will fail to send if the quote isn't found in the original message.
   */
  quote?: string;

  /**
   * Optional. Mode for parsing entities in the quote. See formatting options for more details.
   */
  quote_parse_mode?: string;

  /**
   * Optional. A JSON-serialized list of special entities that appear in the quote. It can be specified instead of quote_parse_mode.
   */
  quote_entities?: MessageEntity[];

  /**
   * Optional. Position of the quote in the original message in UTF-16 code units.
   */
  quote_position?: number;
}

// ReplyMarkup Type (simplified for brevity)
export type ReplyMarkup =
  | InlineKeyboardMarkup
  | ReplyKeyboardMarkup
  | ReplyKeyboardRemove
  | ForceReply;

/** Use this method to send text messages. On success, the sent Message is returned. */
export interface SendMessage {
  /**
   * Optional. Unique identifier of the business connection on behalf of which the message will be sent.
   */
  business_connection_id?: string;

  /**
   * Unique identifier for the target chat or username of the target channel (in the format @channelusername).
   */
  chat_id: number | string;

  /**
   * Optional. Unique identifier for the target message thread (topic) of the forum; for forum supergroups only.
   */
  message_thread_id?: number;

  /**
   * Text of the message to be sent, 1-4096 characters after entities parsing.
   */
  text: string;

  /**
   * Optional. Mode for parsing entities in the message text. See formatting options for more details.
   */
  parse_mode?: string;

  /**
   * Optional. A JSON-serialized list of special entities that appear in message text, which can be specified
   * instead of parse_mode.
   */
  entities?: MessageEntity[];

  /**
   * Optional. Link preview generation options for the message.
   */
  link_preview_options?: LinkPreviewOptions;

  /**
   * Optional. Sends the message silently. Users will receive a notification with no sound.
   */
  disable_notification?: boolean;

  /**
   * Optional. Protects the contents of the sent message from forwarding and saving.
   */
  protect_content?: boolean;

  /**
   * Optional. Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1
   * Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance.
   */
  allow_paid_broadcast?: boolean;

  /**
   * Optional. Unique identifier of the message effect to be added to the message; for private chats only.
   */
  message_effect_id?: string;

  /**
   * Optional. Description of the message to reply to.
   */
  reply_parameters?: ReplyParameters;

  /**
   * Optional. Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard,
   * instructions to remove a reply keyboard or to force a reply from the user.
   */
  reply_markup?: ReplyMarkup;
}

/**
 * This object represents one button of an inline keyboard. Exactly one of the optional fields must be used
 * to specify the type of the button.
 */
export interface InlineKeyboardButton {
  /**
   * Label text on the button.
   */
  text: string;

  /**
   * Optional. HTTP or tg:// URL to be opened when the button is pressed. Links tg://user?id=<user_id> can be used
   * to mention a user by their identifier without using a username, if this is allowed by their privacy settings.
   */
  url?: string;

  /**
   * Optional. Data to be sent in a callback query to the bot when the button is pressed, 1-64 bytes.
   */
  callback_data?: string;

  /**
   * Optional. Description of the Web App that will be launched when the user presses the button. The Web App will
   * be able to send an arbitrary message on behalf of the user using the method answerWebAppQuery. Available only
   * in private chats between a user and the bot. Not supported for messages sent on behalf of a Telegram Business account.
   */
  web_app?: WebAppInfo;

  /**
   * Optional. An HTTPS URL used to automatically authorize the user. Can be used as a replacement for the Telegram Login Widget.
   */
  login_url?: LoginUrl;

  /**
   * Optional. If set, pressing the button will prompt the user to select one of their chats, open that chat and insert
   * the bot's username and the specified inline query in the input field. May be empty, in which case just the bot's
   * username will be inserted. Not supported for messages sent on behalf of a Telegram Business account.
   */
  switch_inline_query?: string;

  /**
   * Optional. If set, pressing the button will insert the bot's username and the specified inline query in the current
   * chat's input field. May be empty, in which case only the bot's username will be inserted. This offers a quick way
   * for the user to open your bot in inline mode in the same chat - good for selecting something from multiple options.
   * Not supported in channels and for messages sent on behalf of a Telegram Business account.
   */
  switch_inline_query_current_chat?: string;

  /**
   * Optional. If set, pressing the button will prompt the user to select one of their chats of the specified type, open
   * that chat and insert the bot's username and the specified inline query in the input field. Not supported for messages
   * sent on behalf of a Telegram Business account.
   */
  switch_inline_query_chosen_chat?: SwitchInlineQueryChosenChat;

  /**
   * Optional. Description of the button that copies the specified text to the clipboard.
   */
  copy_text?: CopyTextButton;

  /**
   * Optional. Description of the game that will be launched when the user presses the button.
   *
   * NOTE: This type of button must always be the first button in the first row.
   */
  callback_game?: CallbackGame;

  /**
   * Optional. Specify True, to send a Pay button. Substrings “⭐” and “XTR” in the buttons's text will be replaced with
   * a Telegram Star icon.
   *
   * NOTE: This type of button must always be the first button in the first row and can only be used in invoice messages.
   */
  pay?: boolean;
}

/**
 * This object represents a parameter of the inline keyboard button used to automatically authorize a user.
 * Serves as a great replacement for the Telegram Login Widget when the user is coming from Telegram. All the user
 * needs to do is tap/click a button and confirm that they want to log in.
 */
export interface LoginUrl {
  /**
   * An HTTPS URL to be opened with user authorization data added to the query string when the button is pressed.
   * If the user refuses to provide authorization data, the original URL without information about the user will be opened.
   * The data added is the same as described in Receiving authorization data.
   *
   * NOTE: You must always check the hash of the received data to verify the authentication and the integrity of the data
   * as described in Checking authorization.
   */
  url: string;

  /**
   * Optional. New text of the button in forwarded messages.
   */
  forward_text?: string;

  /**
   * Optional. Username of a bot, which will be used for user authorization. See Setting up a bot for more details.
   * If not specified, the current bot's username will be assumed. The url's domain must be the same as the domain
   * linked with the bot. See Linking your domain to the bot for more details.
   */
  bot_username?: string;

  /**
   * Optional. Pass True to request the permission for your bot to send messages to the user.
   */
  request_write_access?: boolean;
}

/**
 * This object represents an inline keyboard button that copies specified text to the clipboard.
 */
export interface CopyTextButton {
  /**
   * The text to be copied to the clipboard; 1-256 characters.
   */
  text: string;
}

/**
 * This object represents an inline button that switches the current user to inline mode in a chosen chat,
 * with an optional default inline query.
 */
export interface SwitchInlineQueryChosenChat {
  /**
   * Optional. The default inline query to be inserted in the input field. If left empty, only the bot's username
   * will be inserted.
   */
  query?: string;

  /**
   * Optional. True, if private chats with users can be chosen.
   */
  allow_user_chats?: boolean;

  /**
   * Optional. True, if private chats with bots can be chosen.
   */
  allow_bot_chats?: boolean;

  /**
   * Optional. True, if group and supergroup chats can be chosen.
   */
  allow_group_chats?: boolean;

  /**
   * Optional. True, if channel chats can be chosen.
   */
  allow_channel_chats?: boolean;
}

/** Used to update chat info in db */
export interface ChatInfo {
  chatId: string | number;
  userId: number;
  firstName: string;
  userName?: string | null;
  lastName?: string | null;
}
