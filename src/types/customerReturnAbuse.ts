export type CustomerAbuseRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface CustomerReturnAbuseSummary {
  totalCustomers: number;
  monitoredCustomers: number;

  totalReturns: number;
  totalRefundAmount: number;

  lowRiskCustomers: number;
  mediumRiskCustomers: number;
  highRiskCustomers: number;
  criticalRiskCustomers: number;

  customersWithRepeatedReasons: number;
  customersWithHighRefundValue: number;
  customersWithFailedPickupPattern: number;
  customersWithRejectedProofs: number;
  customersWithQcFailures: number;
}

export interface CustomerReturnAbuseReasonMetric {
  reason: string;
  count: number;
  refundAmount: number;
}

export interface CustomerReturnAbuseRow {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;

  totalReturns: number;
  activeReturns: number;
  completedReturns: number;
  rejectedReturns: number;
  cancelledReturns: number;

  totalRefundAmount: number;
  averageRefundAmount: number;
  highValueReturnCount: number;

  failedPickupAttempts: number;
  qcFailedCount: number;
  rejectedProofCount: number;

  repeatedReasons: string[];
  topReturnReason?: string;
  lastReturnAt?: string;

  riskScore: number;
  riskLevel: CustomerAbuseRiskLevel;
  riskSignals: string[];
}

export interface CustomerReturnAbuseDashboardData {
  summary: CustomerReturnAbuseSummary;
  rows: CustomerReturnAbuseRow[];
  reasonMetrics: CustomerReturnAbuseReasonMetric[];
}