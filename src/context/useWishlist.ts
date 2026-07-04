import { useContext } from "react";
import { WishlistContext } from "./WishlistContextObject";
import type { WishlistContextValue } from "../types/wishlist";

export const useWishlist = (): WishlistContextValue => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider.");
  }

  return context;
};