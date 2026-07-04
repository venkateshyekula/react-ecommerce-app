import { apiClient } from "./apiClient";
import type { Order } from "../types/order";
import type { Product } from "../types/product";

const PRODUCTS_ENDPOINT = "/products";
const ORDERS_ENDPOINT = "/orders";

export type SellerProductPayload = Omit<
  Product,
  "id" | "sellerId" | "sellerName"
>;

export interface SellerDashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

export const sellerService = {
  getSellerProducts: async (sellerId: string): Promise<Product[]> => {
    return apiClient.get<Product[]>(
      `${PRODUCTS_ENDPOINT}?sellerId=${encodeURIComponent(sellerId)}`
    );
  },

  createSellerProduct: async (
    sellerId: string,
    sellerName: string,
    payload: SellerProductPayload
  ): Promise<Product> => {
    const product: Product = {
      id: `prod-${Date.now()}`,
      sellerId,
      sellerName,
      ...payload
    };

    return apiClient.post<Product, Product>(PRODUCTS_ENDPOINT, product);
  },

  updateSellerProduct: async (
    productId: string,
    sellerId: string,
    payload: Partial<SellerProductPayload>
  ): Promise<Product> => {
    const existingProduct = await apiClient.get<Product>(
      `${PRODUCTS_ENDPOINT}/${productId}`
    );

    if (existingProduct.sellerId !== sellerId) {
      throw new Error("You are not allowed to update this product.");
    }

    return apiClient.patch<Product, Partial<SellerProductPayload>>(
      `${PRODUCTS_ENDPOINT}/${productId}`,
      payload
    );
  },

  deleteSellerProduct: async (
    productId: string,
    sellerId: string
  ): Promise<void> => {
    const existingProduct = await apiClient.get<Product>(
      `${PRODUCTS_ENDPOINT}/${productId}`
    );

    if (existingProduct.sellerId !== sellerId) {
      throw new Error("You are not allowed to delete this product.");
    }

    await apiClient.delete<void>(`${PRODUCTS_ENDPOINT}/${productId}`);
  },

  getSellerOrders: async (sellerId: string): Promise<Order[]> => {
    const [sellerProducts, allOrders] = await Promise.all([
      sellerService.getSellerProducts(sellerId),
      apiClient.get<Order[]>(ORDERS_ENDPOINT)
    ]);

    const sellerProductIds = new Set(
      sellerProducts.map((product) => product.id)
    );

    return allOrders.filter((order) =>
      order.items.some((item) => sellerProductIds.has(item.productId))
    );
  },

  getSellerDashboardStats: async (
    sellerId: string
  ): Promise<SellerDashboardStats> => {
    const [products, orders] = await Promise.all([
      sellerService.getSellerProducts(sellerId),
      sellerService.getSellerOrders(sellerId)
    ]);

    const sellerProductIds = new Set(products.map((product) => product.id));

    const totalRevenue = orders.reduce((sum, order) => {
      const sellerOrderTotal = order.items.reduce((itemSum, item) => {
        if (!sellerProductIds.has(item.productId)) {
          return itemSum;
        }

        return itemSum + item.subtotal;
      }, 0);

      return sum + sellerOrderTotal;
    }, 0);

    const lowStockProducts = products.filter(
      (product) => product.stock > 0 && product.stock < 10
    );

    const outOfStockProducts = products.filter(
      (product) => product.stock <= 0
    );

    const recentOrders = [...orders]
      .sort(
        (firstOrder, secondOrder) =>
          new Date(secondOrder.orderDate).getTime() -
          new Date(firstOrder.orderDate).getTime()
      )
      .slice(0, 5);

    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      recentOrders,
      lowStockProducts
    };
  }
};