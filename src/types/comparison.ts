import type { Product } from "./product";

export interface ComparisonContextValue {
  compareItems: Product[];
  compareCount: number;
  isInCompare: (productId: string) => boolean;
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  toggleCompare: (product: Product) => void;
  clearCompare: () => void;
}