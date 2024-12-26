"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
} from "react";

type Notification = {
  id: string;
  color: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
  children?: ReactNode;
};
type NotificationContextType = {
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
};
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);
  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = crypto.randomUUID();
      setNotifications((prev) => [...prev, { ...notification, id }]);
      setTimeout(() => removeNotification(id), notification.duration ?? 5000);
    },
    [removeNotification]
  );
  return (
    <NotificationContext.Provider
      value={{ addNotification, removeNotification }}
    >
      {children}
      <div className="toast toast-end min-w-80 ">
        {notifications.map(({ id, color, message, children }) => (
          <div
            key={id}
            className={`alert flex ${
              color === "info"
                ? "alert-info"
                : color === "error"
                ? "alert-error"
                : color === "warning"
                ? "alert-warning"
                : "alert-success"
            } shadow-lg`}
          >
            <div
              className="flex flex-row items-center justify-between "
              style={{ width: "100%" }}
            >
              <div>
                <span className="tg-text">{message}</span>
                {children}
              </div>
              <button
                onClick={() => removeNotification(id)}
                className="btn btn-circle btn-xs btn-outline text-white"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
