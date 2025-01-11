import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EnvironmentType, TgUserData } from "../types";
import { decodeInitData } from "@/lib/tools";

interface TelegramContextProps {
  WebApp: typeof window.Telegram.WebApp | null;
  userData: TgUserData | undefined;
  isAllowed: boolean;
  loading: boolean;
  theme: "light" | "dark";
  cloudStorage: CloudStorageFunctions | null;
  scanQrCode: QrCodeScanFunctions | null;
  mainButton: MainButtonFunctions | null;
  platform: Platform;
  token: string | null;
  isTokenExpired: boolean;
}

type Platform = "android" | "ios" | "macos" | "tdesktop" | "web" | null;

interface MainButtonFunctions {
  enableAndShowMainButton: (
    text: string,
    onClickHandler: () => void,
    buttonColor?: string,
    textColor?: string,
    waitDuration?: number,
    waitText?: string
  ) => void;
  disableMainButton: () => void;
}

export interface CloudStorageFunctions {
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

interface QrCodeScanFunctions {
  showScanQrPopup: (params?: ScanQrPopupParams) => Promise<string | null>;
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
  const [userData, setUserData] = useState<TgUserData | undefined>(undefined);
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const isProduction = useMemo(
    () => (process.env.NEXT_PUBLIC_ENV as EnvironmentType) === "production",
    []
  );
  const isInit = useRef(false);

  // Qr Code Scanner
  const scanQrCode: QrCodeScanFunctions | null = WebApp?.showScanQrPopup
    ? {
        showScanQrPopup: (params?: ScanQrPopupParams) =>
          new Promise((resolve, reject) => {
            // Listen for the qrTextReceived event
            const onQrTextReceived = (event: { data: string }) => {
              const text = event.data;
              if (text) {
                resolve(text);
                WebApp.offEvent("qrTextReceived", onQrTextReceived);
              } else {
                reject("QR code scanning failed or returned empty text");
              }
            };
            WebApp.onEvent("qrTextReceived", onQrTextReceived);
            // Show the QR scanner popup
            WebApp.showScanQrPopup(params, (txt: string) => {
              if (!txt) {
                reject("QR code popup closed without scanning");
                WebApp.offEvent("qrTextReceived", onQrTextReceived);
              }
              return true;
            });
          }),
      }
    : null;
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
  const getButtonColor = () => {
    const re = document.documentElement;
    const cs = getComputedStyle(re);
    return cs.getPropertyValue("--tg-theme-button-color").trim();
  };
  const mainButton: MainButtonFunctions | null = WebApp?.MainButton
    ? {
        enableAndShowMainButton: (
          text: string,
          onClickHandler: () => void,
          buttonColor?: string,
          textColor?: string,
          waitDuration?: number,
          waitText?: string
        ) => {
          new Promise((resolve, reject) => {
            try {
              const { MainButton: mb } = WebApp;
              // set onClick handler
              mb.onClick(onClickHandler);
              // set buttonColor
              if (buttonColor) {
                mb.setParams({
                  color: buttonColor,
                });
              }
              // set textColor
              if (textColor) {
                mb.setParams({
                  text_color: textColor,
                });
              }

              if (waitDuration) {
                let remainingTime = waitDuration;
                mb.setParams({
                  text: waitText,
                  color: getButtonColor(), // reset to theme color
                  is_visible: true,
                  is_active: false,
                }).showProgress();
                const countdownInterval = setInterval(() => {
                  if (remainingTime <= 0) {
                    clearInterval(countdownInterval);
                    mb.setParams({
                      text: text,
                      is_active: true,
                      color: "#32CD32",
                    }).hideProgress();
                    resolve(true);
                  } else {
                    mb.setText(
                      `${waitText} ${Math.ceil(remainingTime / 1000)} seconds`
                    );
                    remainingTime -= 1000;
                  }
                }, 1000);
              } else {
                mb.setParams({
                  text: text,
                  color: "#32CD32",
                  is_active: true,
                  is_visible: true,
                });
              }
              resolve(true);
            } catch {
              reject("An error occured during enabling the main button");
            }
          });
        },
        disableMainButton: () => {
          WebApp.MainButton.setParams({
            is_active: false,
            is_visible: false,
          });
        },
      }
    : null;
  useEffect(() => {
    if (isInit.current) {
      return;
    }
    isInit.current = true;
    let timeout: NodeJS.Timeout | null = null;

    const validateInitData = async (initData: string) => {
      try {
        const response = await fetch(
          `/api/telegram/validate2?initData=${encodeURIComponent(
            // `/api/telegram/validate-userdata?initData=${encodeURIComponent(
            initData
          )}`
        );
        const data = await response.json();

        if (response.ok && data.isValid) {
          console.log("Token is", data.token);
          setToken(data.token);
          setIsAllowed(data.isValid);
          setUserData(decodeInitData(initData).user);
          // set the html theme to telegram
          document.documentElement.setAttribute("data-theme", "telegram");
        } else {
          console.warn("Validation failed");
          setIsAllowed(false);
        }
      } catch (error) {
        console.error(`Error validating user data: ${error}`);
        setIsAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    if (!isProduction) {
      // In development, skip validation for testing purposes
      setIsAllowed(true);
      setLoading(false);
    } else {
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        const tgWebApp = window.Telegram.WebApp;
        // Set Telegram Webapp
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
        }
        // execute the ready() function after doing the initial checks
        tgWebApp.ready();

        // Cleanup event listener
        return () => {
          tgWebApp.offEvent("themeChanged", handleThemeChange);
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
        };
      }
    }
  }, [isProduction]);

  useEffect(() => {
    console.log("Token is changed", token);
    if (token) {
      console.log("Token is set", token);
      const decodedJwt = JSON.parse(atob(token.split(".")[1]));
      const expiration = decodedJwt.exp * 1000;
      console.log("Expiration", expiration);
      const currentTime = Date.now();
      console.log("Current timne", currentTime);

      if (expiration < currentTime) {
        setIsTokenExpired(true);
        console.log("token expired");
      } else {
        console.log("Token is valid");
        const timeout = setTimeout(() => {
          setIsTokenExpired(true);
          console.log("Token expired");
        }, expiration - currentTime);
        return () => clearTimeout(timeout);
      }
    }
  }, [token]);

  return (
    <TelegramContext.Provider
      value={{
        WebApp,
        userData,
        isAllowed,
        loading,
        theme,
        cloudStorage,
        scanQrCode,
        mainButton,
        platform: WebApp?.platform as Platform,
        token,
        isTokenExpired,
      }}
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
