export type UnifiedAuditSource =
  | "RETURN_REQUEST"
  | "REFUND"
  | "PICKUP_PROOF"
  | "DELIVERY_PROOF"
  | "RETURN_AUTOMATION_RULE"
  | "RETURN_LOGISTICS_RULE"
  | "RETURN_SLA_ESCALATION"
  | "AGENT_ESCALATION"
  | "SELLER_PAYOUT_ADJUSTMENT"
  | "SUPPORT_ESCALATION"
  | "SYSTEM_EXPORT";

export type UnifiedAuditAction =
  | "CREATED"
  | "UPDATED"
  | "STATUS_CHANGED"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "FAILED"
  | "ESCALATED"
  | "REASSIGNED"
  | "RESOLVED"
  | "CANCELLED"
  | "CLONED"
  | "DELETED"
  | "BULK_IMPORTED"
  | "EXPORT_GENERATED"
  | "PAYOUT_HOLD"
  | "PAYOUT_RELEASE"
  | "SETTLEMENT_UPDATED"
  | "PROOF_SUBMITTED"
  | "PROOF_VERIFIED"
  | "PROOF_REJECTED";

export type UnifiedAuditSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type UnifiedAuditComplianceStatus =
  | "COMPLIANT"
  | "REVIEW_REQUIRED"
  | "NON_COMPLIANT";

export interface UnifiedOperationsAuditRecord {
  id: string;
  auditId: string;

  source: UnifiedAuditSource;
  action: UnifiedAuditAction;
  severity: UnifiedAuditSeverity;
  complianceStatus: UnifiedAuditComplianceStatus;

  entityId: string;
  entityType: string;

  returnRequestId?: string;
  orderId?: string;

  customerId?: string;
  customerName?: string;
  customerEmail?: string;

  sellerId?: string;
  sellerName?: string;

  agentId?: string;
  agentName?: string;

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

export interface UnifiedOperationsAuditSummary {
  totalRecords: number;

  returnEvents: number;
  refundEvents: number;
  proofEvents: number;
  automationEvents: number;
  slaEscalationEvents: number;
  agentEscalationEvents: number;
  sellerPayoutEvents: number;
  supportEvents: number;
  exportEvents: number;

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

export interface UnifiedOperationsAuditDashboardData {
  summary: UnifiedOperationsAuditSummary;
  records: UnifiedOperationsAuditRecord[];
}

export interface UnifiedOperationsAuditExportLog {
  id: string;
  exportId: string;
  exportType: "CSV" | "JSON";
  recordCount: number;
  generatedBy: string;
  generatedAt: string;
}