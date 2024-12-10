interface TelegramWebApp {
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
}

interface Window {
  Telegram: {
    WebApp: TelegramWebApp;
  };
}
