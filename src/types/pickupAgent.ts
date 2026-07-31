export type PickupProofType = "PHOTO" | "OTP" | "SIGNATURE" | "MANUAL";

export type AgentProofVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export interface PickupProof {
  id: string;
  proofId: string;

  assignmentId: string;
  taskId: string;
  returnRequestId: string;
  returnRequestDbId?: string;
  orderId?: string;

  agentId: string;
  agentName: string;

  proofType: PickupProofType;
  proofUrl?: string;
  otpCode?: string;
  otpVerified?: boolean;

  customerRemarks?: string;
  agentRemarks?: string;

  verificationStatus?: AgentProofVerificationStatus;
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewRemarks?: string;

  capturedAt: string;
  createdAt: string;
}

export interface CreatePickupProofPayload {
  assignmentId: string;
  taskId: string;
  returnRequestId: string;
  returnRequestDbId?: string;
  orderId?: string;

  agentId: string;
  agentName: string;

  proofType: PickupProofType;
  proofUrl?: string;
  otpCode?: string;
  otpVerified?: boolean;

  customerRemarks?: string;
  agentRemarks?: string;
}