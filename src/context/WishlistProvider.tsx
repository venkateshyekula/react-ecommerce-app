import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../types/product";
import type { WishlistContextValue } from "../types/wishlist";
import {
  getFromStorage,
  setToStorage,
  STORAGE_KEYS
} from "../utils/storage";
import { WishlistContext } from "./WishlistContextObject";

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider = ({ children }: WishlistProviderProps) => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>(() => {
    return getFromStorage<Product[]>(STORAGE_KEYS.WISHLIST_ITEMS, []);
  });

  const persistWishlist = useCallback((items: Product[]): void => {
    setWishlistItems(items);
    setToStorage<Product[]>(STORAGE_KEYS.WISHLIST_ITEMS, items);
  }, []);

  const isInWishlist = useCallback(
    (productId: string): boolean => {
      return wishlistItems.some((item) => item.id === productId);
    },
    [wishlistItems]
  );

  const addToWishlist = useCallback(
    (product: Product): void => {
      if (isInWishlist(product.id)) {
        return;
      }

      persistWishlist([...wishlistItems, product]);
    },
    [isInWishlist, persistWishlist, wishlistItems]
  );

  const removeFromWishlist = useCallback(
    (productId: string): void => {
      persistWishlist(
        wishlistItems.filter((item) => item.id !== productId)
      );
    },
    [persistWishlist, wishlistItems]
  );

  const toggleWishlist = useCallback(
    (product: Product): void => {
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id);
        return;
      }

      addToWishlist(product);
    },
    [addToWishlist, isInWishlist, removeFromWishlist]
  );

  const clearWishlist = useCallback((): void => {
    persistWishlist([]);
  }, [persistWishlist]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      wishlistItems,
      wishlistCount: wishlistItems.length,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist
    }),
    [
      wishlistItems,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};