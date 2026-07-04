import { orderService } from "./orderService";
import { productService } from "./productService";
import type { Order } from "../types/order";
import type { Product } from "../types/product";

export interface AdminDashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

export const adminService = {
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const [products, orders] = await Promise.all([
      productService.getProducts(),
      orderService.getOrders()
    ]);

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

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