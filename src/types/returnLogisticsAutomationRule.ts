export type ReturnLogisticsAutomationRuleStatus = "ACTIVE" | "INACTIVE";

export type ReturnLogisticsAutomationRulePriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type ReturnLogisticsAutomationTrigger =
  | "RETURN_CREATED"
  | "PICKUP_DELAYED"
  | "PICKUP_FAILED"
  | "QC_DELAYED"
  | "QC_FAILED"
  | "REFUND_DELAYED"
  | "SLA_BREACHED"
  | "AGENT_UNAVAILABLE"
  | "WAREHOUSE_OVERLOAD"
  | "HIGH_RISK_RETURN"
  | "SELLER_DISPUTE_RAISED"
  | "PACKAGE_STUCK_IN_TRANSIT";

export type ReturnLogisticsAutomationAction =
  | "AUTO_ASSIGN_PICKUP_AGENT"
  | "REASSIGN_PICKUP_AGENT"
  | "ESCALATE_TO_PICKUP_MANAGER"
  | "ESCALATE_TO_QC_MANAGER"
  | "ESCALATE_TO_REFUND_TEAM"
  | "ESCALATE_TO_SUPPORT"
  | "HOLD_REFUND"
  | "RELEASE_REFUND"
  | "CREATE_SUPPORT_TICKET"
  | "SEND_CUSTOMER_NOTIFICATION"
  | "SEND_SELLER_NOTIFICATION"
  | "MOVE_TO_PRIORITY_QUEUE"
  | "BLOCK_AUTO_APPROVAL"
  | "AUTO_CLOSE_LOW_RISK_CASE";

export type ReturnLogisticsAutomationAuditAction =
  | "CREATED"
  | "UPDATED"
  | "STATUS_CHANGED"
  | "DELETED"
  | "CLONED"
  | "BULK_IMPORTED";

export type ReturnLogisticsAutomationConditionOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "CONTAINS"
  | "IN";

export interface ReturnLogisticsAutomationCondition {
  id: string;
  field: string;
  operator: ReturnLogisticsAutomationConditionOperator;
  value: string | number | string[];
}

export interface ReturnLogisticsAutomationRule {
  id: string;
  ruleId: string;

  ruleName: string;
  description: string;

  trigger: ReturnLogisticsAutomationTrigger;
  action: ReturnLogisticsAutomationAction;
  priority: ReturnLogisticsAutomationRulePriority;
  status: ReturnLogisticsAutomationRuleStatus;

  conditions: ReturnLogisticsAutomationCondition[];

  targetTeam:
    | "PICKUP_TEAM"
    | "QC_TEAM"
    | "WAREHOUSE_TEAM"
    | "REFUND_TEAM"
    | "SUPPORT_TEAM"
    | "ADMIN_TEAM"
    | "SYSTEM";

  stopFurtherRules: boolean;
  requiresAudit: boolean;

  executionCount: number;
  successCount: number;
  failureCount: number;
  lastExecutedAt?: string;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnLogisticsAutomationRuleDraft {
  ruleName: string;
  description: string;
  trigger: ReturnLogisticsAutomationTrigger;
  action: ReturnLogisticsAutomationAction;
  priority: ReturnLogisticsAutomationRulePriority;
  status: ReturnLogisticsAutomationRuleStatus;
  targetTeam: ReturnLogisticsAutomationRule["targetTeam"];
  conditions: ReturnLogisticsAutomationCondition[];
  stopFurtherRules: boolean;
  requiresAudit: boolean;
}

export interface ReturnLogisticsAutomationAuditLog {
  id: string;
  auditId: string;
  ruleId: string;
  ruleName: string;
  action: ReturnLogisticsAutomationAuditAction;
  changedBy: string;
  changedAt: string;
  details: string;
  beforeSnapshot?: ReturnLogisticsAutomationRule;
  afterSnapshot?: ReturnLogisticsAutomationRule;
}

export interface ReturnLogisticsAutomationImportResult {
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

export interface ReturnLogisticsAutomationSummary {
  totalRules: number;
  activeRules: number;
  inactiveRules: number;

  criticalRules: number;
  highPriorityRules: number;

  pickupRules: number;
  qcRules: number;
  warehouseRules?: number;
  refundRules: number;
  supportRules?: number;

  totalExecutions: number;
  successfulExecutions?: number;
  failedExecutions?: number;
  successRate: number;
  successCount: number;
  failureCount: number;
  escalationRules: number;

  auditRecords?: number;
}

export interface ReturnLogisticsAutomationDashboardData {
  rules: ReturnLogisticsAutomationRule[];
  auditLogs: ReturnLogisticsAutomationAuditLog[];
  summary: ReturnLogisticsAutomationSummary;
}