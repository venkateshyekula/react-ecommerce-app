export type ReturnSlaStage =
  | "RETURN_REQUEST"
  | "PICKUP"
  | "QC"
  | "REFUND"
  | "SELLER_DISPUTE"
  | "SUPPORT_ESCALATION";

export type ReturnSlaStatus =
  | "WITHIN_SLA"
  | "WARNING"
  | "BREACHED"
  | "ESCALATED"
  | "COMPLETED";

export type ReturnSlaRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ReturnSlaEscalationStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CANCELLED";

export type ReturnSlaEscalationAction =
  | "ESCALATE_TO_SUPPORT"
  | "ESCALATE_TO_ADMIN"
  | "ESCALATE_TO_QC_MANAGER"
  | "ESCALATE_TO_REFUND_TEAM"
  | "ESCALATE_TO_PICKUP_MANAGER"
  | "MARK_RESOLVED"
  | "CANCEL_ESCALATION";

export interface ReturnSlaRule {
  stage: ReturnSlaStage;
  label: string;
  allowedHours: number;
  warningHours: number;
}

export interface ReturnSlaMonitoringRow {
  id: string;
  returnRequestId: string;
  orderId?: string;

  customerId?: string;
  customerName?: string;
  customerEmail?: string;

  sellerId?: string;
  sellerName?: string;

  stage: ReturnSlaStage;
  stageLabel: string;

  status: ReturnSlaStatus;
  riskLevel: ReturnSlaRiskLevel;

  startedAt?: string;
  dueAt?: string;
  completedAt?: string;
  lastActivityAt?: string;

  elapsedHours: number;
  allowedHours: number;
  remainingHours: number;
  breachedHours: number;

  returnStatus?: string;
  pickupStatus?: string;
  qcStatus?: string;
  refundStatus?: string;
  disputeStatus?: string;

  escalationStatus?: ReturnSlaEscalationStatus;
  escalationId?: string;
  assignedTeam?: string;
  assignedTo?: string;

  slaReasons: string[];
  recommendedActions: string[];

  updatedAt?: string;
}

export interface ReturnSlaEscalationRecord {
  id: string;
  escalationId: string;
  returnRequestId: string;
  orderId?: string;

  stage: ReturnSlaStage;
  action: ReturnSlaEscalationAction;
  status: ReturnSlaEscalationStatus;

  riskLevel: ReturnSlaRiskLevel;
  reason: string;

  assignedTeam: string;
  assignedTo?: string;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface ReturnSlaMonitoringSummary {
  totalSlaRows: number;

  withinSlaCount: number;
  warningCount: number;
  breachedCount: number;
  escalatedCount: number;
  completedCount: number;

  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  criticalRiskCount: number;

  pickupBreaches: number;
  qcBreaches: number;
  refundBreaches: number;
  sellerDisputeBreaches: number;
  supportEscalationBreaches: number;

  openEscalations: number;
  resolvedEscalations: number;

  averageElapsedHours: number;
}

export interface ReturnSlaMonitoringDashboardData {
  summary: ReturnSlaMonitoringSummary;
  rows: ReturnSlaMonitoringRow[];
  escalationRecords: ReturnSlaEscalationRecord[];
}

export interface ReturnSlaEscalationPayload {
  row: ReturnSlaMonitoringRow;
  action: ReturnSlaEscalationAction;
  reason: string;
}