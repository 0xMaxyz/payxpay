interface TelegramWebApp {
  ready(): void;
  setHeaderColor(color: string): void;
  setBottomBarColor(color: string): void;
  colorScheme: "light" | "dark";
  onEvent(event: string, callback: () => void): void;
  offEvent(event: string, callback: () => void): void;
  initDataUnsafe: {
    user?: {
      first_name?: string;
      last_name?: string;
      username?: string;
      id?: number;
    };
  };
  MainButton: {
    setText(text: string): void;
    show(): void;
    hide(): void;
  };
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
