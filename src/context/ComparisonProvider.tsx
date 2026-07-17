import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../types/product";
import type { ComparisonContextValue } from "../types/comparison";
import { ComparisonContext } from "./ComparisonContextObject";

interface ComparisonProviderProps {
  children: ReactNode;
}

const COMPARISON_STORAGE_KEY = "shopease_compare_items";
const MAX_COMPARE_ITEMS = 4;

const getStoredCompareItems = (): Product[] => {
  try {
    const storedItems = localStorage.getItem(COMPARISON_STORAGE_KEY);

    if (!storedItems) {
      return [];
    }

    return JSON.parse(storedItems) as Product[];
  } catch {
    return [];
  }
};

const saveCompareItems = (items: Product[]): void => {
  localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(items));
};

export const ComparisonProvider = ({ children }: ComparisonProviderProps) => {
  const [compareItems, setCompareItems] = useState<Product[]>(() =>
    getStoredCompareItems()
  );

  const persistCompareItems = useCallback((items: Product[]): void => {
    setCompareItems(items);
    saveCompareItems(items);
  }, []);

  const isInCompare = useCallback(
    (productId: string): boolean => {
      return compareItems.some((product) => product.id === productId);
    },
    [compareItems]
  );

  const addToCompare = useCallback(
    (product: Product): void => {
      if (isInCompare(product.id)) {
        return;
      }

      if (compareItems.length >= MAX_COMPARE_ITEMS) {
        return;
      }

      persistCompareItems([...compareItems, product]);
    },
    [compareItems, isInCompare, persistCompareItems]
  );

  const removeFromCompare = useCallback(
    (productId: string): void => {
      persistCompareItems(
        compareItems.filter((product) => product.id !== productId)
      );
    },
    [compareItems, persistCompareItems]
  );

  const toggleCompare = useCallback(
    (product: Product): void => {
      if (isInCompare(product.id)) {
        removeFromCompare(product.id);
        return;
      }

      addToCompare(product);
    },
    [addToCompare, isInCompare, removeFromCompare]
  );

  const clearCompare = useCallback((): void => {
    persistCompareItems([]);
  }, [persistCompareItems]);

  const value = useMemo<ComparisonContextValue>(
    () => ({
      compareItems,
      compareCount: compareItems.length,
      isInCompare,
      addToCompare,
      removeFromCompare,
      toggleCompare,
      clearCompare
    }),
    [
      compareItems,
      isInCompare,
      addToCompare,
      removeFromCompare,
      toggleCompare,
      clearCompare
    ]
  );

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
};