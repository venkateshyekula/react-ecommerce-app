import { createContext } from "react";
import type { ToastContextValue } from "../types/toast";

export const ToastContext = createContext<ToastContextValue | undefined>(
  undefined
);