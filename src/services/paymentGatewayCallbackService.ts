import { apiClient } from "./apiClient";
import type {
  CreatePaymentGatewayCallbackPayload,
  PaymentGatewayCallback
} from "../types/paymentGateway";

const PAYMENT_GATEWAY_CALLBACKS_ENDPOINT = "/paymentGatewayCallbacks";

const generateGatewayCallbackDbId = (): string => {
  return `gateway-callback-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const generateGatewayCallbackId = (): string => {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");

  return `GW-CB-${datePart}-${Date.now()}`;
};

const sortByLatest = (
  callbacks: PaymentGatewayCallback[]
): PaymentGatewayCallback[] => {
  return [...callbacks].sort(
    (firstCallback, secondCallback) =>
      new Date(secondCallback.receivedAt).getTime() -
      new Date(firstCallback.receivedAt).getTime()
  );
};

export const paymentGatewayCallbackService = {
  getCallbacks: async (): Promise<PaymentGatewayCallback[]> => {
    const callbacks = await apiClient.get<PaymentGatewayCallback[]>(
      PAYMENT_GATEWAY_CALLBACKS_ENDPOINT
    );

    return sortByLatest(callbacks);
  },

  getCallbacksByPaymentId: async (
    paymentId: string
  ): Promise<PaymentGatewayCallback[]> => {
    const callbacks = await apiClient.get<PaymentGatewayCallback[]>(
      `${PAYMENT_GATEWAY_CALLBACKS_ENDPOINT}?paymentId=${encodeURIComponent(
        paymentId
      )}`
    );

    return sortByLatest(callbacks);
  },

  createCallback: async (
    payload: CreatePaymentGatewayCallbackPayload
  ): Promise<PaymentGatewayCallback> => {
    const now = new Date().toISOString();

    const callback: PaymentGatewayCallback = {
      id: generateGatewayCallbackDbId(),
      callbackId: generateGatewayCallbackId(),
      paymentId: payload.paymentId,
      checkoutReferenceId: payload.checkoutReferenceId,
      gatewayStatus: payload.gatewayStatus,
      gatewayReferenceId: payload.gatewayReferenceId ?? null,
      gatewayMessage: payload.gatewayMessage,
      failureReason: payload.failureReason ?? null,
      forceOrderFailure: payload.forceOrderFailure ?? false,
      receivedAt: now,
      processedAt: null,
      processed: false
    };

    return apiClient.post<PaymentGatewayCallback, PaymentGatewayCallback>(
      PAYMENT_GATEWAY_CALLBACKS_ENDPOINT,
      callback
    );
  },

  markCallbackProcessed: async (
    callbackDbId: string
  ): Promise<PaymentGatewayCallback> => {
    return apiClient.patch<PaymentGatewayCallback, Partial<PaymentGatewayCallback>>(
      `${PAYMENT_GATEWAY_CALLBACKS_ENDPOINT}/${encodeURIComponent(
        callbackDbId
      )}`,
      {
        processed: true,
        processedAt: new Date().toISOString()
      }
    );
  }
};