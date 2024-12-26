import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { EnvironmentType, TgUserData } from "../types";

interface TelegramContextProps {
  WebApp: typeof window.Telegram.WebApp | null;
  userData: TgUserData | null;
  isAllowed: boolean;
  loading: boolean;
  theme: "light" | "dark";
  cloudStorage: CloudStorageFunctions | null;
}

interface CloudStorageFunctions {
  setItem: (key: string, value: string) => Promise<boolean>;
  getItem: (key: string) => Promise<string | null>;
  getItems: (keys: string[]) => Promise<string[]>;
  removeItem: (key: string) => Promise<boolean>;
  removeItems: (keys: string[]) => Promise<boolean>;
  getKeys: () => Promise<string[]>;
  getFirstAvailableInvoiceId: () => Promise<number>;
  saveInvoice: (invoice: string) => Promise<boolean>;
  getInvoice: (key: number) => Promise<string | null>;
  getInvoices: (page: number, pageSize: number) => Promise<string[]>;
  removeInvoice: (key: number) => Promise<boolean>;
  removeAllInvoices: () => Promise<boolean>;
  setConfig: (key: number, value: string) => Promise<boolean>;
  getConfig: (key: number) => Promise<string | null>;
  removeConfig: (key: number) => Promise<boolean>;
}

export const TelegramContext = createContext<TelegramContextProps | undefined>(
  undefined
);

export const TelegramProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [WebApp, setWebApp] = useState<typeof window.Telegram.WebApp | null>(
    null
  );
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [userData, setUserData] = useState<TgUserData | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const isProduction =
    (process.env.NEXT_PUBLIC_ENV as EnvironmentType) === "production";
  const isInit = useRef(false);
  // Cloud Storage
  const cloudStorage: CloudStorageFunctions | null = WebApp?.CloudStorage
    ? {
        setItem: (key, value) =>
          new Promise((resolve, reject) => {
            WebApp.CloudStorage.setItem(key, value, (err, success) => {
              if (err) return reject(err);
              resolve(success ?? false);
            });
          }),
        getItem: (key) =>
          new Promise((resolve, reject) => {
            WebApp.CloudStorage.getItem(key, (err, value) => {
              if (err) return reject(err);
              resolve(value);
            });
          }),
        getItems: (keys) =>
          new Promise((resolve, reject) => {
            WebApp.CloudStorage.getItems(keys, (err, values) => {
              if (err) return reject(err);
              resolve(values);
            });
          }),
        removeItem: (key) =>
          new Promise((resolve, reject) => {
            WebApp.CloudStorage.removeItem(key, (err, success) => {
              if (err) return reject(err);
              resolve(success ?? false);
            });
          }),
        removeItems: (keys) =>
          new Promise((resolve, reject) => {
            WebApp.CloudStorage.removeItems(keys, (err, success) => {
              if (err) return reject(err);
              resolve(success ?? false);
            });
          }),
        getKeys: () =>
          new Promise((resolve, reject) => {
            WebApp.CloudStorage.getKeys((err, keys) => {
              if (err) return reject(err);
              resolve(keys ?? []);
            });
          }),
        getFirstAvailableInvoiceId: async () => {
          if (!cloudStorage) {
            console.error("Cloud Storage is not available");
            throw new Error("Cloud Storage is not available");
          }
          const keys = await cloudStorage.getKeys();
          const availableKey = Array.from(
            { length: 1024 - 24 },
            (_, i) => i + 25
          ).find((key) => !keys.includes(String(key)));
          if (availableKey === undefined) {
            throw new Error("No available storage keys for invoices");
          }
          return availableKey;
        },
        saveInvoice: async (invoice) => {
          if (!cloudStorage) {
            console.error("Cloud Storage is not available");

            return false;
          }
          const keys = await cloudStorage.getKeys();
          const nextKey = Array.from({ length: 1024 - 24 }, (_, i) => i + 25)
            .map(String)
            .find((key) => !keys.includes(key));
          if (!nextKey)
            throw new Error("No available storage keys for invoices");
          return cloudStorage.setItem(nextKey, invoice);
        },
        getInvoices: async (page = 1, pageSize = 10) => {
          if (!cloudStorage) {
            console.error("Cloud Storage is not available");
            return [];
          }
          const keys = await cloudStorage.getKeys();
          const invoiceKeys = keys
            .map(Number)
            .filter((key) => key >= 25 && key <= 1024)
            .sort((a, b) => a - b);
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          const paginatedKeys = invoiceKeys.slice(start, end);
          const invoices = await cloudStorage.getItems(
            paginatedKeys.map(String)
          );
          return invoices;
        },
        getInvoice: async (key) => {
          if (!cloudStorage) {
            console.error("Cloud Storage is not available");
            return null;
          }
          if (key < 25 || key > 1024)
            throw new Error("Key out of range for invoices");
          return cloudStorage.getItem(String(key));
        },
        removeInvoice: async (key) => {
          if (!cloudStorage) {
            console.error("Cloud Storage is not available");
            return false;
          }
          if (key < 25 || key > 1024)
            throw new Error("Key out of range for invoices");
          return cloudStorage.removeItem(String(key));
        },
        removeAllInvoices: async () => {
          if (!cloudStorage) {
            console.error("Cloud Storage is not available");
            return false;
          }
          const keys = await cloudStorage.getKeys();
          const invoiceKeys = keys
            .map(Number)
            .filter((key) => key >= 25 && key <= 1024)
            .sort((a, b) => a - b);
          return cloudStorage.removeItems(invoiceKeys.map(String));
        },
        setConfig: async (key, value) => {
          if (!cloudStorage) {
            console.error("Cloud Storage is not available");
            return false;
          }
          if (key < 1 || key > 24)
            throw new Error("Key out of range for configs");
          return cloudStorage.setItem(String(key), value);
        },
        getConfig: async (key) => {
          if (!cloudStorage) {
            console.error("Cloud Storage is not available");
            return null;
          }
          if (key < 1 || key > 24)
            throw new Error("Key out of range for configs");
          return cloudStorage.getItem(String(key));
        },
        removeConfig: async (key) => {
          if (!cloudStorage) {
            console.error("Cloud Storage is not available");
            return false;
          }
          if (key < 1 || key > 24)
            throw new Error("Key out of range for configs");
          return cloudStorage.removeItem(String(key));
        },
      }
    : null;
  //
  useEffect(() => {
    if (isInit.current) {
      return;
    }
    isInit.current = true;
    const validateInitData = async (initData: string) => {
      try {
        const response = await fetch(
          `/api/telegram/validate-userdata?initData=${encodeURIComponent(
            initData
          )}`
        );
        const data = await response.json();

        if (response.ok && data.isValid) {
          console.info("Validation successful");
          setIsAllowed(true);
          const user = Object.fromEntries(new URLSearchParams(initData));
          setUserData(JSON.parse(user.user));
          // set the html theme to telegram
          document.documentElement.setAttribute("data-theme", "telegram");
        } else {
          console.warn("Validation failed");
          setIsAllowed(false);
          setUserData(null);
        }
      } catch (error) {
        console.error(`Error validating user data: ${error}`);
        setIsAllowed(false);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    if (!isProduction) {
      // In development, skip validation for testing purposes
      setIsAllowed(true);
      setUserData(null);
      setLoading(false);
    } else {
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        const tgWebApp = window.Telegram.WebApp;
        tgWebApp.ready();
        setWebApp(tgWebApp);

        // set theme
        setTheme(tgWebApp.colorScheme);

        // set header and footer colors in TMA
        tgWebApp.setHeaderColor("secondary_bg_color");
        tgWebApp.setBottomBarColor("secondary_bg_color");

        // Listen for theme change
        const handleThemeChange = () => {
          setTheme(tgWebApp.colorScheme);
        };
        tgWebApp.onEvent("themeChanged", handleThemeChange);

        const initData = tgWebApp.initData;
        if (initData) {
          validateInitData(initData);
        } else {
          setLoading(false);
        }

        // Cleanup event listener
        return () => {
          tgWebApp.offEvent("themeChanged", handleThemeChange);
        };
      }
    }
  }, [isProduction]);
  return (
    <TelegramContext.Provider
      value={{ WebApp, userData, isAllowed, loading, theme, cloudStorage }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegramContext = () => {
  const context = useContext(TelegramContext);

  if (!context) {
    throw new Error(
      "useTelegramContext must be used within a TelegramProvider"
    );
  }

  return context;
};
