import { apiClient } from "./apiClient";
import type {
  Product,
  ProductCategory
} from "../types/product";
import { assertValidDeleteId } from "../utils/deleteSafetyUtils";

const PRODUCTS_ENDPOINT = "/products";

export const productService = {
  getProducts: async (): Promise<Product[]> => {
    return apiClient.get<Product[]>(PRODUCTS_ENDPOINT);
  },

  getProductById: async (id: string): Promise<Product | null> => {
    try {
      return await apiClient.get<Product>(`${PRODUCTS_ENDPOINT}/${id}`);
    } catch {
      return null;
    }
  },

  getProductsByCategory: async (
    category: ProductCategory | string
  ): Promise<Product[]> => {
    return apiClient.get<Product[]>(
      `${PRODUCTS_ENDPOINT}?category=${encodeURIComponent(category)}`
    );
  },

  deleteProduct: async (productId: string): Promise<void> => {
  assertValidDeleteId({
    entityType: "product",
    id: productId
  });

  await apiClient.delete<void>(
    `${PRODUCTS_ENDPOINT}/${encodeURIComponent(productId)}`
  );
},
};