export type ReturnRefundSettlementStatus =
  | "NOT_STARTED"
  | "QUEUED"
  | "PROCESSING"
  | "SETTLED"
  | "FAILED"
  | "MANUAL_REVIEW"
  | "CANCELLED";

export type ReturnRefundSettlementMode =
  | "ORIGINAL_PAYMENT_MODE"
  | "WALLET"
  | "COUPON"
  | "MIXED";

export type ReturnRefundFailureReason =
  | "PAYMENT_GATEWAY_FAILURE"
  | "BANK_REVERSAL_FAILED"
  | "WALLET_CREDIT_FAILED"
  | "COUPON_GENERATION_FAILED"
  | "CUSTOMER_ACCOUNT_MISMATCH"
  | "MANUAL_REVIEW_REQUIRED"
  | "PROCESSING_ERROR"
  | "OTHER";

export interface ReturnRefundSettlement {
  id: string;
  settlementId: string;
  returnRequestDbId: string;
  returnRequestId: string;
  requestId?: string | null;
  orderId: string;
  orderDbId?: string | null;
  userId: string;
  customerName?: string | null;
  customerEmail?: string | null;

  refundAmount: number;
  settlementAmount: number;
  walletCreditAmount: number;
  couponAmount: number;

  settlementMode: ReturnRefundSettlementMode;
  settlementStatus: ReturnRefundSettlementStatus;

  gatewayReferenceId?: string | null;
  walletTransactionId?: string | null;
  couponCode?: string | null;

  failureReason?: ReturnRefundFailureReason | null;
  failureRemarks?: string | null;
  settlementRemarks?: string | null;

  queuedByUserId?: string | null;
  queuedByName?: string | null;
  queuedAt?: string | null;

  processedByUserId?: string | null;
  processedByName?: string | null;
  processedAt?: string | null;

  settledAt?: string | null;
  failedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateReturnRefundSettlementPayload {
  returnRequestDbId: string;
  returnRequestId: string;
  requestId?: string | null;
  orderId: string;
  orderDbId?: string | null;
  userId: string;
  customerName?: string | null;
  customerEmail?: string | null;
  refundAmount: number;
  settlementMode: ReturnRefundSettlementMode;
  queuedByUserId?: string | null;
  queuedByName?: string | null;
  settlementRemarks?: string | null;
}

export interface ProcessReturnRefundSettlementPayload {
  processedByUserId: string;
  processedByName: string;
  settlementRemarks?: string | null;
}

export interface FailReturnRefundSettlementPayload {
  processedByUserId: string;
  processedByName: string;
  failureReason: ReturnRefundFailureReason;
  failureRemarks: string;
}

export interface ReturnCompensationCoupon {
  id: string;
  couponCode: string;
  returnRequestId: string;
  orderId: string;
  userId: string;
  amount: number;
  reason: string;
  status: "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED";
  validFrom: string;
  validTill: string;
  createdAt: string;
  updatedAt: string;
}