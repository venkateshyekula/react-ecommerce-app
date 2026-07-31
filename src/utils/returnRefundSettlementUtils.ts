import type { ReturnRequest } from "../types/returnRequest";
import type {
  ReturnRefundSettlementMode,
  ReturnRefundSettlementStatus,
} from "../types/returnRefundSettlement";

export const returnRefundSettlementModeOptions: Array<{
  value: ReturnRefundSettlementMode;
  label: string;
  description: string;
}> = [
  {
    value: "ORIGINAL_PAYMENT_MODE",
    label: "Original Payment Mode",
    description: "Refund back to the original source payment method.",
  },
  {
    value: "WALLET",
    label: "ShopEase Wallet",
    description: "Issue instant wallet credit to the customer account.",
  },
  {
    value: "COUPON",
    label: "Compensation Coupon",
    description: "Generate a refund coupon for future purchase.",
  },
  {
    value: "MIXED",
    label: "Wallet + Coupon",
    description: "Split compensation between wallet credit and coupon.",
  },
];

export const generateReturnSettlementDbId = (): string => {
  return `return-settlement-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

export const generateReturnSettlementId = (): string => {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  return `RSET-${datePart}-${Date.now()}`;
};

export const generateWalletTransactionId = (): string => {
  return `WLT-RET-${Date.now()}`;
};

export const generateReturnCouponCode = (): string => {
  return `RET${Date.now().toString().slice(-8)}`;
};

export const formatSettlementLabel = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const getSettlementStatusBadgeClass = (
  status: ReturnRefundSettlementStatus,
): string => {
  switch (status) {
    case "SETTLED":
      return "text-bg-success";

    case "PROCESSING":
      return "text-bg-info";

    case "QUEUED":
      return "text-bg-primary";

    case "FAILED":
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

export const isReturnEligibleForRefundSettlement = (
  request: ReturnRequest,
): boolean => {
  return (
    request.qualityCheckStatus === "PASSED" ||
    request.status === "REFUND_INITIATED" ||
    request.refundStatus === "PENDING" ||
    request.refundStatus === "INITIATED" ||
    request.refundStatus === "PENDING_REVIEW"
  );
};

export const getReturnRefundAmount = (request: ReturnRequest): number => {
  if (
    request.refundAmount !== undefined &&
    request.refundAmount !== null &&
    Number.isFinite(request.refundAmount)
  ) {
    return request.refundAmount;
  }

  return request.items.reduce((total, item) => {
    const itemPrice = Number.isFinite(item.price) ? item.price : 0;
    const itemQuantity = Number.isFinite(item.quantity) ? item.quantity : 0;

    return total + itemPrice * itemQuantity;
  }, 0);
};

export const getSettlementAmountSplit = ({
  amount,
  mode,
}: {
  amount: number;
  mode: ReturnRefundSettlementMode;
}): {
  settlementAmount: number;
  walletCreditAmount: number;
  couponAmount: number;
} => {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;

  if (mode === "WALLET") {
    return {
      settlementAmount: safeAmount,
      walletCreditAmount: safeAmount,
      couponAmount: 0,
    };
  }

  if (mode === "COUPON") {
    return {
      settlementAmount: safeAmount,
      walletCreditAmount: 0,
      couponAmount: safeAmount,
    };
  }

  if (mode === "MIXED") {
    const walletCreditAmount = Number(
      (Math.round(safeAmount * 70) / 100).toFixed(2),
    );
    const couponAmount = Number(
      (safeAmount - walletCreditAmount).toFixed(2),
    );

    return {
      settlementAmount: safeAmount,
      walletCreditAmount,
      couponAmount,
    };
  }

  return {
    settlementAmount: safeAmount,
    walletCreditAmount: 0,
    couponAmount: 0,
  };
};