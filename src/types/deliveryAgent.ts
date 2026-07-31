export type DeliveryProofType = "PHOTO" | "OTP" | "SIGNATURE" | "MANUAL";

export type AgentProofVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export interface DeliveryProof {
  id: string;
  proofId: string;

  assignmentId: string;
  taskId: string;
  orderId: string;
  orderDbId?: string;

  agentId: string;
  agentName: string;

  proofType: DeliveryProofType;
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

  deliveredAt: string;
  createdAt: string;
}

export interface CreateDeliveryProofPayload {
  assignmentId: string;
  taskId: string;
  orderId: string;
  orderDbId?: string;

  agentId: string;
  agentName: string;

  proofType: DeliveryProofType;
  proofUrl?: string;
  otpCode?: string;
  otpVerified?: boolean;

  customerRemarks?: string;
  agentRemarks?: string;
}