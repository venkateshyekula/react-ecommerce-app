import type { OrderItem } from "./order";
import type { RefundStatus } from "./refund";

export type ReturnRequestStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "PICKUP_SCHEDULED"
  | "PICKED_UP"
  | "PICKUP_COMPLETED"
  | "RECEIVED_AT_WAREHOUSE"
  | "QUALITY_CHECK_PENDING"
  | "QUALITY_CHECK_PASSED"
  | "QUALITY_CHECK_FAILED"
  | "REFUND_INITIATED"
  | "REFUNDED"
  | "REFUND_COMPLETED"
  | "CANCELLED"
  | "CLOSED";

export type ReturnPickupStatus =
  | "NOT_SCHEDULED"
  | "SCHEDULED"
  | "OUT_FOR_PICKUP"
  | "PICKED_UP"
  | "FAILED_ATTEMPT"
  | "CANCELLED";

export type ReturnQualityCheckStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "PASSED"
  | "FAILED";

export type ReturnRefundPreference =
  | "ORIGINAL_PAYMENT_MODE"
  | "WALLET"
  | "MANUAL_BANK_TRANSFER";

export type ReturnStatusFilter = "ALL" | ReturnRequestStatus;

  export interface ReturnRequest {
  id: string;
  requestId: string;
  returnRequestId?: string;
  orderId: string;
  orderDbId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  requestedAt: string;
  createdAt?: string;
  updatedAt?: string;
  reason: string;
  returnReason?: string;
  comments?: string;
  customerComment?: string | null;
  status: ReturnRequestStatus;
  pickupStatus?: ReturnPickupStatus;
  qualityCheckStatus?: ReturnQualityCheckStatus;
  refundStatus?: RefundStatus;
  refundId?: string | null;
  refundAmount?: number;
  refundPreference?: ReturnRefundPreference;
  pickupAddress?: string;
  pickupDate?: string | null;
  pickupSlot?: string | null;
  items: OrderItem[];
  adminRemarks?: string | null;
  qualityCheckRemarks?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  pickupScheduledAt?: string | null;
  pickedUpAt?: string | null;
  pickupCompletedAt?: string | null;
  receivedAtWarehouseAt?: string | null;
  qualityCheckedAt?: string | null;
  refundInitiatedAt?: string | null;
  refundedAt?: string | null;
  refundCompletedAt?: string | null;
  cancelledAt?: string | null;
  pickupPartnerId?: string | null;
pickupPartnerName?: string | null;
pickupPartnerPhone?: string | null;
pickupAttemptCount?: number;
lastPickupAttemptId?: string | null;
nextPickupAttemptAt?: string | null;
}

export interface CreateReturnRequestPayload {
  requestId: string;
  returnRequestId?: string;
  orderId: string;
  orderDbId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  requestedAt: string;
  createdAt?: string;
  updatedAt?: string;
  reason: string;
  returnReason?: string;
  comments?: string;
  customerComment?: string | null;
  status: ReturnRequestStatus;
  pickupStatus?: ReturnPickupStatus;
  qualityCheckStatus?: ReturnQualityCheckStatus;
  refundStatus?: RefundStatus;
  refundId?: string | null;
  refundAmount?: number;
  refundPreference?: ReturnRefundPreference;
  pickupAddress?: string;
  pickupDate?: string | null;
  pickupSlot?: string | null;
  items: OrderItem[];
  adminRemarks?: string | null;
  qualityCheckRemarks?: string | null;
}

export interface UpdateReturnRequestPayload {
  status?: ReturnRequestStatus;
  pickupStatus?: ReturnPickupStatus;
  qualityCheckStatus?: ReturnQualityCheckStatus;
  refundStatus?: RefundStatus;
  refundId?: string | null;
  refundAmount?: number;
  refundPreference?: ReturnRefundPreference;
  pickupDate?: string | null;
  pickupSlot?: string | null;
  adminRemarks?: string | null;
  qualityCheckRemarks?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  pickupScheduledAt?: string | null;
  pickedUpAt?: string | null;
  pickupCompletedAt?: string | null;
  receivedAtWarehouseAt?: string | null;
  qualityCheckedAt?: string | null;
  refundInitiatedAt?: string | null;
  refundedAt?: string | null;
  refundCompletedAt?: string | null;
  cancelledAt?: string | null;
  updatedAt?: string;
  pickupPartnerId?: string | null;
pickupPartnerName?: string | null;
pickupPartnerPhone?: string | null;
pickupAttemptCount?: number;
lastPickupAttemptId?: string | null;
nextPickupAttemptAt?: string | null;
}