import type {
  CustomerSupportTicket,
  SupportTicketCategory
} from "../types/customerSupport";

export type ReturnSupportTicketPrefill = {
  category: SupportTicketCategory;
  orderId: string;
  returnRequestId: string;
  issueType: string;
  subject: string;
  message: string;
};

export const getReturnSupportPrefillFromSearchParams = (
  searchParams: URLSearchParams
): ReturnSupportTicketPrefill => {
  const orderId = searchParams.get("orderId")?.trim() ?? "";
  const returnRequestId = searchParams.get("returnRequestId")?.trim() ?? "";
  const issueType = searchParams.get("issueType")?.trim() ?? "";

  const subject =
    searchParams.get("subject")?.trim() ??
    (orderId
      ? `Return / Refund issue for order ${orderId}`
      : "Return / Refund issue");

  // Directly set default category for return support requests
  const category: SupportTicketCategory = "RETURN_REFUND";

  const messageLines =
    issueType === "RAISE_RETURN_ISSUE"
      ? [
          "I need help with my return request.",
          "",
          orderId ? `Order ID: ${orderId}` : "",
          returnRequestId ? `Return Request ID: ${returnRequestId}` : "",
          "",
          "Issue details:"
        ]
      : [
          "I need support for my return/refund.",
          "",
          orderId ? `Order ID: ${orderId}` : "",
          returnRequestId ? `Return Request ID: ${returnRequestId}` : "",
          "",
          "Details:"
        ];

  const message = messageLines.filter(Boolean).join("\n");

  return {
    category,
    orderId,
    returnRequestId,
    issueType,
    subject,
    message
  };
};

export const isReturnLinkedTicket = (
  ticket: CustomerSupportTicket,
  orderId?: string,
  returnRequestId?: string
): boolean => {
  const normalizedOrderId = orderId?.trim() ?? "";
  const normalizedReturnRequestId = returnRequestId?.trim() ?? "";

  // Require at least one context parameter to be present
  if (!normalizedOrderId && !normalizedReturnRequestId) {
    return false;
  }

  const ticketReturnRequestId =
    ticket.returnRequestId ?? ticket.relatedReturnRequestId ?? "";

  const matchesOrder =
    Boolean(normalizedOrderId) && ticket.orderId === normalizedOrderId;

  const matchesReturn =
    Boolean(normalizedReturnRequestId) &&
    (ticketReturnRequestId === normalizedReturnRequestId ||
      ticket.subject.includes(normalizedReturnRequestId) ||
      ticket.message.includes(normalizedReturnRequestId));

  // If both IDs are provided, match either or both based on your requirements
  return matchesOrder || matchesReturn;
};

export const isActiveReturnSupportTicket = (
  ticket: CustomerSupportTicket
): boolean => {
  const ACTIVE_STATUSES = ["OPEN", "IN_PROGRESS", "ON_HOLD", "PENDING"];
  return ACTIVE_STATUSES.includes(ticket.status);
};