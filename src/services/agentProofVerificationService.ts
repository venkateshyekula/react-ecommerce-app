import { apiClient } from "./apiClient";
import type { AgentAssignment } from "../types/agentAssignment";
import type { DeliveryProof } from "../types/deliveryAgent";
import type { PickupProof } from "../types/pickupAgent";
import type {
  AgentProofReviewRow,
  AgentProofVerificationDashboardData,
  ReviewAgentProofPayload
} from "../types/agentProofVerification";
import { agentNotificationService } from "./agentNotificationService";

const PICKUP_PROOFS_ENDPOINT = "/pickupProofs";
const DELIVERY_PROOFS_ENDPOINT = "/deliveryProofs";
const AGENT_ASSIGNMENTS_ENDPOINT = "/agentAssignments";

const getSafeTime = (dateValue?: string | null): number => {
  if (!dateValue) {
    return 0;
  }

  const time = new Date(dateValue).getTime();

  return Number.isNaN(time) ? 0 : time;
};

const normalizeVerificationStatus = (
  value?: string | null
): "PENDING" | "VERIFIED" | "REJECTED" => {
  if (value === "VERIFIED" || value === "REJECTED") {
    return value;
  }

  return "PENDING";
};

const getAssignmentByAssignmentId = ({
  assignments,
  assignmentId
}: {
  assignments: AgentAssignment[];
  assignmentId: string;
}): AgentAssignment | undefined => {
  return assignments.find(
    (assignment) =>
      assignment.assignmentId === assignmentId || assignment.id === assignmentId
  );
};

const mapPickupProofToRow = ({
  proof,
  assignments
}: {
  proof: PickupProof;
  assignments: AgentAssignment[];
}): AgentProofReviewRow => {
  const assignment = getAssignmentByAssignmentId({
    assignments,
    assignmentId: proof.assignmentId
  });

  return {
    id: proof.id,
    proofId: proof.proofId,
    sourceType: "PICKUP_PROOF",
    assignmentId: proof.assignmentId,
    taskType: "RETURN_PICKUP",
    taskId: proof.taskId,
    orderId: proof.orderId,
    returnRequestId: proof.returnRequestId,
    returnRequestDbId: proof.returnRequestDbId,
    agentId: proof.agentId,
    agentName: proof.agentName,
    proofType: proof.proofType,
    proofUrl: proof.proofUrl,
    otpCode: proof.otpCode,
    otpVerified: proof.otpVerified,
    customerRemarks: proof.customerRemarks,
    agentRemarks: proof.agentRemarks,
    verificationStatus: normalizeVerificationStatus(proof.verificationStatus),
    reviewedByUserId: proof.reviewedByUserId,
    reviewedByName: proof.reviewedByName,
    reviewedAt: proof.reviewedAt,
    reviewRemarks: proof.reviewRemarks,
    capturedAt: proof.capturedAt,
    createdAt: proof.createdAt,
    assignmentStatus: assignment?.status,
    customerName: assignment?.customerName,
    address: assignment?.address
  };
};

const mapDeliveryProofToRow = ({
  proof,
  assignments
}: {
  proof: DeliveryProof;
  assignments: AgentAssignment[];
}): AgentProofReviewRow => {
  const assignment = getAssignmentByAssignmentId({
    assignments,
    assignmentId: proof.assignmentId
  });

  return {
    id: proof.id,
    proofId: proof.proofId,
    sourceType: "DELIVERY_PROOF",
    assignmentId: proof.assignmentId,
    taskType: "ORDER_DELIVERY",
    taskId: proof.taskId,
    orderId: proof.orderId,
    orderDbId: proof.orderDbId,
    agentId: proof.agentId,
    agentName: proof.agentName,
    proofType: proof.proofType,
    proofUrl: proof.proofUrl,
    otpCode: proof.otpCode,
    otpVerified: proof.otpVerified,
    customerRemarks: proof.customerRemarks,
    agentRemarks: proof.agentRemarks,
    verificationStatus: normalizeVerificationStatus(proof.verificationStatus),
    reviewedByUserId: proof.reviewedByUserId,
    reviewedByName: proof.reviewedByName,
    reviewedAt: proof.reviewedAt,
    reviewRemarks: proof.reviewRemarks,
    capturedAt: proof.deliveredAt,
    createdAt: proof.createdAt,
    assignmentStatus: assignment?.status,
    customerName: assignment?.customerName,
    address: assignment?.address
  };
};

const buildSummary = (rows: AgentProofReviewRow[]) => {
  return rows.reduce(
    (summary, row) => {
      summary.totalProofs += 1;

      if (row.sourceType === "PICKUP_PROOF") summary.pickupProofs += 1;
      if (row.sourceType === "DELIVERY_PROOF") summary.deliveryProofs += 1;

      if (row.verificationStatus === "PENDING") summary.pendingProofs += 1;
      if (row.verificationStatus === "VERIFIED") summary.verifiedProofs += 1;
      if (row.verificationStatus === "REJECTED") summary.rejectedProofs += 1;

      if (row.proofType === "PHOTO") summary.photoProofs += 1;
      if (row.proofType === "OTP") summary.otpProofs += 1;

      return summary;
    },
    {
      totalProofs: 0,
      pickupProofs: 0,
      deliveryProofs: 0,
      pendingProofs: 0,
      verifiedProofs: 0,
      rejectedProofs: 0,
      photoProofs: 0,
      otpProofs: 0
    }
  );
};

export const agentProofVerificationService = {
  getDashboardData: async (): Promise<AgentProofVerificationDashboardData> => {
    const [pickupProofs, deliveryProofs, assignments] = await Promise.all([
      apiClient.get<PickupProof[]>(PICKUP_PROOFS_ENDPOINT),
      apiClient.get<DeliveryProof[]>(DELIVERY_PROOFS_ENDPOINT),
      apiClient.get<AgentAssignment[]>(AGENT_ASSIGNMENTS_ENDPOINT)
    ]);

    const safePickupProofs = Array.isArray(pickupProofs) ? pickupProofs : [];
    const safeDeliveryProofs = Array.isArray(deliveryProofs)
      ? deliveryProofs
      : [];
    const safeAssignments = Array.isArray(assignments) ? assignments : [];

    const rows = [
      ...safePickupProofs.map((proof) =>
        mapPickupProofToRow({
          proof,
          assignments: safeAssignments
        })
      ),
      ...safeDeliveryProofs.map((proof) =>
        mapDeliveryProofToRow({
          proof,
          assignments: safeAssignments
        })
      )
    ].sort(
      (firstRow, secondRow) =>
        getSafeTime(secondRow.createdAt) - getSafeTime(firstRow.createdAt)
    );

    return {
      summary: buildSummary(rows),
      proofRows: rows
    };
  },

  reviewPickupProof: async ({
    proofId,
    payload
  }: {
    proofId: string;
    payload: ReviewAgentProofPayload;
  }): Promise<PickupProof> => {
    return apiClient.patch<PickupProof, Partial<PickupProof>>(
      `${PICKUP_PROOFS_ENDPOINT}/${encodeURIComponent(proofId)}`,
      {
        verificationStatus: payload.status,
        reviewRemarks: payload.reviewRemarks,
        reviewedByUserId: payload.reviewedByUserId,
        reviewedByName: payload.reviewedByName,
        reviewedAt: new Date().toISOString()
      }
    );
  },

  reviewDeliveryProof: async ({
    proofId,
    payload
  }: {
    proofId: string;
    payload: ReviewAgentProofPayload;
  }): Promise<DeliveryProof> => {
    return apiClient.patch<DeliveryProof, Partial<DeliveryProof>>(
      `${DELIVERY_PROOFS_ENDPOINT}/${encodeURIComponent(proofId)}`,
      {
        verificationStatus: payload.status,
        reviewRemarks: payload.reviewRemarks,
        reviewedByUserId: payload.reviewedByUserId,
        reviewedByName: payload.reviewedByName,
        reviewedAt: new Date().toISOString()
      }
    );
  },

  reviewProof: async ({
    row,
    payload
  }: {
    row: AgentProofReviewRow;
    payload: ReviewAgentProofPayload;
  }): Promise<void> => {
    if (row.sourceType === "PICKUP_PROOF") {
      await agentProofVerificationService.reviewPickupProof({
        proofId: row.id,
        payload
      });
    } else {
      await agentProofVerificationService.reviewDeliveryProof({
        proofId: row.id,
        payload
      });
    }

    await agentNotificationService.notifyProofReviewToAgent({
      row,
      status: payload.status,
      remarks: payload.reviewRemarks
    });
  },

  formatDateTime: (dateValue?: string): string => {
    if (!dateValue) {
      return "Not Available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not Available";
    }

    return date.toLocaleString("en-IN");
  }
};