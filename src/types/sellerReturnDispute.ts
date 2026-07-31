export type SellerReturnDisputeStatus =
  | "PENDING_REVIEW"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_MORE_EVIDENCE"
  | "CANCELLED";

export type SellerReturnDisputePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type SellerReturnDisputeReason =
  | "WRONG_ITEM_RETURNED"
  | "SERIAL_NUMBER_MISMATCH"
  | "PRODUCT_DAMAGED_BY_CUSTOMER"
  | "MISSING_ACCESSORY"
  | "PACKAGING_MISSING"
  | "USED_PRODUCT_RETURNED"
  | "FAKE_PRODUCT_RETURNED"
  | "DIFFERENT_VARIANT_RETURNED"
  | "OTHER";

export type SellerReturnDisputeActivityRole =
  | "SELLER"
  | "ADMIN"
  | "SYSTEM";

export interface SellerReturnDisputeEvidence {
  id: string;
  fileName: string;
  fileUrl?: string;
  fileType?: string;
  uploadedAt: string;
}

export interface SellerReturnDisputeActivity {
  id: string;
  label: string;
  description: string;
  createdAt: string;
  createdByRole: SellerReturnDisputeActivityRole;
  createdByName?: string;
}

export interface SellerReturnDispute {
  id: string;
  disputeId: string;

  returnRequestId: string;
  returnRequestDbId: string;
  orderId: string;

  sellerId: string;
  sellerName: string;

  productId: string;
  productName: string;

  disputeReason: SellerReturnDisputeReason;
  disputeDescription: string;
  priority: SellerReturnDisputePriority;
  status: SellerReturnDisputeStatus;

  qcStatus?: string;
  qcRemarks?: string;

  sellerEvidence?: SellerReturnDisputeEvidence[];

  sellerAdditionalRemarks?: string;
  sellerRespondedAt?: string;
  sellerResponseCount?: number;

  adminDecision?: "SELLER_APPROVED" | "SELLER_REJECTED" | "MORE_EVIDENCE";
  adminRemarks?: string;
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewedAt?: string;

  activities?: SellerReturnDisputeActivity[];

  createdAt: string;
  updatedAt: string;
}

export interface CreateSellerReturnDisputePayload {
  returnRequestId: string;
  returnRequestDbId: string;
  orderId: string;

  sellerId: string;
  sellerName: string;

  productId: string;
  productName: string;

  disputeReason: SellerReturnDisputeReason;
  disputeDescription: string;
  priority: SellerReturnDisputePriority;

  qcStatus?: string;
  qcRemarks?: string;
  sellerEvidence?: SellerReturnDisputeEvidence[];
}

export interface UpdateSellerReturnDisputePayload {
  status?: SellerReturnDisputeStatus;
  priority?: SellerReturnDisputePriority;
  disputeDescription?: string;
  sellerEvidence?: SellerReturnDisputeEvidence[];

  sellerAdditionalRemarks?: string;
  sellerRespondedAt?: string;
  sellerResponseCount?: number;

  adminDecision?: "SELLER_APPROVED" | "SELLER_REJECTED" | "MORE_EVIDENCE";
  adminRemarks?: string;
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewedAt?: string;

  activities?: SellerReturnDisputeActivity[];

  updatedAt?: string;
}