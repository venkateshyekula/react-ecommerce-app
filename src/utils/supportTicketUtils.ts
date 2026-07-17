import type {
  CustomerSupportTicket,
  SupportTicketActivity,
  SupportTicketAttachment,
  SupportTicketMessage,
  SupportTicketMessageAuthorRole,
  SupportTicketStatus
} from "../types/customerSupport";

export const createSupportTicketMessage = ({
  authorId,
  authorName,
  authorRole,
  message,
  attachments = []
}: {
  authorId: string;
  authorName: string;
  authorRole: SupportTicketMessageAuthorRole;
  message: string;
  attachments?: SupportTicketAttachment[];
}): SupportTicketMessage => {
  return {
    id: `ticket-message-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    authorId,
    authorName,
    authorRole,
    message,
    attachments,
    createdAt: new Date().toISOString()
  };
};

export const createSupportTicketActivity = ({
  label,
  description,
  createdByRole
}: {
  label: string;
  description: string;
  createdByRole: SupportTicketMessageAuthorRole;
}): SupportTicketActivity => {
  return {
    id: `ticket-activity-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    label,
    description,
    createdAt: new Date().toISOString(),
    createdByRole
  };
};

export const getTicketMessages = (
  ticket: CustomerSupportTicket
): SupportTicketMessage[] => {
  const baseCustomerMessage: SupportTicketMessage = {
    id: `initial-message-${ticket.id}`,
    authorId: ticket.userId,
    authorName: ticket.userName,
    authorRole: "CUSTOMER",
    message: ticket.message,
    createdAt: ticket.createdAt
  };

  const normalizedMessages =
    ticket.messages && ticket.messages.length > 0
      ? [...ticket.messages]
      : [baseCustomerMessage];

  const hasBaseCustomerMessage = normalizedMessages.some(
    (message) =>
      message.authorRole === "CUSTOMER" &&
      message.message.trim() === ticket.message.trim()
  );

  const messagesWithBaseMessage = hasBaseCustomerMessage
    ? normalizedMessages
    : [baseCustomerMessage, ...normalizedMessages];

  const hasLegacySupportReply =
    Boolean(ticket.supportReply?.trim()) &&
    messagesWithBaseMessage.some(
      (message) =>
        message.authorRole === "SUPPORT" &&
        message.message.trim() === ticket.supportReply?.trim()
    );

  const messagesWithLegacySupportReply =
    ticket.supportReply?.trim() && !hasLegacySupportReply
      ? [
          ...messagesWithBaseMessage,
          {
            id: `legacy-support-reply-${ticket.id}`,
            authorId: ticket.assignedToSupportId ?? "support",
            authorName: ticket.assignedToSupportName ?? "Support Team",
            authorRole: "SUPPORT" as const,
            message: ticket.supportReply,
            createdAt: ticket.updatedAt
          }
        ]
      : messagesWithBaseMessage;

  return messagesWithLegacySupportReply.sort(
    (firstMessage, secondMessage) =>
      new Date(firstMessage.createdAt).getTime() -
      new Date(secondMessage.createdAt).getTime()
  );
};

export const getTicketActivities = (
  ticket: CustomerSupportTicket
): SupportTicketActivity[] => {
  const baseActivity: SupportTicketActivity = {
    id: `initial-activity-${ticket.id}`,
    label: "Ticket Created",
    description: `Ticket ${ticket.ticketId} was created.`,
    createdAt: ticket.createdAt,
    createdByRole: "CUSTOMER"
  };

  const normalizedActivities =
    ticket.activities && ticket.activities.length > 0
      ? [...ticket.activities]
      : [baseActivity];

  const hasBaseActivity = normalizedActivities.some(
    (activity) =>
      activity.label === "Ticket Created" &&
      activity.createdAt === ticket.createdAt
  );

  const activitiesWithBaseActivity = hasBaseActivity
    ? normalizedActivities
    : [baseActivity, ...normalizedActivities];

  return activitiesWithBaseActivity.sort(
    (firstActivity, secondActivity) =>
      new Date(firstActivity.createdAt).getTime() -
      new Date(secondActivity.createdAt).getTime()
  );
};

export const getNextStatusAfterCustomerReply = (
  currentStatus: SupportTicketStatus
): SupportTicketStatus => {
  if (currentStatus === "RESOLVED") {
    return "OPEN";
  }

  return currentStatus;
};

export const getNextStatusAfterSupportReply = (
  currentStatus: SupportTicketStatus
): SupportTicketStatus => {
  if (currentStatus === "OPEN") {
    return "IN_PROGRESS";
  }

  return currentStatus;
};