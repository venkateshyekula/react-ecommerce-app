export type ToastVariant = "success" | "danger" | "warning" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (
    title: string,
    message?: string,
    variant?: ToastVariant
  ) => void;
  removeToast: (toastId: string) => void;
}