import type {
  ReturnPickupStatus,
  ReturnQualityCheckStatus,
  ReturnRequest,
  ReturnRequestStatus
} from "../types/returnRequest";

export const returnReasonOptions = [
  "Size issue",
  "Wrong item delivered",
  "Damaged product",
  "Quality issue",
  "Product not as expected",
  "Missing accessory",
  "Other"
];

export const pickupSlotOptions = [
  "10 AM - 1 PM",
  "1 PM - 4 PM",
  "4 PM - 7 PM"
];

export const returnStatusOptions: Array<{
  value: ReturnRequestStatus;
  label: string;
}> = [
  {
    value: "REQUESTED",
    label: "Requested"
  },
  {
    value: "APPROVED",
    label: "Approved"
  },
  {
    value: "REJECTED",
    label: "Rejected"
  },
  {
    value: "PICKUP_SCHEDULED",
    label: "Pickup Scheduled"
  },
  {
    value: "PICKED_UP",
    label: "Picked Up"
  },
  {
    value: "RECEIVED_AT_WAREHOUSE",
    label: "Received At Warehouse"
  },
  {
    value: "QUALITY_CHECK_PENDING",
    label: "Quality Check Pending"
  },
  {
    value: "QUALITY_CHECK_PASSED",
    label: "Quality Check Passed"
  },
  {
    value: "QUALITY_CHECK_FAILED",
    label: "Quality Check Failed"
  },
  {
    value: "REFUND_INITIATED",
    label: "Refund Initiated"
  },
  {
    value: "REFUNDED",
    label: "Refunded"
  },
  {
    value: "REFUND_COMPLETED",
    label: "Refund Completed"
  },
  {
    value: "CANCELLED",
    label: "Cancelled"
  },
  {
    value: "CLOSED",
    label: "Closed"
  }
];

export const formatReturnLabel = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const getReturnStatusBadgeClass = (
  status: ReturnRequestStatus
): string => {
  switch (status) {
    case "REQUESTED":
      return "text-bg-warning";

    case "APPROVED":
    case "PICKUP_SCHEDULED":
    case "PICKED_UP":
    case "PICKUP_COMPLETED":
    case "RECEIVED_AT_WAREHOUSE":
    case "QUALITY_CHECK_PENDING":
      return "text-bg-info";

    case "QUALITY_CHECK_PASSED":
    case "REFUND_INITIATED":
      return "text-bg-primary";

    case "REFUNDED":
    case "REFUND_COMPLETED":
    case "CLOSED":
      return "text-bg-success";

    case "REJECTED":
    case "QUALITY_CHECK_FAILED":
      return "text-bg-danger";

    case "CANCELLED":
      return "text-bg-secondary";

    default:
      return "text-bg-light";
  }
};

export const getPickupStatusBadgeClass = (
  status?: ReturnPickupStatus
): string => {
  switch (status) {
    case "SCHEDULED":
    case "OUT_FOR_PICKUP":
      return "text-bg-info";

    case "PICKED_UP":
      return "text-bg-success";

    case "FAILED_ATTEMPT":
      return "text-bg-warning";

    case "CANCELLED":
      return "text-bg-secondary";

    case "NOT_SCHEDULED":
    default:
      return "text-bg-light";
  }
};

export const getQualityCheckBadgeClass = (
  status?: ReturnQualityCheckStatus
): string => {
  switch (status) {
    case "PENDING":
      return "text-bg-warning";

    case "PASSED":
      return "text-bg-success";

    case "FAILED":
      return "text-bg-danger";

    case "NOT_STARTED":
    default:
      return "text-bg-light";
  }
};

export const canApproveReturn = (request: ReturnRequest): boolean => {
  return request.status === "REQUESTED";
};

export const canRejectReturn = (request: ReturnRequest): boolean => {
  return request.status === "REQUESTED" || request.status === "APPROVED";
};

export const canSchedulePickup = (request: ReturnRequest): boolean => {
  return request.status === "APPROVED";
};

export const canMarkPickupCompleted = (request: ReturnRequest): boolean => {
  return (
    request.status === "PICKUP_SCHEDULED" ||
    request.pickupStatus === "SCHEDULED" ||
    request.pickupStatus === "OUT_FOR_PICKUP"
  );
};

export const canMarkReceivedAtWarehouse = (request: ReturnRequest): boolean => {
  return request.status === "PICKED_UP" || request.status === "PICKUP_COMPLETED";
};

export const canStartQualityCheck = (request: ReturnRequest): boolean => {
  return request.status === "RECEIVED_AT_WAREHOUSE";
};

export const canPassQualityCheck = (request: ReturnRequest): boolean => {
  return request.status === "QUALITY_CHECK_PENDING";
};

export const canFailQualityCheck = (request: ReturnRequest): boolean => {
  return request.status === "QUALITY_CHECK_PENDING";
};

export const canCancelReturn = (request: ReturnRequest): boolean => {
  return (
    request.status === "REQUESTED" ||
    request.status === "APPROVED" ||
    request.status === "PICKUP_SCHEDULED"
  );
};

export const calculateReturnRefundAmount = (
  items: Array<{ price: number; quantity: number }>
): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const generateReturnRequestId = (): string => {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");

  return `RET-${datePart}-${Date.now()}`;
};

export const generateReturnDbId = (): string => {
  return `return-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};