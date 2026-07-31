import type { AgentType } from "./agentAssignment";

export type AgentPayoutStatus =
  | "DRAFT"
  | "READY_FOR_APPROVAL"
  | "APPROVED"
  | "PAID"
  | "ON_HOLD";

export type AgentPayoutRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface AgentIncentiveRule {
  id: string;
  ruleId: string;
  name: string;
  isActive: boolean;

  pickupCompletionAmount: number;
  deliveryCompletionAmount: number;
  failedAttemptAllowance: number;
  slaBonusAmount: number;
  proofVerifiedBonusAmount: number;
  proofRejectedPenaltyAmount: number;

  maxFailedAttemptAllowancePerPeriod?: number;

  createdAt: string;
  updatedAt?: string;
}

export interface AgentPayoutRow {
  agentId: string;
  agentName: string;
  agentPhone?: string;
  agentEmail?: string;
  agentType: AgentType | "UNKNOWN";

  completedPickups: number;
  completedDeliveries: number;
  failedAttempts: number;
  slaEligibleTasks: number;
  verifiedProofs: number;
  rejectedProofs: number;

  pickupEarnings: number;
  deliveryEarnings: number;
  failedAttemptAllowance: number;
  slaBonus: number;
  proofVerifiedBonus: number;
  proofRejectedPenalty: number;

  grossAmount: number;
  deductions: number;
  netPayableAmount: number;

  payoutStatus: AgentPayoutStatus;
  riskLevel: AgentPayoutRiskLevel;
}

export interface AgentPayoutSummary {
  totalAgents: number;
  totalCompletedPickups: number;
  totalCompletedDeliveries: number;
  totalFailedAttempts: number;
  totalVerifiedProofs: number;
  totalRejectedProofs: number;

  totalGrossAmount: number;
  totalDeductions: number;
  totalNetPayableAmount: number;

  readyForApprovalCount: number;
  highRiskCount: number;
}

export interface AgentPayoutDashboardData {
  summary: AgentPayoutSummary;
  rows: AgentPayoutRow[];
  activeRule: AgentIncentiveRule;
}

export interface AgentPayoutRecord {
  id: string;
  payoutId: string;

  agentId: string;
  agentName: string;
  agentType: AgentType | "UNKNOWN";

  periodStart: string;
  periodEnd: string;

  completedPickups: number;
  completedDeliveries: number;
  failedAttempts: number;
  slaEligibleTasks: number;
  verifiedProofs: number;
  rejectedProofs: number;

  grossAmount: number;
  deductions: number;
  netPayableAmount: number;

  status: AgentPayoutStatus;

  approvedByUserId?: string;
  approvedByName?: string;
  approvedAt?: string;

  paidAt?: string;
  remarks?: string;

  createdAt: string;
  updatedAt: string;
}