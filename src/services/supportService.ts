import { apiClient } from "./apiClient";
import type { Order, OrderStatus } from "../types/order";
import type {
  CreateSupportTicketPayload,
  SupportTicket,
  SupportTicketStatus,
  UpdateSupportTicketPayload
} from "../types/support";
import {
  buildTrackingEventsByStatus,
  buildTrackingStepsByStatus
} from "../utils/orderUtils";

const ORDERS_ENDPOINT = "/orders";
const SUPPORT_TICKETS_ENDPOINT = "/supportTickets";

const generateTicketNumber = (): string => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `TKT-${datePart}-${randomPart}`;
};

export const supportService = {
  getOrders: async (): Promise<Order[]> => {
    return apiClient.get<Order[]>(ORDERS_ENDPOINT);
  },

  getOrderByOrderId: async (orderId: string): Promise<Order | null> => {
    const orders = await apiClient.get<Order[]>(
      `${ORDERS_ENDPOINT}?orderId=${encodeURIComponent(orderId)}`
    );

    return orders.length > 0 ? orders[0] : null;
  },

  updateOrderStatus: async (
    order: Order,
    status: OrderStatus
  ): Promise<Order> => {
    return apiClient.patch<
      Order,
      Pick<Order, "orderStatus" | "trackingSteps" | "trackingEvents">
    >(`${ORDERS_ENDPOINT}/${order.id}`, {
      orderStatus: status,
      trackingSteps: buildTrackingStepsByStatus(status),
      trackingEvents: buildTrackingEventsByStatus(
        status,
        order.trackingEvents
      )
    });
  },

  approveReturn: async (order: Order): Promise<Order> => {
    return apiClient.patch<
      Order,
      Pick<Order, "orderStatus" | "trackingSteps" | "trackingEvents">
    >(`${ORDERS_ENDPOINT}/${order.id}`, {
      orderStatus: "Returned",
      trackingSteps: buildTrackingStepsByStatus("Returned"),
      trackingEvents: buildTrackingEventsByStatus(
        "Returned",
        order.trackingEvents
      )
    });
  },

  getTickets: async (): Promise<SupportTicket[]> => {
    return apiClient.get<SupportTicket[]>(SUPPORT_TICKETS_ENDPOINT);
  },

  createTicket: async (
    payload: CreateSupportTicketPayload
  ): Promise<SupportTicket> => {
    const now = new Date().toISOString();

    const ticket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      ticketNumber: generateTicketNumber(),
      createdAt: now,
      updatedAt: now,
      ...payload
    };

    return apiClient.post<SupportTicket, SupportTicket>(
      SUPPORT_TICKETS_ENDPOINT,
      ticket
    );
  },

  updateTicket: async (
    ticketId: string,
    payload: UpdateSupportTicketPayload
  ): Promise<SupportTicket> => {
    return apiClient.patch<SupportTicket, UpdateSupportTicketPayload>(
      `${SUPPORT_TICKETS_ENDPOINT}/${ticketId}`,
      {
        ...payload,
        updatedAt: new Date().toISOString()
      }
    );
  },

  closeTicket: async (ticketId: string): Promise<SupportTicket> => {
    return supportService.updateTicket(ticketId, {
      status: "CLOSED"
    });
  },

  getTicketStatusCount: (tickets: SupportTicket[], status: SupportTicketStatus) => {
    return tickets.filter((ticket) => ticket.status === status).length;
  }
};