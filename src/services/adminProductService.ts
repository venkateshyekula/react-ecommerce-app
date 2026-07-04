import { apiClient } from "./apiClient";
import type { Product } from "../types/product";

const PRODUCTS_ENDPOINT = "/products";

export type ProductPayload = Omit<Product, "id">;

export const adminProductService = {
  createProduct: async (payload: ProductPayload): Promise<Product> => {
    const product: Product = {
      id: `prod-${Date.now()}`,
      ...payload
    };

    return apiClient.post<Product, Product>(PRODUCTS_ENDPOINT, product);
  },

  updateProduct: async (
    productId: string,
    payload: Partial<ProductPayload>
  ): Promise<Product> => {
    return apiClient.patch<Product, Partial<ProductPayload>>(
      `${PRODUCTS_ENDPOINT}/${productId}`,
      payload
    );
  },

  deleteProduct: async (productId: string): Promise<void> => {
    await apiClient.delete<void>(`${PRODUCTS_ENDPOINT}/${productId}`);
  }
};