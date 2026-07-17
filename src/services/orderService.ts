import { apiClient } from "./apiClient";
import type {
  CreateOrderPayload,
  Order,
  OrderStatus
} from "../types/order";
import {
  buildTrackingEventsByStatus,
  buildTrackingStepsByStatus
} from "../utils/orderUtils";

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

  updateOrder: async (
    orderDbId: string,
    data: Partial<Order>
  ): Promise<Order> => {
    return apiClient.patch<Order, Partial<Order>>(
      `${ORDERS_ENDPOINT}/${orderDbId}`,
      data
    );
  },

  updateOrderStatus: async (
    orderDbId: string,
    status: OrderStatus
  ): Promise<Order> => {
    const existingOrder = await apiClient.get<Order>(
      `${ORDERS_ENDPOINT}/${orderDbId}`
    );

    return apiClient.patch<
      Order,
      Pick<Order, "orderStatus" | "trackingSteps" | "trackingEvents">
    >(`${ORDERS_ENDPOINT}/${orderDbId}`, {
      orderStatus: status,
      trackingSteps: buildTrackingStepsByStatus(status),
      trackingEvents: buildTrackingEventsByStatus(
        status,
        existingOrder.trackingEvents
      )
    });
  },

  cancelOrder: async (
  orderDbId: string,
  reason: string
): Promise<Order> => {
  const existingOrder = await apiClient.get<Order>(
    `${ORDERS_ENDPOINT}/${orderDbId}`
  );

  return apiClient.patch<
    Order,
    Pick<
      Order,
      | "orderStatus"
      | "fulfillmentStatus"
      | "trackingSteps"
      | "trackingEvents"
      | "cancelledAt"
      | "cancellationReason"
    >
  >(`${ORDERS_ENDPOINT}/${orderDbId}`, {
    orderStatus: "Cancelled",
    fulfillmentStatus: "FAILED",
    trackingSteps: buildTrackingStepsByStatus("Cancelled"),
    trackingEvents: buildTrackingEventsByStatus(
      "Cancelled",
      existingOrder.trackingEvents
    ),
    cancelledAt: new Date().toISOString(),
    cancellationReason: reason
  });
},

  requestReturn: async (
    orderDbId: string,
    reason: string
  ): Promise<Order> => {
    const existingOrder = await apiClient.get<Order>(
      `${ORDERS_ENDPOINT}/${orderDbId}`
    );

    return apiClient.patch<
      Order,
      Pick<
        Order,
        | "orderStatus"
        | "trackingSteps"
        | "trackingEvents"
        | "returnRequestedAt"
        | "returnReason"
      >
    >(`${ORDERS_ENDPOINT}/${orderDbId}`, {
      orderStatus: "Return Requested",
      trackingSteps: buildTrackingStepsByStatus("Return Requested"),
      trackingEvents: buildTrackingEventsByStatus(
        "Return Requested",
        existingOrder.trackingEvents
      ),
      returnRequestedAt: new Date().toISOString(),
      returnReason: reason
    });
  }
};