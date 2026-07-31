export type SellerPayoutRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SellerPayoutAdjustmentType =
  | "NO_ACTION"
  | "PAYOUT_HOLD"
  | "PAYOUT_DEDUCTION"
  | "PARTIAL_DEDUCTION"
  | "MANUAL_REVIEW"
  | "SELLER_CREDIT"
  | "PAYOUT_RELEASE";

export type SellerPayoutSettlementStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "SETTLED"
  | "REJECTED"
  | "ON_HOLD";

export type SellerPayoutSettlementAction =
  | "APPROVE_SETTLEMENT"
  | "HOLD_PAYOUT"
  | "RELEASE_PAYOUT"
  | "MARK_SETTLED"
  | "REJECT_SETTLEMENT"
  | "SEND_TO_REVIEW";

export interface SellerPayoutSettlementSummary {
  totalSellers: number;
  monitoredSellers: number;

  totalReturns: number;
  totalRefundAmount: number;
  totalSellerLiabilityAmount: number;
  totalDamagedInventoryValue: number;
  totalPayoutAdjustmentAmount: number;

  pendingSettlements: number;
  underReviewSettlements: number;
  approvedSettlements: number;
  settledSettlements: number;
  rejectedSettlements: number;
  onHoldSettlements: number;

  lowRiskSellers: number;
  mediumRiskSellers: number;
  highRiskSellers: number;
  criticalRiskSellers: number;
}

export interface SellerPayoutSettlementRow {
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  sellerPhone?: string;
  storeName?: string;

  totalReturns: number;
  completedReturns: number;
  rejectedReturns: number;
  activeReturns: number;

  totalRefundAmount: number;
  sellerLiabilityAmount: number;
  damagedInventoryCount: number;
  damagedInventoryValue: number;

  disputesRaised: number;
  disputesApproved: number;
  disputesRejected: number;
  disputesPending: number;

  payoutBaseAmount: number;
  payoutHoldAmount: number;
  payoutDeductionAmount: number;
  payoutCreditAmount: number;
  finalPayableAmount: number;

  adjustmentType: SellerPayoutAdjustmentType;
  settlementStatus: SellerPayoutSettlementStatus;

  liabilityRate: number;
  disputeApprovalRate: number;
  damageRate: number;

  riskScore: number;
  riskLevel: SellerPayoutRiskLevel;

  settlementReasons: string[];
  recommendedActions: string[];

  lastReturnAt?: string;
  lastUpdatedAt: string;
}

export interface SellerPayoutAdjustmentRecord {
  id: string;
  adjustmentId: string;
  sellerId: string;
  sellerName: string;

  adjustmentType: SellerPayoutAdjustmentType;
  settlementStatus: SellerPayoutSettlementStatus;

  payoutBaseAmount: number;
  payoutHoldAmount: number;
  payoutDeductionAmount: number;
  payoutCreditAmount: number;
  finalPayableAmount: number;

  reason: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerPayoutSettlementDashboardData {
  summary: SellerPayoutSettlementSummary;
  rows: SellerPayoutSettlementRow[];
  adjustmentRecords: SellerPayoutAdjustmentRecord[];
}

export interface SellerPayoutSettlementActionPayload {
  sellerId: string;
  sellerName: string;
  action: SellerPayoutSettlementAction;
  reason: string;
  payoutBaseAmount: number;
  payoutHoldAmount: number;
  payoutDeductionAmount: number;
  payoutCreditAmount: number;
  finalPayableAmount: number;
}