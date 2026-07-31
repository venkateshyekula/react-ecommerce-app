import type {
  AgentAssignmentPriority,
  AgentAssignmentStatus,
  AgentTaskType
} from "./agentAssignment";

export type AgentSlaStatus =
  | "ON_TRACK"
  | "AT_RISK"
  | "BREACHED"
  | "COMPLETED";

export type AgentSlaSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AgentSlaTaskRow {
  assignmentId: string;
  assignmentDbId: string;

  taskType: AgentTaskType;
  taskId: string;
  orderId?: string;
  returnRequestId?: string;

  customerName: string;
  address: string;
  pincode?: string;
  city?: string;

  agentId?: string;
  agentName?: string;
  agentPhone?: string;

  status: AgentAssignmentStatus;
  priority: AgentAssignmentPriority;

  scheduledDate?: string;
  scheduledSlot?: string;

  assignedAt?: string;
  createdAt: string;
  updatedAt: string;

  attemptCount: number;

  dueAt: string;
  hoursRemaining: number;
  hoursOverdue: number;

  slaStatus: AgentSlaStatus;
  severity: AgentSlaSeverity;
  remarks?: string;
}

export interface AgentWorkloadRow {
  agentId: string;
  agentName: string;
  agentPhone?: string;

  totalTasks: number;
  assignedTasks: number;
  pickupTasks: number;
  deliveryTasks: number;
  completedTasks: number;
  attemptedTasks: number;
  breachedTasks: number;
  atRiskTasks: number;

  maxDailyTasks?: number;
  utilizationPercent: number;
  riskLevel: AgentSlaSeverity;
}

export interface AgentSlaSummary {
  totalTasks: number;
  assignedTasks: number;
  unassignedTasks: number;
  pickupTasks: number;
  deliveryTasks: number;
  completedTasks: number;
  attemptedTasks: number;
  atRiskTasks: number;
  breachedTasks: number;
  activeAgents: number;
  overloadedAgents: number;
}

export interface AgentSlaDashboardData {
  summary: AgentSlaSummary;
  taskRows: AgentSlaTaskRow[];
  agentRows: AgentWorkloadRow[];
}