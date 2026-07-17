import {
  useCallback,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type {
  ToastContextValue,
  ToastMessage,
  ToastVariant
} from "../types/toast";
import { ToastContext } from "./ToastContextObject";

interface ToastProviderProps {
  children: ReactNode;
}

const TOAST_DURATION = 3500;
const TOAST_EXIT_DURATION = 300;

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Array<ToastMessage & { isLeaving?: boolean }>>([]);

  const removeToast = useCallback((toastId: string): void => {
    setToasts((previousToasts) =>
      previousToasts.map((toast) =>
        toast.id === toastId ? { ...toast, isLeaving: true } : toast
      )
    );

    window.setTimeout(() => {
      setToasts((previousToasts) =>
        previousToasts.filter((toast) => toast.id !== toastId)
      );
    }, TOAST_EXIT_DURATION);
  }, []);

  const showToast = useCallback(
    (
      title: string,
      message?: string,
      variant: ToastVariant = "info"
    ): void => {
      const toastId = `toast-${Date.now()}`;

      const toast: ToastMessage = {
        id: toastId,
        title,
        message,
        variant
      };

      setToasts((previousToasts) => [toast, ...previousToasts]);

      window.setTimeout(() => {
        removeToast(toastId);
      }, TOAST_DURATION);
    },
    [removeToast]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      showToast,
      removeToast
    }),
    [toasts, showToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};