export type AgentEscalationSource =
  | "RETURN_PICKUP"
  | "DELIVERY"
  | "PROOF_VERIFICATION"
  | "SLA_BREACH"
  | "SUPPORT_ESCALATION"
  | "MANUAL_ADMIN_REVIEW";

export type AgentEscalationRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AgentEscalationStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "REASSIGNED"
  | "ESCALATED"
  | "RESOLVED"
  | "CANCELLED";

export type AgentAvailabilityStatus =
  | "AVAILABLE"
  | "BUSY"
  | "OFFLINE"
  | "ON_LEAVE"
  | "UNAVAILABLE";

export type AgentEscalationAction =
  | "ESCALATE_TO_MANAGER"
  | "REASSIGN_AGENT"
  | "MARK_IN_PROGRESS"
  | "MARK_RESOLVED"
  | "CANCEL_ESCALATION";

export interface AgentProfileLite {
  id: string;
  agentId: string;
  agentName: string;
  phone?: string;
  email?: string;
  city?: string;
  pincode?: string;
  role?: string;
  availabilityStatus: AgentAvailabilityStatus;
  activeTaskCount: number;
  completedTaskCount: number;
  failedTaskCount: number;
  averageRating?: number;
}

export interface AgentEscalationWorkflowRow {
  id: string;
  escalationId?: string;

  source: AgentEscalationSource;
  status: AgentEscalationStatus;
  riskLevel: AgentEscalationRiskLevel;

  taskId?: string;
  assignmentId?: string;
  returnRequestId?: string;
  orderId?: string;

  currentAgentId?: string;
  currentAgentName?: string;
  suggestedAgentId?: string;
  suggestedAgentName?: string;

  customerName?: string;
  customerPhone?: string;
  city?: string;
  pincode?: string;

  issueTitle: string;
  issueDetails: string;

  attemptCount: number;
  failedAttemptCount: number;
  elapsedHours: number;
  breachedHours: number;

  recommendedActions: string[];
  reassignmentReasons: string[];

  createdAt: string;
  updatedAt: string;
}

export interface AgentEscalationRecord {
  id: string;
  escalationId: string;

  source: AgentEscalationSource;
  status: AgentEscalationStatus;
  riskLevel: AgentEscalationRiskLevel;

  taskId?: string;
  assignmentId?: string;
  returnRequestId?: string;
  orderId?: string;

  previousAgentId?: string;
  previousAgentName?: string;
  newAgentId?: string;
  newAgentName?: string;

  action: AgentEscalationAction;
  reason: string;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface AgentEscalationSummary {
  totalRows: number;
  openEscalations: number;
  inProgressEscalations: number;
  reassignedEscalations: number;
  resolvedEscalations: number;
  cancelledEscalations: number;

  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  criticalRiskCount: number;

  unavailableAgents: number;
  overloadedAgents: number;
  failedAttemptRows: number;
  slaBreachedRows: number;

  averageElapsedHours: number;
}

export interface AgentEscalationDashboardData {
  rows: AgentEscalationWorkflowRow[];
  agents: AgentProfileLite[];
  escalationRecords: AgentEscalationRecord[];
  summary: AgentEscalationSummary;
}

export interface AgentEscalationActionPayload {
  row: AgentEscalationWorkflowRow;
  action: AgentEscalationAction;
  reason: string;
  newAgentId?: string;
}