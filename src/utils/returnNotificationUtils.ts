import type { ReturnRequest } from "../types/returnRequest";

export type ReturnNotificationEventType =
  | "RETURN_REQUESTED"
  | "RETURN_APPROVED"
  | "RETURN_REJECTED"
  | "PICKUP_ASSIGNED"
  | "PICKUP_OUT_FOR_PICKUP"
  | "PICKUP_FAILED"
  | "PICKUP_COMPLETED"
  | "WAREHOUSE_RECEIVED"
  | "QC_STARTED"
  | "QC_PASSED"
  | "QC_FAILED"
  | "REFUND_INITIATED"
  | "REFUND_COMPLETED"
  | "RETURN_CANCELLED"
  | "RETURN_CLOSED"
  | "RETURN_SUPPORT_TICKET_CREATED"
  | "RETURN_SUPPORT_REPLY"
  | "RETURN_SUPPORT_STATUS_UPDATED";

export type ReturnNotificationSeverity =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "DANGER";

export interface ReturnNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: "RETURN";
  eventType: ReturnNotificationEventType;
  severity: ReturnNotificationSeverity;
  route?: string;
  orderId?: string;
  returnRequestId?: string;
  referenceId?: string;
  isRead?: boolean;
  createdAt?: string;
}

const getReturnDisplayId = (request: ReturnRequest): string => {
  return request.returnRequestId ?? request.requestId ?? request.id ?? "";
};

const getReturnOrderId = (request: ReturnRequest): string => {
  return request.orderId;
};

const getReturnCustomerId = (request: ReturnRequest): string => {
  return request.userId;
};

const formatLabel = (value?: string): string => {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatCurrency = (amount?: number | null): string => {
  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    return "";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

const buildReturnRoute = (request: ReturnRequest): string => {
  const params = new URLSearchParams();

  params.set("orderId", getReturnOrderId(request));
  params.set("returnRequestId", getReturnDisplayId(request));

  return `/my-returns?${params.toString()}`;
};

const buildSupportTicketsRoute = ({
  orderId,
  returnRequestId,
  ticketId
}: {
  orderId?: string;
  returnRequestId?: string;
  ticketId?: string;
}): string => {
  const params = new URLSearchParams();

  if (orderId) {
    params.set("orderId", orderId);
  }

  if (returnRequestId) {
    params.set("returnRequestId", returnRequestId);
  }

  if (ticketId) {
    params.set("ticketId", ticketId);
  }

  return params.toString()
    ? `/support-tickets?${params.toString()}`
    : "/support-tickets";
};

const createBaseReturnNotification = ({
  request,
  title,
  message,
  eventType,
  severity,
  route,
  referenceId
}: {
  request: ReturnRequest;
  title: string;
  message: string;
  eventType: ReturnNotificationEventType;
  severity: ReturnNotificationSeverity;
  route?: string;
  referenceId?: string;
}): ReturnNotificationPayload => {
  return {
    userId: getReturnCustomerId(request),
    title,
    message,
    type: "RETURN",
    eventType,
    severity,
    route: route ?? buildReturnRoute(request),
    orderId: getReturnOrderId(request),
    returnRequestId: getReturnDisplayId(request),
    referenceId: referenceId ?? getReturnDisplayId(request),
    isRead: false,
    createdAt: new Date().toISOString()
  };
};

export const createReturnRequestedNotification = (
  request: ReturnRequest
): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Return request submitted",
    message: `Your return request ${getReturnDisplayId(
      request
    )} for order ${getReturnOrderId(request)} has been submitted.`,
    eventType: "RETURN_REQUESTED",
    severity: "INFO"
  });
};

export const createReturnApprovedNotification = (
  request: ReturnRequest
): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Return request approved",
    message: `Your return request ${getReturnDisplayId(
      request
    )} has been approved. Pickup will be scheduled soon.`,
    eventType: "RETURN_APPROVED",
    severity: "SUCCESS"
  });
};

export const createReturnRejectedNotification = (
  request: ReturnRequest
): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Return request rejected",
    message: `Your return request ${getReturnDisplayId(
      request
    )} could not be approved. Please contact support if you need help.`,
    eventType: "RETURN_REJECTED",
    severity: "DANGER"
  });
};

export const createPickupAssignedNotification = (
  request: ReturnRequest
): ReturnNotificationPayload => {
  const partnerName = request.pickupPartnerName ?? "pickup partner";
  const pickupSlot = request.pickupSlot ? ` during ${request.pickupSlot}` : "";

  return createBaseReturnNotification({
    request,
    title: "Return pickup assigned",
    message: `${partnerName} has been assigned for your return pickup${pickupSlot}.`,
    eventType: "PICKUP_ASSIGNED",
    severity: "INFO"
  });
};

export const createPickupOutForPickupNotification = (
  request: ReturnRequest
): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Pickup agent is on the way",
    message: `Your pickup agent is on the way for return ${getReturnDisplayId(
      request
    )}.`,
    eventType: "PICKUP_OUT_FOR_PICKUP",
    severity: "INFO"
  });
};

export const createPickupFailedNotification = (
  request: ReturnRequest,
  reason?: string
): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Return pickup attempt failed",
    message:
      reason ??
      `Pickup attempt for return ${getReturnDisplayId(
        request
      )} could not be completed. Please check pickup details.`,
    eventType: "PICKUP_FAILED",
    severity: "WARNING"
  });
};

export const createPickupCompletedNotification = (
  request: ReturnRequest
): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Return package picked up",
    message: `Your return package for order ${getReturnOrderId(
      request
    )} has been picked up successfully.`,
    eventType: "PICKUP_COMPLETED",
    severity: "SUCCESS"
  });
};

export const createWarehouseReceivedNotification = (
  request: ReturnRequest
): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Return received at warehouse",
    message: `Your returned item has reached the warehouse. Quality check will start soon.`,
    eventType: "WAREHOUSE_RECEIVED",
    severity: "INFO"
  });
};

export const createQcStartedNotification = (
  request: ReturnRequest
): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Quality check started",
    message: `Warehouse quality check has started for return ${getReturnDisplayId(
      request
    )}.`,
    eventType: "QC_STARTED",
    severity: "INFO"
  });
};

export const createQcPassedNotification = (
  request: ReturnRequest
): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Quality check passed",
    message: `Your returned item passed quality check. Refund processing will begin soon.`,
    eventType: "QC_PASSED",
    severity: "SUCCESS"
  });
};

export const createQcFailedNotification = (
  request: ReturnRequest
): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Quality check failed",
    message: `Your returned item did not pass quality check. Please contact support for more details.`,
    eventType: "QC_FAILED",
    severity: "DANGER"
  });
};

export const createRefundInitiatedNotification = (
  request: ReturnRequest
): ReturnNotificationPayload => {
  const refundAmount = formatCurrency(request.refundAmount);

  return createBaseReturnNotification({
    request,
    title: "Refund initiated",
    message: refundAmount
      ? `Refund of ${refundAmount} has been initiated for your return.`
      : "Refund has been initiated for your return.",
    eventType: "REFUND_INITIATED",
    severity: "INFO"
  });
};

export const createRefundCompletedNotification = (
  request: ReturnRequest
): ReturnNotificationPayload => {
  const refundAmount = formatCurrency(request.refundAmount);
  const refundId = request.refundId ? ` Reference ID: ${request.refundId}.` : "";

  return createBaseReturnNotification({
    request,
    title: "Refund completed",
    message: refundAmount
      ? `Refund of ${refundAmount} has been completed.${refundId}`
      : `Your return refund has been completed.${refundId}`,
    eventType: "REFUND_COMPLETED",
    severity: "SUCCESS"
  });
};

export const createReturnCancelledNotification = (
  request: ReturnRequest
): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Return request cancelled",
    message: `Your return request ${getReturnDisplayId(
      request
    )} has been cancelled.`,
    eventType: "RETURN_CANCELLED",
    severity: "WARNING"
  });
};

export const createReturnClosedNotification = (
  request: ReturnRequest
): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Return case closed",
    message: `Your return case ${getReturnDisplayId(
      request
    )} has been closed.`,
    eventType: "RETURN_CLOSED",
    severity: "INFO"
  });
};

export const createReturnSupportTicketCreatedNotification = ({
  request,
  ticketId
}: {
  request: ReturnRequest;
  ticketId: string;
}): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Support ticket created",
    message: `Support ticket ${ticketId} has been created for your return.`,
    eventType: "RETURN_SUPPORT_TICKET_CREATED",
    severity: "INFO",
    route: buildSupportTicketsRoute({
      orderId: request.orderId,
      returnRequestId: getReturnDisplayId(request),
      ticketId
    }),
    referenceId: ticketId
  });
};

export const createReturnSupportReplyNotification = ({
  request,
  ticketId
}: {
  request: ReturnRequest;
  ticketId: string;
}): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Support replied to your return ticket",
    message: `Support has replied to ticket ${ticketId}. You can continue the conversation from My Support Tickets.`,
    eventType: "RETURN_SUPPORT_REPLY",
    severity: "INFO",
    route: buildSupportTicketsRoute({
      orderId: request.orderId,
      returnRequestId: getReturnDisplayId(request),
      ticketId
    }),
    referenceId: ticketId
  });
};

export const createReturnSupportStatusUpdatedNotification = ({
  request,
  ticketId,
  status
}: {
  request: ReturnRequest;
  ticketId: string;
  status: string;
}): ReturnNotificationPayload => {
  return createBaseReturnNotification({
    request,
    title: "Return support ticket updated",
    message: `Support ticket ${ticketId} status changed to ${formatLabel(
      status
    )}.`,
    eventType: "RETURN_SUPPORT_STATUS_UPDATED",
    severity: "INFO",
    route: buildSupportTicketsRoute({
      orderId: request.orderId,
      returnRequestId: getReturnDisplayId(request),
      ticketId
    }),
    referenceId: ticketId
  });
};