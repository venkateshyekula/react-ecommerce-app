import { apiClient } from "./apiClient";
import { orderService } from "./orderService";
import { productService } from "./productService";
import type { User } from "../types/auth";
import type { Order } from "../types/order";
import type { Product, ProductCategory } from "../types/product";

interface MonthlySalesMetric {
  month: string;
  revenue: number;
  orders: number;
}

interface CategoryRevenueMetric {
  category: ProductCategory;
  revenue: number;
  quantity: number;
}

interface TopSellingProductMetric {
  productId: string;
  name: string;
  brand: string;
  category: ProductCategory | "Unknown";
  image: string;
  quantitySold: number;
  revenue: number;
}

interface TopCustomerMetric {
  userId: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
}

interface InventoryMetric {
  totalProducts: number;
  totalStockUnits: number;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
}

export interface AdminAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  activeCustomers: number;
  averageOrderValue: number;
  monthlySales: MonthlySalesMetric[];
  categoryRevenue: CategoryRevenueMetric[];
  topSellingProducts: TopSellingProductMetric[];
  topCustomers: TopCustomerMetric[];
  inventory: InventoryMetric;
}

const USERS_ENDPOINT = "/users";

const getMonthLabel = (dateValue: string): string => {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric"
  }).format(date);
};

const getSafeOrderRevenue = (order: Order): number => {
  if (
    order.orderStatus === "Cancelled" ||
    order.orderStatus === "Returned"
  ) {
    return 0;
  }

  return order.totalAmount;
};

export const analyticsService = {
  getAdminAnalytics: async (): Promise<AdminAnalytics> => {
    const [products, orders, users] = await Promise.all([
      productService.getProducts(),
      orderService.getOrders(),
      apiClient.get<User[]>(USERS_ENDPOINT)
    ]);

    const customerUsers = users.filter((user) => user.role === "CUSTOMER");

    const productMap = new Map<string, Product>(
      products.map((product) => [product.id, product])
    );

    const validOrders = orders.filter(
      (order) =>
        order.orderStatus !== "Cancelled" &&
        order.orderStatus !== "Returned"
    );

    const totalRevenue = validOrders.reduce(
      (sum, order) => sum + getSafeOrderRevenue(order),
      0
    );

    const totalOrders = orders.length;

    const activeCustomerIds = new Set(validOrders.map((order) => order.userId));

    const averageOrderValue =
      validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

    const monthlyMap = new Map<string, MonthlySalesMetric>();

    validOrders.forEach((order) => {
      const month = getMonthLabel(order.orderDate);
      const existingMetric = monthlyMap.get(month);

      if (existingMetric) {
        existingMetric.revenue += order.totalAmount;
        existingMetric.orders += 1;
        return;
      }

      monthlyMap.set(month, {
        month,
        revenue: order.totalAmount,
        orders: 1
      });
    });

    const monthlySales = Array.from(monthlyMap.values());

    const productSalesMap = new Map<string, TopSellingProductMetric>();
    const categoryRevenueMap = new Map<ProductCategory, CategoryRevenueMetric>();

    validOrders.forEach((order) => {
      order.items.forEach((item) => {
        const product = productMap.get(item.productId);
        const category = product?.category ?? "Unknown";
        const itemRevenue = item.subtotal;
        const existingProductMetric = productSalesMap.get(item.productId);

        if (existingProductMetric) {
          existingProductMetric.quantitySold += item.quantity;
          existingProductMetric.revenue += itemRevenue;
        } else {
          productSalesMap.set(item.productId, {
            productId: item.productId,
            name: item.name,
            brand: item.brand,
            category,
            image: item.image,
            quantitySold: item.quantity,
            revenue: itemRevenue
          });
        }

        if (category !== "Unknown") {
          const existingCategoryMetric = categoryRevenueMap.get(category);

          if (existingCategoryMetric) {
            existingCategoryMetric.revenue += itemRevenue;
            existingCategoryMetric.quantity += item.quantity;
          } else {
            categoryRevenueMap.set(category, {
              category,
              revenue: itemRevenue,
              quantity: item.quantity
            });
          }
        }
      });
    });

    const topSellingProducts = Array.from(productSalesMap.values())
      .sort(
        (firstProduct, secondProduct) =>
          secondProduct.quantitySold - firstProduct.quantitySold
      )
      .slice(0, 8);

    const categoryRevenue = Array.from(categoryRevenueMap.values()).sort(
      (firstCategory, secondCategory) =>
        secondCategory.revenue - firstCategory.revenue
    );

    const customerSpendMap = new Map<string, TopCustomerMetric>();

    validOrders.forEach((order) => {
      const user = users.find((existingUser) => existingUser.id === order.userId);

      if (!user) {
        return;
      }

      const existingCustomerMetric = customerSpendMap.get(user.id);

      if (existingCustomerMetric) {
        existingCustomerMetric.totalOrders += 1;
        existingCustomerMetric.totalSpent += order.totalAmount;
      } else {
        customerSpendMap.set(user.id, {
          userId: user.id,
          name: user.name,
          email: user.email,
          totalOrders: 1,
          totalSpent: order.totalAmount
        });
      }
    });

    const topCustomers = Array.from(customerSpendMap.values())
      .sort(
        (firstCustomer, secondCustomer) =>
          secondCustomer.totalSpent - firstCustomer.totalSpent
      )
      .slice(0, 8);

    const lowStockProducts = products.filter(
      (product) => product.stock > 0 && product.stock < 10
    );

    const outOfStockProducts = products.filter((product) => product.stock <= 0);

    const totalStockUnits = products.reduce(
      (sum, product) => sum + product.stock,
      0
    );

    return {
      totalRevenue,
      totalOrders,
      totalCustomers: customerUsers.length,
      activeCustomers: activeCustomerIds.size,
      averageOrderValue,
      monthlySales,
      categoryRevenue,
      topSellingProducts,
      topCustomers,
      inventory: {
        totalProducts: products.length,
        totalStockUnits,
        lowStockProducts,
        outOfStockProducts
      }
    };
  }
};