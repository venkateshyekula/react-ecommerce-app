import type {
  ReturnPickupStatus,
  ReturnQualityCheckStatus,
  ReturnRequestStatus,
} from "../../types/returnRequest";
import {
  getPickupStatusBadgeClass,
  getQualityCheckBadgeClass,
  getReturnStatusBadgeClass,
} from "../../utils/returnWorkflowUtils";

export type ReturnRefundStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "PENDING_REVIEW"
  | "INITIATED"
  | "PROCESSING"
  | "QUEUED"
  | "COMPLETED"
  | "SETTLED"
  | "REFUNDED"
  | "FAILED"
  | "REJECTED"
  | "MANUAL_REVIEW"
  | "CANCELLED"
  | (string & {});

export type ReturnStatusBadgeProps =
  | {
      type: "RETURN";
      status: ReturnRequestStatus;
    }
  | {
      type: "PICKUP";
      status: ReturnPickupStatus;
    }
  | {
      type: "QC";
      status: ReturnQualityCheckStatus;
    }
  | {
      type: "REFUND";
      status?: ReturnRefundStatus | null;
    };

const formatStatusLabel = (status?: string | null): string => {
  if (!status) {
    return "-";
  }

  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getRefundStatusBadgeClass = (
  status?: ReturnRefundStatus | null,
): string => {
  switch (status) {
    case "COMPLETED":
    case "SETTLED":
    case "REFUNDED":
      return "text-bg-success";

    case "PROCESSING":
    case "INITIATED":
      return "text-bg-info";

    case "PENDING":
    case "PENDING_REVIEW":
    case "QUEUED":
      return "text-bg-primary";

    case "FAILED":
    case "REJECTED":
      return "text-bg-danger";

    case "MANUAL_REVIEW":
      return "text-bg-warning";

    case "CANCELLED":
      return "text-bg-secondary";

    case "NOT_STARTED":
    default:
      return "text-bg-light border";
  }
};

const ReturnStatusBadge = (props: ReturnStatusBadgeProps) => {
  const getBadgeClass = (): string => {
    switch (props.type) {
      case "RETURN":
        return getReturnStatusBadgeClass(props.status);

      case "PICKUP":
        return getPickupStatusBadgeClass(props.status);

      case "QC":
        return getQualityCheckBadgeClass(props.status);

      case "REFUND":
        return getRefundStatusBadgeClass(props.status);
    }
  };

  return (
    <span className={`badge ${getBadgeClass()}`}>
      {formatStatusLabel(props.status)}
    </span>
  );
};

export default ReturnStatusBadge;