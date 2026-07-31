import type { AgentTaskType } from "./agentAssignment";
import type { AgentProofVerificationStatus as PickupVerificationStatus } from "./pickupAgent";

export type AgentProofTaskType = AgentTaskType;

export type AgentProofVerificationStatus = PickupVerificationStatus;

export type AgentProofSourceType = "PICKUP_PROOF" | "DELIVERY_PROOF";

export interface AgentProofReviewRow {
  id: string;
  proofId: string;
  sourceType: AgentProofSourceType;

  assignmentId: string;
  taskType: AgentProofTaskType;
  taskId: string;

  orderId?: string;
  returnRequestId?: string;
  returnRequestDbId?: string;
  orderDbId?: string;

  agentId: string;
  agentName: string;

  proofType: string;
  proofUrl?: string;
  otpCode?: string;
  otpVerified?: boolean;

  customerRemarks?: string;
  agentRemarks?: string;

  verificationStatus: AgentProofVerificationStatus;
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewRemarks?: string;

  capturedAt: string;
  createdAt: string;

  assignmentStatus?: string;
  customerName?: string;
  address?: string;
}

export interface AgentProofVerificationSummary {
  totalProofs: number;
  pickupProofs: number;
  deliveryProofs: number;
  pendingProofs: number;
  verifiedProofs: number;
  rejectedProofs: number;
  photoProofs: number;
  otpProofs: number;
}

export interface AgentProofVerificationDashboardData {
  summary: AgentProofVerificationSummary;
  proofRows: AgentProofReviewRow[];
}

export interface ReviewAgentProofPayload {
  status: AgentProofVerificationStatus;
  reviewRemarks: string;
  reviewedByUserId: string;
  reviewedByName: string;
}