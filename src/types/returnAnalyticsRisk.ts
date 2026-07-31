export type ReturnAnalyticsRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface ReturnAnalyticsSummary {
  totalReturns: number;
  activeReturns: number;
  completedReturns: number;
  rejectedReturns: number;

  totalRefundValue: number;
  pendingRefundValue: number;
  completedRefundValue: number;

  qcPassedCount: number;
  qcFailedCount: number;
  qcPendingCount: number;

  pickupPendingCount: number;
  pickupCompletedCount: number;
  pickupFailedCount: number;

  sellerDisputesCount: number;
  approvedSellerDisputesCount: number;
  rejectedSellerDisputesCount: number;

  highRiskCustomers: number;
  highRiskProducts: number;
  highRiskSellers: number;
}

export interface CustomerReturnRiskRow {
  userId: string;
  customerName: string;
  customerEmail?: string;

  totalReturns: number;
  activeReturns: number;
  completedReturns: number;
  rejectedReturns: number;

  totalRefundValue: number;
  failedQcCount: number;
  repeatedReasons: string[];

  riskScore: number;
  riskLevel: ReturnAnalyticsRiskLevel;
}

export interface ProductReturnRiskRow {
  productId: string;
  productName: string;
  brand?: string;
  category?: string;

  sellerId?: string;
  sellerName?: string;

  totalReturns: number;
  totalRefundValue: number;
  qcFailedCount: number;
  qcPassedCount: number;
  damagedCount: number;

  mostCommonReason?: string;

  riskScore: number;
  riskLevel: ReturnAnalyticsRiskLevel;
}

export interface SellerReturnRiskRow {
  sellerId: string;
  sellerName: string;

  totalReturns: number;
  totalRefundValue: number;
  qcFailedCount: number;
  qcPassedCount: number;

  disputesRaised: number;
  disputesApproved: number;
  disputesRejected: number;

  damagedInventoryValue: number;

  riskScore: number;
  riskLevel: ReturnAnalyticsRiskLevel;
}

export interface ReturnReasonTrendRow {
  reason: string;
  count: number;
  refundValue: number;
}

export interface ReturnAnalyticsDashboardData {
  summary: ReturnAnalyticsSummary;
  customerRiskRows: CustomerReturnRiskRow[];
  productRiskRows: ProductReturnRiskRow[];
  sellerRiskRows: SellerReturnRiskRow[];
  reasonTrends: ReturnReasonTrendRow[];
}