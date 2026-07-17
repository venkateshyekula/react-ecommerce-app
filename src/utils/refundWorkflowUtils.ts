import type { RefundRequest, RefundStatus } from "../types/refund";

export const refundStatusOptions: Array<{
  value: RefundStatus;
  label: string;
}> = [
  {
    value: "PENDING_REVIEW",
    label: "Pending Review"
  },
  {
    value: "INITIATED",
    label: "Initiated"
  },
  {
    value: "PROCESSING",
    label: "Processing"
  },
  {
    value: "COMPLETED",
    label: "Completed"
  },
  {
    value: "FAILED",
    label: "Failed"
  },
  {
    value: "CANCELLED",
    label: "Cancelled"
  }
];

export const formatRefundStatusLabel = (status: string): string => {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const getRefundStatusBadgeClass = (status: RefundStatus): string => {
  switch (status) {
    case "PENDING_REVIEW":
    case "PENDING":
      return "text-bg-warning";

    case "INITIATED":
      return "text-bg-info";

    case "PROCESSING":
      return "text-bg-primary";

    case "COMPLETED":
      return "text-bg-success";

    case "FAILED":
      return "text-bg-danger";

    case "CANCELLED":
      return "text-bg-secondary";

    default:
      return "text-bg-light";
  }
};

export const canStartRefund = (refund: RefundRequest): boolean => {
  return refund.status === "PENDING_REVIEW" || refund.status === "PENDING";
};

export const canMarkRefundProcessing = (refund: RefundRequest): boolean => {
  return refund.status === "INITIATED";
};

export const canCompleteRefund = (refund: RefundRequest): boolean => {
  return refund.status === "PROCESSING";
};

export const canFailRefund = (refund: RefundRequest): boolean => {
  return ["PENDING_REVIEW", "PENDING", "INITIATED", "PROCESSING"].includes(
    refund.status
  );
};

export const isRefundReadOnly = (refund: RefundRequest): boolean => {
  return ["COMPLETED", "FAILED", "CANCELLED"].includes(refund.status);
};

export const buildGatewayRefundReference = (refundId: string): string => {
  return `GATEWAY-RFND-${refundId}-${Date.now()}`;
};