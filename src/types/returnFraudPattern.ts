export type ReturnFraudRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ReturnFraudPatternType =
  | "REPEAT_CUSTOMER_RETURNS"
  | "HIGH_REFUND_VALUE"
  | "SAME_PRODUCT_REPEATED"
  | "SAME_REASON_REPEATED"
  | "SELLER_LINKED_PATTERN"
  | "LOCATION_CLUSTER"
  | "FAST_RETURN_AFTER_DELIVERY"
  | "QC_FAILURE_CLUSTER"
  | "MULTIPLE_REFUND_MODES";

export type ReturnFraudInvestigationStatus =
  | "AUTO_FLAGGED"
  | "UNDER_REVIEW"
  | "ACTION_REQUIRED"
  | "ESCALATED"
  | "CLEARED";

export interface ReturnFraudPatternRecord {
  id: string;

  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;

  sellerId?: string;
  sellerName?: string;
  storeName?: string;

  productId?: string;
  productName?: string;
  category?: string;

  orderIds: string[];
  returnIds: string[];

  totalOrders: number;
  totalReturns: number;
  totalRefundAmount: number;

  returnFrequencyScore: number;
  refundValueScore: number;
  reasonPatternScore: number;
  sellerPatternScore: number;
  productPatternScore: number;
  locationPatternScore: number;
  qcFailureScore: number;
  fastReturnScore: number;

  fraudScore: number;
  riskLevel: ReturnFraudRiskLevel;
  investigationStatus: ReturnFraudInvestigationStatus;

  patternTypes: ReturnFraudPatternType[];

  mostCommonReturnReason: string;
  mostReturnedProduct?: string;
  mostLinkedSeller?: string;
  locationCluster?: string;

  firstReturnDate?: string;
  lastReturnDate?: string;
  lastUpdatedAt: string;

  riskReasons: string[];
  recommendedActions: string[];
}

export interface ReturnFraudPatternSummary {
  totalFlaggedPatterns: number;
  lowRiskPatterns: number;
  mediumRiskPatterns: number;
  highRiskPatterns: number;
  criticalRiskPatterns: number;
  totalRefundExposure: number;
  customersUnderReview: number;
  sellersLinkedToPatterns: number;
  productsLinkedToPatterns: number;
  averageFraudScore: number;
}

export interface ReturnFraudPatternFilters {
  searchText: string;
  riskLevel: "ALL" | ReturnFraudRiskLevel;
  investigationStatus: "ALL" | ReturnFraudInvestigationStatus;
  patternType: "ALL" | ReturnFraudPatternType;
  minFraudScore: string;
  maxFraudScore: string;
}

export interface ReturnFraudPatternResponse {
  records: ReturnFraudPatternRecord[];
  summary: ReturnFraudPatternSummary;
}

export const returnFraudPatternTypeLabels: Record<
  ReturnFraudPatternType,
  string
> = {
  REPEAT_CUSTOMER_RETURNS: "Repeat Customer Returns",
  HIGH_REFUND_VALUE: "High Refund Value",
  SAME_PRODUCT_REPEATED: "Same Product Repeated",
  SAME_REASON_REPEATED: "Same Reason Repeated",
  SELLER_LINKED_PATTERN: "Seller Linked Pattern",
  LOCATION_CLUSTER: "Location Cluster",
  FAST_RETURN_AFTER_DELIVERY: "Fast Return After Delivery",
  QC_FAILURE_CLUSTER: "QC Failure Cluster",
  MULTIPLE_REFUND_MODES: "Multiple Refund Modes",
};