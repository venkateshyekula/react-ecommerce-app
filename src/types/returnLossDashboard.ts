export type ReturnLossSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ReturnLossDashboardSummary {
  totalReturns: number;
  totalReturnedValue: number;
  totalRefundedAmount: number;
  totalRestockedValue: number;
  totalOpenBoxValue: number;
  totalDamagedLoss: number;
  totalDisputedValue: number;
  approvedSellerDisputeValue: number;
  rejectedSellerDisputeValue: number;
  pendingSellerDisputeValue: number;
  estimatedNetLoss: number;
  recoveryValue: number;
  lossSeverity: ReturnLossSeverity;
}

export interface SellerLiabilitySummary {
  sellerId: string;
  sellerName: string;
  totalReturns: number;
  totalReturnedItems: number;
  totalReturnedValue: number;
  totalDisputes: number;
  pendingDisputes: number;
  approvedDisputes: number;
  rejectedDisputes: number;
  restockedValue: number;
  openBoxValue: number;
  damagedLoss: number;
  estimatedSellerLiability: number;
  riskScore: number;
  riskLevel: ReturnLossSeverity;
}

export interface ReturnLossBreakdownItem {
  label: string;
  value: number;
  formattedValue: string;
  description: string;
  type: "VALUE" | "COUNT" | "PERCENT";
}

export interface ReturnLossDashboardData {
  summary: ReturnLossDashboardSummary;
  sellerSummaries: SellerLiabilitySummary[];
  breakdown: ReturnLossBreakdownItem[];
}