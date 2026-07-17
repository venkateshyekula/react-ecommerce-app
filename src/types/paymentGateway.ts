import type { PaymentGatewayStatus } from "./payment";

export interface PaymentGatewayCallback {
  id: string;
  callbackId: string;
  paymentId: string;
  checkoutReferenceId?: string;
  gatewayStatus: PaymentGatewayStatus;
  gatewayReferenceId?: string | null;
  gatewayMessage: string;
  failureReason?: string | null;
  forceOrderFailure?: boolean;
  receivedAt: string;
  processedAt?: string | null;
  processed: boolean;
}

export interface CreatePaymentGatewayCallbackPayload {
  paymentId: string;
  checkoutReferenceId?: string;
  gatewayStatus: PaymentGatewayStatus;
  gatewayReferenceId?: string | null;
  gatewayMessage: string;
  failureReason?: string | null;
  forceOrderFailure?: boolean;
}

export interface ProcessPaymentGatewayCallbackResult {
  callback: PaymentGatewayCallback;
}