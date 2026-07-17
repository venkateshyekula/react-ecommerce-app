import type {
  PaymentGatewayStatus,
  PaymentTransaction,
  PaymentTransactionStatus
} from "../types/payment";

export interface CreatePaymentIntentInput {
  userId: string;
  amount: number;
  paymentMethod: string;
  checkoutReferenceId: string;
}

export const generatePaymentDbId = (): string => {
  return `payment-db-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const generatePaymentId = (): string => {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");

  return `PAY-${datePart}-${Date.now()}`;
};

export const generateGatewayReferenceId = (
  paymentMethod: string
): string => {
  const prefix = paymentMethod.toUpperCase().replace(/\s+/g, "-");

  return `${prefix}-REF-${Date.now()}`;
};

export const createInitialPaymentTransaction = ({
  userId,
  amount,
  paymentMethod,
  checkoutReferenceId
}: CreatePaymentIntentInput): PaymentTransaction => {
  const now = new Date().toISOString();

  return {
    id: generatePaymentDbId(),
    paymentId: generatePaymentId(),
    userId,
    orderId: null,
    checkoutReferenceId,
    amount,
    paymentMethod,
    status: "INITIATED",
    gatewayStatus: "CREATED",
    gatewayReferenceId: generateGatewayReferenceId(paymentMethod),
    issueFlag: null,
    refundStatus: "NOT_REQUIRED",
    refundId: null,
    failureReason: null,
    createdAt: now,
    updatedAt: now
  };
};

export const mapGatewayStatusToPaymentStatus = (
  gatewayStatus: PaymentGatewayStatus
): PaymentTransactionStatus => {
  switch (gatewayStatus) {
    case "CAPTURED":
      return "SUCCESS";

    case "PENDING_GATEWAY_CONFIRMATION":
      return "PENDING";

    case "FAILED":
    case "TIMEOUT":
      return "FAILED";

    case "REFUND_PROCESSED":
      return "REFUNDED";

    case "REFUND_REQUESTED":
      return "REFUND_INITIATED";

    case "CREATED":
    default:
      return "INITIATED";
  }
};