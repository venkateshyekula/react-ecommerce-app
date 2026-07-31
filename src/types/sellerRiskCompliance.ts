export type SellerComplianceRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SellerComplianceStatus =
  | "COMPLIANT"
  | "WATCHLIST"
  | "HIGH_RISK"
  | "RESTRICTED";

export interface SellerRiskComplianceSummary {
  totalSellers: number;
  monitoredSellers: number;

  totalReturns: number;
  totalRefundLiability: number;
  totalDamagedInventoryValue: number;

  totalDisputes: number;
  approvedDisputes: number;
  rejectedDisputes: number;

  qcFailedCount: number;
  qcPassedCount: number;

  lowRiskSellers: number;
  mediumRiskSellers: number;
  highRiskSellers: number;
  criticalRiskSellers: number;

  watchlistSellers: number;
  restrictedSellers: number;
}

export interface SellerRiskComplianceRow {
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  sellerPhone?: string;

  totalReturns: number;
  activeReturns: number;
  completedReturns: number;
  rejectedReturns: number;
  cancelledReturns: number;

  totalRefundAmount: number;
  averageRefundAmount: number;
  refundLiabilityAmount: number;

  qcFailedCount: number;
  qcPassedCount: number;
  qcPendingCount: number;

  damagedInventoryCount: number;
  damagedInventoryValue: number;

  disputesRaised: number;
  disputesApproved: number;
  disputesRejected: number;
  disputesPending: number;

  disputeApprovalRate: number;
  qcFailureRate: number;
  returnCompletionRate: number;

  topReturnReason?: string;
  repeatedReturnReasons: string[];

  riskScore: number;
  complianceScore: number;
  riskLevel: SellerComplianceRiskLevel;
  complianceStatus: SellerComplianceStatus;

  riskSignals: string[];
  lastReturnAt?: string;
}

export interface SellerReturnReasonMetric {
  reason: string;
  count: number;
  refundAmount: number;
}

export interface SellerRiskComplianceDashboardData {
  summary: SellerRiskComplianceSummary;
  rows: SellerRiskComplianceRow[];
  reasonMetrics: SellerReturnReasonMetric[];
}