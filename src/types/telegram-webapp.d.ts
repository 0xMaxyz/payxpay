interface TelegramWebApp {
  enableClosingConfirmation(): void;
  showPopup(params: PopupParams, callback?: (id: string) => void): void;
  ready(): void;
  close(): void;
  setHeaderColor(color: string): void;
  setBottomBarColor(color: string): void;
  colorScheme: "light" | "dark";
  onEvent(event: string, callback: (params?) => void): void;
  offEvent(event: string, callback: (params?) => void): void;
  initDataUnsafe: {
    user?: {
      first_name?: string;
      last_name?: string;
      username?: string;
      id?: number;
    };
  };
  showScanQrPopup(
    params?: ScanQrPopupParams,
    callback?: (text: string) => void
  ): void;
  MainButton: BottomButton;
  platform: string;
  initData: string;
  shareMessage: (msg_id: string, callback?: (isSent: boolean) => void) => void;
  CloudStorage: {
    setItem(
      key: string,
      value: string,
      callback?: (error: Error | null, isSet?: boolean) => void
    ): void;
    getItem(
      key: string,
      callback?: (error: Error | null, value: string) => void
    ): void;
    getItems(
      keys: string[],
      callback?: (error: Error | null, values: string[]) => void
    ): void;
    removeItem(
      key: string,
      callback?: (error: Error | null, removed?: boolean) => void
    ): void;
    removeItems(
      keys: string[],
      callback?: (error: Error | null, removed?: boolean) => void
    ): void;
    getKeys(callback: (error: Error | null, keys?: string[]) => void): void;
  };
}

interface PopupParams {
  /** Optional. The text to be displayed in the popup title, 0-64 characters. */
  title?: string;
  /** The message to be displayed in the body of the popup, 1-256 characters. */
  message: string;
  /** Optional. List of buttons to be displayed in the popup, 1-3 buttons. Set to [{“type”:“close”}] by default. */
  buttons?: PopupButton[];
}
interface PopupButton {
  /** Optional. Identifier of the button, 0-64 characters. Set to empty string by default.
If the button is pressed, its id is returned in the callback and the popupClosed event. */
  id?: string;
  /**
   * - default, a button with the default style,
   * - ok, a button with the localized text “OK”,
   * - close, a button with the localized text “Close”,
   * - cancel, a button with the localized text “Cancel”,
   * - destructive, a button with a style that indicates a destructive action (e.g. “Remove”, “Delete”, etc.). */
  type?: "default" | "ok" | "close" | "cancel" | "destructive";
  /** Optional. The text to be displayed on the button, 0-64 characters. Required if type is default or destructive. Irrelevant for other types. */
  text?: string;
}

interface Window {
  Telegram: {
    WebApp: TelegramWebApp;
  };
}

interface ScanQrPopupParams {
  text?: string; // The text to be displayed under the 'Scan QR' heading, 0-64 characters.
}

interface BottomButton {
  readonly type: "main" | "secondary";
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  hasShineEffect: boolean;
  position?: "left" | "right" | "top" | "bottom";
  readonly isProgressVisible: boolean;

  setText(text: string): BottomButton;
  onClick(callback: () => void): BottomButton;
  offClick(callback: () => void): BottomButton;
  show(): BottomButton;
  hide(): BottomButton;
  enable(): BottomButton;
  disable(): BottomButton;
  showProgress(leaveActive?: boolean): BottomButton;
  hideProgress(): BottomButton;
  setParams(params: {
    text?: string;
    color?: string;
    text_color?: string;
    has_shine_effect?: boolean;
    position?: "left" | "right" | "top" | "bottom";
    is_active?: boolean;
    is_visible?: boolean;
  }): BottomButton;
}
