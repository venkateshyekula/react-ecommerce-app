import type {
  CheckoutPaymentSession,
  CheckoutPaymentSessionStatus,
  CreateCheckoutPaymentSessionPayload
} from "../types/checkoutPayment";

export const generateCheckoutSessionDbId = (): string => {
  return `checkout-session-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

export const generateCheckoutReferenceId = (): string => {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");

  return `checkout-${datePart}-${Date.now()}`;
};

export const createCheckoutPaymentSessionPayload = (
  payload: CreateCheckoutPaymentSessionPayload
): CheckoutPaymentSession => {
  const now = new Date().toISOString();

  return {
    id: generateCheckoutSessionDbId(),
    checkoutReferenceId: payload.checkoutReferenceId,
    paymentId: payload.paymentId,
    userId: payload.userId,
    status: "PAYMENT_INITIATED",
    checkoutSnapshot: payload.checkoutSnapshot,
    createdAt: now,
    updatedAt: now,
    orderId: null,
    errorMessage: null
  };
};

export const isOnlinePaymentMethod = (
  paymentMethod: string,
  payableAmount: number
): boolean => {
  if (payableAmount <= 0) {
    return false;
  }

  return paymentMethod !== "Cash on Delivery" && paymentMethod !== "COD";
};

export const getCheckoutSessionStatusLabel = (
  status: CheckoutPaymentSessionStatus
): string => {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};