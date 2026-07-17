import type { CustomerSupportTicket } from "../types/customerSupport";
import type { CreateNotificationPayload } from "../types/notification";

const formatStatus = (status: string): string => {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const createCustomerSupportReplyNotification = (
  ticket: CustomerSupportTicket
): CreateNotificationPayload => {
  return {
    userId: ticket.userId,
    title: "Support replied to your ticket",
    message: `Support replied to ticket ${ticket.ticketId}.`,
    type: "INFO",
    category: "SUPPORT",
    link: "/support-tickets",
    route: "/support-tickets",
    referenceId: ticket.id,
    entityId: ticket.id,
    entityType: "SUPPORT_TICKET",
    metadata: {
      ticketId: ticket.ticketId,
      status: ticket.status
    }
  };
};

export const createCustomerTicketStatusNotification = (
  ticket: CustomerSupportTicket
): CreateNotificationPayload => {
  return {
    userId: ticket.userId,
    title: "Support ticket status updated",
    message: `Ticket ${ticket.ticketId} is now ${formatStatus(ticket.status)}.`,
    type:
      ticket.status === "RESOLVED"
        ? "SUCCESS"
        : ticket.status === "ON_HOLD"
          ? "WARNING"
          : ticket.status === "CLOSED"
            ? "INFO"
            : "INFO",
    category: "SUPPORT",
    link: "/support-tickets",
    route: "/support-tickets",
    referenceId: ticket.id,
    entityId: ticket.id,
    entityType: "SUPPORT_TICKET",
    metadata: {
      ticketId: ticket.ticketId,
      status: ticket.status
    }
  };
};

export const createSupportTeamCustomerReplyNotification = (
  ticket: CustomerSupportTicket
): CreateNotificationPayload => {
  return {
    audienceRole: "SUPPORT",
    title: "Customer replied to a support ticket",
    message: `${ticket.userName} replied to ticket ${ticket.ticketId}.`,
    type: ticket.priority === "URGENT" ? "DANGER" : "INFO",
    category: "SUPPORT",
    link: "/support/tickets",
    route: "/support/tickets",
    referenceId: ticket.id,
    entityId: ticket.id,
    entityType: "SUPPORT_TICKET",
    metadata: {
      ticketId: ticket.ticketId,
      customerName: ticket.userName,
      priority: ticket.priority,
      status: ticket.status
    }
  };
};

export const createSupportTeamNewTicketNotification = (
  ticket: CustomerSupportTicket
): CreateNotificationPayload => {
  return {
    audienceRole: "SUPPORT",
    title:
      ticket.priority === "URGENT"
        ? "Urgent support ticket created"
        : "New support ticket created",
    message: `${ticket.userName} created ticket ${ticket.ticketId}.`,
    type: ticket.priority === "URGENT" ? "DANGER" : "INFO",
    category: "SUPPORT",
    link: "/support/tickets",
    route: "/support/tickets",
    referenceId: ticket.id,
    entityId: ticket.id,
    entityType: "SUPPORT_TICKET",
    metadata: {
      ticketId: ticket.ticketId,
      customerName: ticket.userName,
      priority: ticket.priority,
      status: ticket.status
    }
  };
};