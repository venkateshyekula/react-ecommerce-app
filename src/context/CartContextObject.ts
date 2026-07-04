import { createContext } from "react";
import type { CartContextValue } from "../types/cart";

export const CartContext = createContext<CartContextValue | undefined>(
  undefined
);