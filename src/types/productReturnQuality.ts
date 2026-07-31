export type ProductQualityRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface ProductReturnQualitySummary {
  totalProducts: number;
  monitoredProducts: number;

  totalReturns: number;
  totalRefundAmount: number;

  qcPassedCount: number;
  qcFailedCount: number;
  qcPendingCount: number;

  damagedInventoryCount: number;
  damagedInventoryValue: number;

  lowRiskProducts: number;
  mediumRiskProducts: number;
  highRiskProducts: number;
  criticalRiskProducts: number;

  productsWithRepeatedReasons: number;
  productsWithHighRefundValue: number;
  productsWithQcFailures: number;
  productsWithDamagedInventory: number;
}

export interface ProductReturnReasonMetric {
  reason: string;
  count: number;
  refundAmount: number;
}

export interface ProductReturnQualityRow {
  productId: string;
  productName: string;
  brand?: string;
  category?: string;

  sellerId?: string;
  sellerName?: string;

  totalReturns: number;
  activeReturns: number;
  completedReturns: number;
  rejectedReturns: number;
  cancelledReturns: number;

  totalRefundAmount: number;
  averageRefundAmount: number;
  highValueReturnCount: number;

  qcPassedCount: number;
  qcFailedCount: number;
  qcPendingCount: number;

  damagedInventoryCount: number;
  damagedInventoryValue: number;

  repeatedReasons: string[];
  topReturnReason?: string;
  lastReturnAt?: string;

  riskScore: number;
  riskLevel: ProductQualityRiskLevel;
  qualitySignals: string[];
}

export interface ProductReturnQualityDashboardData {
  summary: ProductReturnQualitySummary;
  rows: ProductReturnQualityRow[];
  reasonMetrics: ProductReturnReasonMetric[];
}