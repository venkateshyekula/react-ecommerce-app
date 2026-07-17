export type PaymentTransactionStatus =
  | "INITIATED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REFUND_REQUIRED"
  | "REFUND_INITIATED"
  | "REFUNDED";

export type PaymentGatewayStatus =
  | "CREATED"
  | "PENDING_GATEWAY_CONFIRMATION"
  | "CAPTURED"
  | "FAILED"
  | "TIMEOUT"
  | "REFUND_REQUESTED"
  | "REFUND_PROCESSED";

export type PaymentIssueFlag =
  | "ORDER_NOT_CREATED"
  | "DUPLICATE_DEBIT"
  | "REFUND_PENDING"
  | null;

export type PaymentRefundStatus =
  | "NOT_REQUIRED"
  | "PENDING_REVIEW"
  | "INITIATED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  userId: string;
  orderId?: string | null;
  checkoutReferenceId?: string;
  amount: number;
  paymentMethod: string;
  status: PaymentTransactionStatus;
  gatewayReferenceId?: string;
  gatewayStatus?: PaymentGatewayStatus;
  issueFlag?: PaymentIssueFlag;
  refundStatus?: PaymentRefundStatus;
  refundId?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
}