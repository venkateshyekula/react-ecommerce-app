import { apiClient } from "./apiClient";
import type { ReturnRequest } from "../types/returnRequest";
import type {
  AgentAssignment,
  AgentAssignmentStatus,
  AgentTaskLog
} from "../types/agentAssignment";
import type {
  CreatePickupProofPayload,
  PickupProof
} from "../types/pickupAgent";
import { agentNotificationService } from "./agentNotificationService";

const AGENT_ASSIGNMENTS_ENDPOINT = "/agentAssignments";
const AGENT_TASK_LOGS_ENDPOINT = "/agentTaskLogs";
const PICKUP_PROOFS_ENDPOINT = "/pickupProofs";
const RETURN_REQUESTS_ENDPOINT = "/returnRequests";

const generatePickupProofDbId = (): string => {
  return `pickup-proof-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const generatePickupProofId = (): string => {
  return `PKP-PRF-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${Date.now()}`;
};

const generateTaskLogDbId = (): string => {
  return `agent-task-log-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const getSafeTime = (dateValue?: string | null): number => {
  if (!dateValue) {
    return 0;
  }

  const time = new Date(dateValue).getTime();

  return Number.isNaN(time) ? 0 : time;
};

const sortAssignmentsByLatest = (
  assignments: AgentAssignment[]
): AgentAssignment[] => {
  return [...assignments].sort(
    (first, second) =>
      getSafeTime(second.updatedAt) - getSafeTime(first.updatedAt)
  );
};

const createTaskLog = async ({
  assignment,
  status,
  remarks
}: {
  assignment: AgentAssignment;
  status: AgentAssignmentStatus;
  remarks?: string;
}): Promise<AgentTaskLog> => {
  const log: AgentTaskLog = {
    id: generateTaskLogDbId(),
    assignmentId: assignment.assignmentId,
    taskType: assignment.taskType,
    taskId: assignment.taskId,
    agentId: assignment.agentId,
    status,
    remarks,
    createdByUserId: assignment.agentId ?? "SYSTEM",
    createdByName: assignment.agentName ?? "System Agent",
    createdAt: new Date().toISOString()
  };

  return apiClient.post<AgentTaskLog, AgentTaskLog>(
    AGENT_TASK_LOGS_ENDPOINT,
    log
  );
};

export const pickupAgentService = {
  getPickupTasksByAgentId: async (
    agentId: string
  ): Promise<AgentAssignment[]> => {
    const assignments = await apiClient.get<AgentAssignment[]>(
      `${AGENT_ASSIGNMENTS_ENDPOINT}?agentId=${encodeURIComponent(
        agentId
      )}&taskType=RETURN_PICKUP`
    );

    return sortAssignmentsByLatest(
      Array.isArray(assignments) ? assignments : []
    );
  },

  updateAssignmentStatus: async ({
    assignment,
    status,
    remarks
  }: {
    assignment: AgentAssignment;
    status: AgentAssignmentStatus;
    remarks?: string;
  }): Promise<AgentAssignment> => {
    const now = new Date().toISOString();

    const isAttemptOrFailure =
      status === "PICKUP_ATTEMPTED" || status === "FAILED";

    const nextAttemptCount = isAttemptOrFailure
      ? (assignment.attemptCount ?? 0) + 1
      : assignment.attemptCount ?? 0;

    const patchPayload: Partial<AgentAssignment> = {
      status,
      remarks: remarks ?? assignment.remarks,
      attemptCount: nextAttemptCount,
      updatedAt: now
    };

    if (isAttemptOrFailure) {
      patchPayload.lastAttemptAt = now;
    }

    const updatedAssignment = await apiClient.patch<
      AgentAssignment,
      Partial<AgentAssignment>
    >(
      `${AGENT_ASSIGNMENTS_ENDPOINT}/${encodeURIComponent(assignment.id)}`,
      patchPayload
    );

    await createTaskLog({
      assignment: updatedAssignment,
      status,
      remarks
    });

    if (status === "PICKUP_ATTEMPTED" || status === "FAILED") {
      await agentNotificationService.notifyAdminsTaskStatusChanged({
        assignment: updatedAssignment,
        title: "Pickup attempt failed",
        message: `Pickup attempt failed for ${updatedAssignment.taskId}. Reason: ${remarks ?? "No reason provided"
          }`,
        severity: "warning"
      });
    }

    if (status === "PICKUP_COMPLETED") {
      await agentNotificationService.notifyAdminsTaskStatusChanged({
        assignment: updatedAssignment,
        title: "Pickup completed",
        message: `Pickup completed successfully for ${updatedAssignment.taskId}.`,
        severity: "success"
      });
    }

    if (assignment.returnRequestDbId) {
      const returnPatch: Partial<ReturnRequest> = {
        updatedAt: now
      };

      if (status === "OUT_FOR_PICKUP") {
        returnPatch.pickupStatus = "OUT_FOR_PICKUP";
      }

      if (isAttemptOrFailure) {
        returnPatch.pickupStatus = "FAILED";
        returnPatch.pickupAttemptCount = nextAttemptCount;
        returnPatch.lastPickupAttemptId = assignment.assignmentId;
        returnPatch.nextPickupAttemptAt = assignment.nextAttemptAt;
      }

      if (status === "PICKUP_COMPLETED") {
        returnPatch.pickupStatus = "PICKED_UP";
        returnPatch.status = "QUALITY_CHECK_PENDING";
        returnPatch.pickedUpAt = now;
        returnPatch.pickupCompletedAt = now;
        returnPatch.receivedAtWarehouseAt = now;
        returnPatch.lastPickupAttemptId = assignment.assignmentId;
      }

      await apiClient.patch<ReturnRequest, Partial<ReturnRequest>>(
        `${RETURN_REQUESTS_ENDPOINT}/${encodeURIComponent(
          assignment.returnRequestDbId
        )}`,
        returnPatch
      );
    }

    return updatedAssignment;
  },

  startPickup: async (
    assignment: AgentAssignment
  ): Promise<AgentAssignment> => {
    return pickupAgentService.updateAssignmentStatus({
      assignment,
      status: "OUT_FOR_PICKUP",
      remarks: "Pickup agent started the return pickup."
    });
  },

  markPickupAttempted: async ({
    assignment,
    remarks
  }: {
    assignment: AgentAssignment;
    remarks: string;
  }): Promise<AgentAssignment> => {
    return pickupAgentService.updateAssignmentStatus({
      assignment,
      status: "PICKUP_ATTEMPTED",
      remarks
    });
  },

  createPickupProof: async (
    payload: CreatePickupProofPayload
  ): Promise<PickupProof> => {
    const now = new Date().toISOString();

    const proof: PickupProof = {
      ...payload,
      id: generatePickupProofDbId(),
      proofId: generatePickupProofId(),
      capturedAt: now,
      createdAt: now
    };

    return apiClient.post<PickupProof, PickupProof>(
      PICKUP_PROOFS_ENDPOINT,
      proof
    );
  },

  completePickup: async ({
    assignment,
    proofPayload
  }: {
    assignment: AgentAssignment;
    proofPayload: CreatePickupProofPayload;
  }): Promise<{
    assignment: AgentAssignment;
    proof: PickupProof;
  }> => {
    const proof = await pickupAgentService.createPickupProof(proofPayload);

    const updatedAssignment = await pickupAgentService.updateAssignmentStatus({
      assignment,
      status: "PICKUP_COMPLETED",
      remarks:
        proofPayload.agentRemarks ??
        "Return package picked up successfully with proof."
    });

    return {
      assignment: updatedAssignment,
      proof
    };
  }
};