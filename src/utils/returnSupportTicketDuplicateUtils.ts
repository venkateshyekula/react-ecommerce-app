import type {
  CustomerSupportTicket,
  SupportTicketIssueType,
} from "../types/customerSupport";

const activeReturnTicketStatuses = [
  "OPEN",
  "IN_PROGRESS",
  "ON_HOLD",
  "RESOLVED",
];

const supportTicketIssueTypeValues: SupportTicketIssueType[] = [
  "GENERAL",
  "RAISE_RETURN_ISSUE",
  "REFUND_DELAY",
  "QC_REJECTED",
  "PICKUP_DELAY",
  "PICKUP_FAILED",
  "RETURN_STATUS_QUERY",
  "OTHER",
];

export const isValidSupportTicketIssueType = (
  value?: string | null,
): value is SupportTicketIssueType => {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();

  // Case-insensitive match against registered issue types
  return supportTicketIssueTypeValues.some(
    (type) => type.toUpperCase() === trimmed.toUpperCase(),
  );
};

export const normalizeSupportTicketIssueType = (
  value?: string | null,
): SupportTicketIssueType | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  // Return the actual enum value preserving exact casing
  return supportTicketIssueTypeValues.find(
    (type) => type.toUpperCase() === trimmed.toUpperCase(),
  );
};

export const getTicketOptionalValue = (
  ticket: CustomerSupportTicket,
  keys: string[],
): string => {
  const source = ticket as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
};

export const getTicketReturnRequestId = (
  ticket: CustomerSupportTicket,
): string => {
  return getTicketOptionalValue(ticket, [
    "returnRequestId",
    "relatedReturnRequestId",
    "returnId",
  ]);
};

export const isActiveReturnSupportTicket = (
  ticket: CustomerSupportTicket,
): boolean => {
  return activeReturnTicketStatuses.includes(ticket.status);
};

export const isDuplicateReturnSupportTicket = ({
  ticket,
  userId,
  orderId,
  returnRequestId,
}: {
  ticket: CustomerSupportTicket;
  userId: string;
  orderId?: string;
  returnRequestId?: string;
}): boolean => {
  const normalizedOrderId = orderId?.trim() ?? "";
  const normalizedReturnRequestId = returnRequestId?.trim() ?? "";

  // Safety check: if neither ID is passed, don't flag as duplicate
  if (!normalizedOrderId && !normalizedReturnRequestId) {
    return false;
  }

  const matchesUser = ticket.userId === userId;
  const matchesCategory = ticket.category === "RETURN_REFUND";
  const matchesActiveStatus = isActiveReturnSupportTicket(ticket);

  if (!matchesUser || !matchesCategory || !matchesActiveStatus) {
    return false;
  }

  const ticketReturnRequestId = getTicketReturnRequestId(ticket);

  const matchesOrder =
    !normalizedOrderId || ticket.orderId === normalizedOrderId;

  const matchesReturn =
    !normalizedReturnRequestId ||
    ticketReturnRequestId === normalizedReturnRequestId ||
    ticket.subject.toLowerCase().includes(normalizedReturnRequestId.toLowerCase()) ||
    ticket.message.toLowerCase().includes(normalizedReturnRequestId.toLowerCase());

  return matchesOrder && matchesReturn;
};

export const buildRelatedTicketUrl = ({
  orderId,
  returnRequestId,
  ticketId,
}: {
  orderId?: string;
  returnRequestId?: string;
  ticketId?: string;
}): string => {
  const params = new URLSearchParams();

  if (orderId?.trim()) {
    params.set("orderId", orderId.trim());
  }

  if (returnRequestId?.trim()) {
    params.set("returnRequestId", returnRequestId.trim());
  }

  if (ticketId?.trim()) {
    params.set("ticketId", ticketId.trim());
  }

  const queryString = params.toString();

  return queryString ? `/support-tickets?${queryString}` : "/support-tickets";
};