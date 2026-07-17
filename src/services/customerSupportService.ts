import { apiClient } from "./apiClient";
import type {
  CreateCustomerSupportTicketPayload,
  CustomerSupportTicket,
  SupportTicketActivity,
  SupportTicketAttachment,
  SupportTicketMessage,
  SupportTicketStatus,
  UpdateSupportTicketPayload
} from "../types/customerSupport";
import { assertValidDeleteId } from "../utils/deleteSafetyUtils";

const SUPPORT_TICKETS_ENDPOINT = "/supportTickets";

export interface UpdateTicketOptions extends UpdateSupportTicketPayload {
  newMessage?: {
    text: string;
    authorId: string;
    authorName: string;
    authorRole: "CUSTOMER" | "SUPPORT";
    attachments?: SupportTicketAttachment[];
  };
  activityLabel?: string;
  activityDescription?: string;
}

export const customerSupportService = {
  async getTickets(): Promise<CustomerSupportTicket[]> {
    return apiClient.get<CustomerSupportTicket[]>(SUPPORT_TICKETS_ENDPOINT);
  },

  async getTicketById(id: string): Promise<CustomerSupportTicket> {
    return apiClient.get<CustomerSupportTicket>(
      `${SUPPORT_TICKETS_ENDPOINT}/${encodeURIComponent(id)}`
    );
  },

  async getTicketsByUserId(userId: string): Promise<CustomerSupportTicket[]> {
    return apiClient.get<CustomerSupportTicket[]>(
      `${SUPPORT_TICKETS_ENDPOINT}?userId=${encodeURIComponent(userId)}`
    );
  },

  async getTicketsByStatus(
    status: SupportTicketStatus
  ): Promise<CustomerSupportTicket[]> {
    return apiClient.get<CustomerSupportTicket[]>(
      `${SUPPORT_TICKETS_ENDPOINT}?status=${encodeURIComponent(status)}`
    );
  },

  async createTicket(
    payload: CreateCustomerSupportTicketPayload
  ): Promise<CustomerSupportTicket> {
    const now = new Date().toISOString();
    const timestamp = Date.now();

    const ticket: CustomerSupportTicket = {
      id: `support-ticket-db-${timestamp}`,
      ticketId: `SUP-${timestamp}`,
      ...payload,
      attachments: payload.attachments ?? [],
      status: "OPEN",
      createdAt: now,
      updatedAt: now,
      unreadForSupport: true,
      unreadForCustomer: false,
      messages: [
        {
          id: `ticket-message-${timestamp}`,
          authorId: payload.userId,
          authorName: payload.userName,
          authorRole: "CUSTOMER",
          message: payload.message,
          createdAt: now,
          attachments: payload.attachments ?? []
        }
      ],
      activities: [
        {
          id: `ticket-activity-${timestamp}`,
          label: "Ticket Created",
          description: `Ticket was created by ${payload.userName}.`,
          createdAt: now,
          createdByRole: "CUSTOMER"
        }
      ]
    };

    return apiClient.post<CustomerSupportTicket, CustomerSupportTicket>(
      SUPPORT_TICKETS_ENDPOINT,
      ticket
    );
  },

  async updateTicket(
    id: string,
    payload: UpdateTicketOptions
  ): Promise<CustomerSupportTicket> {
    const currentTicket = await this.getTicketById(id);
    const now = new Date().toISOString();
    const timestamp = Date.now();

    const updatedMessages: SupportTicketMessage[] = payload.messages
      ? [...payload.messages]
      : [...(currentTicket.messages ?? [])];

    const updatedActivities: SupportTicketActivity[] = payload.activities
      ? [...payload.activities]
      : [...(currentTicket.activities ?? [])];

    let status = payload.status ?? currentTicket.status;

    let unreadForSupport =
      payload.unreadForSupport ?? currentTicket.unreadForSupport ?? false;

    let unreadForCustomer =
      payload.unreadForCustomer ?? currentTicket.unreadForCustomer ?? false;

    if (payload.newMessage) {
      const { text, authorId, authorName, authorRole, attachments = [] } =
        payload.newMessage;

      const messageObj: SupportTicketMessage = {
        id: `ticket-message-${timestamp}`,
        authorId,
        authorName,
        authorRole,
        message: text,
        createdAt: now,
        attachments
      };

      updatedMessages.push(messageObj);

      if (authorRole === "SUPPORT") {
        unreadForCustomer = true;
        unreadForSupport = false;

        if (status === "OPEN") {
          status = "IN_PROGRESS";
        }
      }

      if (authorRole === "CUSTOMER") {
        unreadForSupport = true;
        unreadForCustomer = false;

        if (status === "RESOLVED") {
          status = "OPEN";
        }
      }
    }

    if (payload.activityLabel) {
      const activityObj: SupportTicketActivity = {
        id: `ticket-activity-${timestamp}`,
        label: payload.activityLabel,
        description: payload.activityDescription ?? "",
        createdAt: now,
        createdByRole: payload.newMessage?.authorRole ?? "SUPPORT"
      };

      updatedActivities.push(activityObj);
    } else if (
      !payload.activities &&
      payload.status &&
      payload.status !== currentTicket.status
    ) {
      const activityObj: SupportTicketActivity = {
        id: `ticket-activity-${timestamp}`,
        label: "Status Changed",
        description: `Status changed from ${currentTicket.status} to ${payload.status}.`,
        createdAt: now,
        createdByRole: payload.newMessage?.authorRole ?? "SUPPORT"
      };

      updatedActivities.push(activityObj);
    }

    const patchPayload: UpdateSupportTicketPayload = {
      status,
      supportReply: payload.supportReply,
      internalNote: payload.internalNote,
      assignedToSupportId: payload.assignedToSupportId,
      assignedToSupportName: payload.assignedToSupportName,
      resolvedAt: payload.resolvedAt,
      closedAt: payload.closedAt,
      messages: updatedMessages,
      activities: updatedActivities,
      unreadForCustomer,
      unreadForSupport,
      attachments: payload.attachments ?? currentTicket.attachments ?? [],

      slaDueAt: payload.slaDueAt,
      slaBreached: payload.slaBreached,
      escalated: payload.escalated,
      escalatedAt: payload.escalatedAt,
      escalationReason: payload.escalationReason,

      updatedAt: now
    };

    return apiClient.patch<CustomerSupportTicket, UpdateSupportTicketPayload>(
      `${SUPPORT_TICKETS_ENDPOINT}/${encodeURIComponent(id)}`,
      patchPayload
    );
  },

  deleteTicket: async (ticketId: string): Promise<void> => {
    assertValidDeleteId({
      entityType: "supportTicket",
      id: ticketId
    });

    await apiClient.delete<void>(
      `${SUPPORT_TICKETS_ENDPOINT}/${encodeURIComponent(ticketId)}`
    );
  }
};