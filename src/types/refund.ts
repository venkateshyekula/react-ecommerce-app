import type { SupportEscalationTeam } from "./supportEscalation";

export type RefundStatus =
  | "PENDING"
  | "PENDING_REVIEW"
  | "INITIATED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type RefundMethod =
  | "ORIGINAL_PAYMENT"
  | "ORIGINAL_PAYMENT_MODE"
  | "WALLET"
  | "COUPON"
  | "MANUAL_BANK_TRANSFER";

export type RefundCreatedBy = "SYSTEM" | "SUPPORT" | "ADMIN";

export interface RefundRecord {
  id: string;
  refundId: string;
  orderId: string;
  orderDbId: string;
  returnRequestId: string;
  userId: string;
  amount: number;
  method: RefundMethod;
  status: RefundStatus;
  reason: string;
  initiatedAt: string;
  completedAt?: string;
  failedAt?: string;
  adminRemarks?: string;
  compensationCouponCode?: string;
  walletCreditAmount?: number;
}

export interface CreateRefundPayload {
  refundId: string;
  orderId: string;
  orderDbId: string;
  returnRequestId: string;
  userId: string;
  amount: number;
  method: RefundMethod;
  status: RefundStatus;
  reason: string;
  initiatedAt: string;
  adminRemarks?: string;
  compensationCouponCode?: string;
  walletCreditAmount?: number;
}

/**
 * Enhancement Phase 12L:
 * Payment Gateway Simulation + Callback Handling + Auto Refund Queue
 *
 * This model is used when payment is captured but order creation fails,
 * duplicate debit is detected, or refund review is required by payment/refund team.
 */
export interface RefundRequest {
  id: string;
  refundId: string;

  paymentId: string;
  orderId?: string | null;
  userId: string;
  userName?: string;

  amount: number;
  refundMode: RefundMethod;
  status: RefundStatus;
  reason: string;

  createdBy: RefundCreatedBy;
  assignedTeam: SupportEscalationTeam;

  createdAt: string;
  updatedAt: string;

  completedAt?: string | null;
  failedAt?: string | null;

  gatewayRefundReferenceId?: string | null;
  resolutionNote?: string | null;
}

export interface CreateRefundRequestPayload {
  paymentId: string;
  orderId?: string | null;
  userId: string;
  userName?: string;

  amount: number;
  refundMode: RefundMethod;
  reason: string;

  createdBy: RefundCreatedBy;
  assignedTeam: SupportEscalationTeam;
}

export interface UpdateRefundRequestPayload {
  status?: RefundStatus;
  refundMode?: RefundMethod;
  updatedAt?: string;

  completedAt?: string | null;
  failedAt?: string | null;

  gatewayRefundReferenceId?: string | null;
  resolutionNote?: string | null;
}