interface TelegramWebApp {
  ready(): void;
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
