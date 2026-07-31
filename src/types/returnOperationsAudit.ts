export type ReturnAuditSource =
  | "RETURN_REQUEST"
  | "REFUND"
  | "PICKUP_PROOF"
  | "DELIVERY_PROOF"
  | "SELLER_DISPUTE"
  | "DAMAGED_INVENTORY"
  | "AUTOMATION_RULE"
  | "SYSTEM";

export type ReturnAuditAction =
  | "CREATED"
  | "UPDATED"
  | "STATUS_CHANGED"
  | "APPROVED"
  | "REJECTED"
  | "REFUND_HOLD"
  | "REFUND_RELEASED"
  | "QC_PASSED"
  | "QC_FAILED"
  | "PICKUP_COMPLETED"
  | "PROOF_SUBMITTED"
  | "PROOF_REJECTED"
  | "DISPUTE_RAISED"
  | "DISPUTE_APPROVED"
  | "DISPUTE_REJECTED"
  | "DAMAGED_ITEM_RECORDED"
  | "RULE_CREATED"
  | "RULE_UPDATED"
  | "RULE_CLONED"
  | "RULE_DELETED"
  | "RULE_BULK_IMPORTED"
  | "EXPORT_GENERATED";

export type ReturnAuditSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ReturnAuditComplianceStatus =
  | "COMPLIANT"
  | "REVIEW_REQUIRED"
  | "NON_COMPLIANT";

export interface ReturnOperationsAuditRecord {
  id: string;
  auditId: string;

  source: ReturnAuditSource;
  action: ReturnAuditAction;
  severity: ReturnAuditSeverity;
  complianceStatus: ReturnAuditComplianceStatus;

  entityId: string;
  entityType: string;

  returnRequestId?: string;
  orderId?: string;

  customerId?: string;
  customerName?: string;
  customerEmail?: string;

  sellerId?: string;
  sellerName?: string;

  ruleId?: string;
  ruleName?: string;

  actorId?: string;
  actorName: string;
  actorRole: string;

  summary: string;
  details: string;

  beforeValue?: string;
  afterValue?: string;

  metadata?: Record<string, string | number | boolean | undefined>;

  createdAt: string;
}

export interface ReturnOperationsAuditSummary {
  totalAuditRecords: number;

  returnRequestEvents: number;
  refundEvents: number;
  pickupProofEvents: number;
  deliveryProofEvents: number;
  sellerDisputeEvents: number;
  damagedInventoryEvents: number;
  automationRuleEvents: number;
  systemEvents: number;

  lowSeverityEvents: number;
  mediumSeverityEvents: number;
  highSeverityEvents: number;
  criticalSeverityEvents: number;

  compliantEvents: number;
  reviewRequiredEvents: number;
  nonCompliantEvents: number;

  exportableRecords: number;
  latestAuditAt?: string;
}

export interface ReturnOperationsAuditFilter {
  searchText: string;
  source: "ALL" | ReturnAuditSource;
  action: "ALL" | ReturnAuditAction;
  severity: "ALL" | ReturnAuditSeverity;
  complianceStatus: "ALL" | ReturnAuditComplianceStatus;
}

export interface ReturnOperationsAuditDashboardData {
  summary: ReturnOperationsAuditSummary;
  records: ReturnOperationsAuditRecord[];
}