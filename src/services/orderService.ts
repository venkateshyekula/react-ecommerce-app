import { apiClient } from "./apiClient";
import type {
  CreateOrderPayload,
  Order,
  OrderStatus
} from "../types/order";
import { buildTrackingStepsByStatus } from "../utils/orderUtils";

const ORDERS_ENDPOINT = "/orders";

export const orderService = {
  getOrders: async (): Promise<Order[]> => {
    return apiClient.get<Order[]>(ORDERS_ENDPOINT);
  },

  getOrdersByUserId: async (userId: string): Promise<Order[]> => {
    return apiClient.get<Order[]>(
      `${ORDERS_ENDPOINT}?userId=${encodeURIComponent(userId)}`
    );
  },

  getOrderByOrderId: async (orderId: string): Promise<Order | null> => {
    const orders = await apiClient.get<Order[]>(
      `${ORDERS_ENDPOINT}?orderId=${encodeURIComponent(orderId)}`
    );

    return orders.length > 0 ? orders[0] : null;
  },

  createOrder: async (
    orderPayload: CreateOrderPayload
  ): Promise<Order> => {
    const order: Order = {
      id: `order-db-${Date.now()}`,
      ...orderPayload
    };

    return apiClient.post<Order, Order>(ORDERS_ENDPOINT, order);
  },

  updateOrderStatus: async (
    orderDbId: string,
    status: OrderStatus
  ): Promise<Order> => {
    return apiClient.patch<
      Order,
      Pick<Order, "orderStatus" | "trackingSteps">
    >(`${ORDERS_ENDPOINT}/${orderDbId}`, {
      orderStatus: status,
      trackingSteps: buildTrackingStepsByStatus(status)
    });
  }
};