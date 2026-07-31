import type { AgentTaskType } from "./agentAssignment";

export type AgentPerformanceRiskLevel =
  | "EXCELLENT"
  | "GOOD"
  | "AVERAGE"
  | "POOR"
  | "CRITICAL";

export type AgentPerformanceFilter = "ALL" | AgentTaskType;

export interface AgentPerformanceSummary {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  attemptedTasks: number;
  failedTasks: number;
  verifiedProofs: number;
  rejectedProofs: number;
  averageCompletionRate: number;
  averagePerformanceScore: number;
}

export interface AgentPerformanceRow {
  agentId: string;
  agentName: string;
  agentPhone?: string;
  agentType?: string;
  city?: string;

  totalTasks: number;
  pickupTasks: number;
  deliveryTasks: number;

  assignedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  attemptedTasks: number;
  failedTasks: number;
  cancelledTasks: number;

  pickupCompleted: number;
  deliveriesCompleted: number;

  totalProofs: number;
  pendingProofs: number;
  verifiedProofs: number;
  rejectedProofs: number;

  completionRate: number;
  failureRate: number;
  proofVerificationRate: number;
  averageCompletionHours: number;

  performanceScore: number;
  riskLevel: AgentPerformanceRiskLevel;

  lastTaskAt?: string;
}

export interface AgentPerformanceTaskDetail {
  assignmentId: string;
  taskId: string;
  taskType: AgentTaskType;
  status: string;
  customerName: string;
  scheduledDate?: string;
  completedAt?: string;
  attemptCount: number;
}

export interface AgentPerformanceReportData {
  summary: AgentPerformanceSummary;
  agents: AgentPerformanceRow[];
}