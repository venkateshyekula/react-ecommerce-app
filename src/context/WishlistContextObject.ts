import { createContext } from "react";
import type { WishlistContextValue } from "../types/wishlist";

export const WishlistContext = createContext<
  WishlistContextValue | undefined
>(undefined);