// ==========================================
// Basic Enums & Core Union Types
// ==========================================

export type ReturnAutomationRuleStatus = "ACTIVE" | "INACTIVE";

export type ReturnAutomationRulePriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

/**
 * Union of triggers supporting both legacy event-driven triggers
 * and flat condition-based triggers.
 */
export type ReturnAutomationRuleTrigger =
  | "RETURN_CREATED"
  | "QC_COMPLETED"
  | "REFUND_REQUESTED"
  | "FRAUD_SCORE_UPDATED"
  | "SELLER_DISPUTE_RAISED"
  | "PICKUP_COMPLETED"
  | "LOW_RISK_RETURN"
  | "HIGH_RISK_CUSTOMER"
  | "HIGH_RISK_PRODUCT"
  | "HIGH_RISK_SELLER"
  | "QC_PASSED"
  | "QC_FAILED"
  | "REFUND_AMOUNT_LIMIT"
  | "RETURN_REASON_MATCH"
  | "SLA_BREACH"
  | "SELLER_DISPUTE_APPROVED"
  | "FRAUD_PATTERN_DETECTED";

// Alias for backwards compatibility with older components
export type ReturnAutomationTriggerType = ReturnAutomationRuleTrigger;

/**
 * Union of core and extended actions.
 */
export type ReturnAutomationRuleAction =
  | "AUTO_APPROVE_RETURN"
  | "AUTO_REJECT_RETURN"
  | "HOLD_REFUND"
  | "RELEASE_REFUND"
  | "FLAG_FRAUD_REVIEW"
  | "REQUIRE_MANUAL_REVIEW"
  | "AUTO_RESTOCK"
  | "MOVE_TO_DAMAGED_INVENTORY"
  | "HOLD_SELLER_PAYOUT"
  | "ESCALATE_SLA"
  | "ESCALATE_TO_ADMIN"
  | "SEND_NOTIFICATION"
  | "ASSIGN_QC_REVIEW"
  | "FLAG_CUSTOMER"
  | "FLAG_SELLER"
  | "CREATE_SUPPORT_TICKET";

// Alias for backwards compatibility with older components
export type ReturnAutomationActionType = ReturnAutomationRuleAction;

export type ReturnAutomationAuditAction =
  | "CREATED"
  | "UPDATED"
  | "STATUS_CHANGED"
  | "DELETED"
  | "CLONED"
  | "BULK_IMPORTED";

export type ReturnAutomationOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "CONTAINS"
  | "IN";

export type ReturnAutomationConditionField =
  | "fraudScore"
  | "refundAmount"
  | "returnRate"
  | "customerReturnCount"
  | "sellerRiskScore"
  | "qcStatus"
  | "returnReason"
  | "riskLevel"
  | "daysAfterDelivery"
  | string;

// ==========================================
// Condition & Action Interfaces
// ==========================================

export interface ReturnAutomationRuleCondition {
  id?: string;
  field: ReturnAutomationConditionField;
  operator: ReturnAutomationOperator;
  value: string | number | string[];
}

// Alias for backwards compatibility
export type ReturnAutomationCondition = ReturnAutomationRuleCondition;

export interface ReturnAutomationAction {
  id: string;
  actionType: ReturnAutomationRuleAction;
  actionLabel: string;
  targetRole?: "ADMIN" | "CUSTOMER" | "SELLER" | "QC_TEAM" | "SUPPORT";
  message?: string;
}

// ==========================================
// Primary Model & Draft Interfaces
// ==========================================

export interface ReturnAutomationRule {
  id: string;
  ruleId: string;
  ruleName: string;
  description: string;

  // Single flat action/trigger + array-based actions for backwards compatibility
  trigger: ReturnAutomationRuleTrigger;
  action: ReturnAutomationRuleAction;
  triggerType?: ReturnAutomationRuleTrigger;
  actions?: ReturnAutomationAction[];

  priority: ReturnAutomationRulePriority;
  status: ReturnAutomationRuleStatus;

  conditions: ReturnAutomationRuleCondition[];

  stopFurtherRules: boolean;
  requiresAudit: boolean;

  // Execution Metrics (Optional for simple instances)
  executionCount?: number;
  successCount?: number;
  failureCount?: number;
  lastExecutedAt?: string;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnAutomationRuleDraft {
  ruleName: string;
  description: string;
  trigger: ReturnAutomationRuleTrigger;
  action: ReturnAutomationRuleAction;
  triggerType?: ReturnAutomationRuleTrigger;
  actions?: ReturnAutomationAction[];
  priority: ReturnAutomationRulePriority;
  status: ReturnAutomationRuleStatus;
  conditions: ReturnAutomationRuleCondition[];
  stopFurtherRules: boolean;
  requiresAudit: boolean;
}

export interface ReturnAutomationRuleFormData extends ReturnAutomationRuleDraft {
  isSubmitting?: boolean;
}

// ==========================================
// Audit, Summary, Import & UI Models
// ==========================================

export interface ReturnAutomationRuleAuditLog {
  id: string;
  auditId: string;
  ruleId: string;
  ruleName: string;
  action: ReturnAutomationAuditAction;
  changedBy: string;
  changedAt: string;
  details: string;
  beforeSnapshot?: ReturnAutomationRule;
  afterSnapshot?: ReturnAutomationRule;
}

export interface ReturnAutomationRuleImportResult {
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

export interface ReturnAutomationRuleSummary {
  totalRules: number;
  activeRules: number;
  inactiveRules: number;
  criticalRules: number;
  highPriorityRules: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
}

export interface ReturnAutomationRuleFilters {
  searchText: string;
  status: "ALL" | ReturnAutomationRuleStatus;
  priority: "ALL" | ReturnAutomationRulePriority;
  triggerType: "ALL" | ReturnAutomationRuleTrigger;
}

export interface ReturnAutomationRulesResponse {
  records: ReturnAutomationRule[];
  summary: ReturnAutomationRuleSummary;
}

// ==========================================
// UI Display Mappings & Helpers
// ==========================================

export const returnAutomationTriggerLabels: Record<
  ReturnAutomationRuleTrigger,
  string
> = {
  RETURN_CREATED: "Return Created",
  QC_COMPLETED: "QC Completed",
  REFUND_REQUESTED: "Refund Requested",
  FRAUD_SCORE_UPDATED: "Fraud Score Updated",
  SELLER_DISPUTE_RAISED: "Seller Dispute Raised",
  PICKUP_COMPLETED: "Pickup Completed",
  LOW_RISK_RETURN: "Low Risk Return",
  HIGH_RISK_CUSTOMER: "High Risk Customer",
  HIGH_RISK_PRODUCT: "High Risk Product",
  HIGH_RISK_SELLER: "High Risk Seller",
  QC_PASSED: "QC Passed",
  QC_FAILED: "QC Failed",
  REFUND_AMOUNT_LIMIT: "Refund Amount Limit",
  RETURN_REASON_MATCH: "Return Reason Match",
  SLA_BREACH: "SLA Breach",
  SELLER_DISPUTE_APPROVED: "Seller Dispute Approved",
  FRAUD_PATTERN_DETECTED: "Fraud Pattern Detected"
};

export const returnAutomationPriorityLabels: Record<
  ReturnAutomationRulePriority,
  string
> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical"
};

export const returnAutomationActionLabels: Record<
  ReturnAutomationRuleAction,
  string
> = {
  AUTO_APPROVE_RETURN: "Auto Approve Return",
  AUTO_REJECT_RETURN: "Auto Reject Return",
  HOLD_REFUND: "Hold Refund",
  RELEASE_REFUND: "Release Refund",
  FLAG_FRAUD_REVIEW: "Flag Fraud Review",
  REQUIRE_MANUAL_REVIEW: "Require Manual Review",
  AUTO_RESTOCK: "Auto Restock",
  MOVE_TO_DAMAGED_INVENTORY: "Move To Damaged Inventory",
  HOLD_SELLER_PAYOUT: "Hold Seller Payout",
  ESCALATE_SLA: "Escalate SLA",
  ESCALATE_TO_ADMIN: "Escalate To Admin",
  SEND_NOTIFICATION: "Send Notification",
  ASSIGN_QC_REVIEW: "Assign QC Review",
  FLAG_CUSTOMER: "Flag Customer",
  FLAG_SELLER: "Flag Seller",
  CREATE_SUPPORT_TICKET: "Create Support Ticket"
};