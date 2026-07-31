import { apiClient } from "./apiClient";
import type {
  AgentAssignment,
  AgentAssignmentStatus,
  AgentTaskLog
} from "../types/agentAssignment";
import type {
  CreateDeliveryProofPayload,
  DeliveryProof
} from "../types/deliveryAgent";
import { agentNotificationService } from "./agentNotificationService";

const AGENT_ASSIGNMENTS_ENDPOINT = "/agentAssignments";
const AGENT_TASK_LOGS_ENDPOINT = "/agentTaskLogs";
const DELIVERY_PROOFS_ENDPOINT = "/deliveryProofs";
const ORDERS_ENDPOINT = "/orders";

type OrderTrackingStep = {
  label: string;
  isCompleted: boolean;
};

type OrderTrackingEvent = {
  id: string;
  status: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  isCompleted: boolean;
};

type OrderLike = {
  id: string;
  orderId?: string;
  orderStatus?: string;
  fulfillmentStatus?: string;
  deliveryStatus?: string;
  deliveredAt?: string;
  deliveryFailedAt?: string;
  deliveryAttemptCount?: number;
  lastDeliveryAttemptId?: string;
  trackingSteps?: OrderTrackingStep[];
  trackingEvents?: OrderTrackingEvent[];
  updatedAt?: string;
};

const generateDeliveryProofDbId = (): string => {
  return `delivery-proof-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const generateDeliveryProofId = (): string => {
  return `DLY-PRF-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${Date.now()}`;
};

const generateTaskLogDbId = (): string => {
  return `agent-task-log-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const generateTrackingEventId = (): string => {
  return `track-delivery-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const sortAssignmentsByLatest = (
  assignments: AgentAssignment[]
): AgentAssignment[] => {
  return [...assignments].sort(
    (first, second) =>
      new Date(second.updatedAt ?? 0).getTime() -
      new Date(first.updatedAt ?? 0).getTime()
  );
};

const updateTrackingSteps = ({
  steps,
  status
}: {
  steps?: OrderTrackingStep[];
  status: AgentAssignmentStatus;
}): OrderTrackingStep[] | undefined => {
  if (!steps || steps.length === 0) {
    return steps;
  }

  const completedLabelsByStatus: Record<string, string[]> = {
    OUT_FOR_DELIVERY: ["order placed", "packed", "shipped", "out for delivery"],
    DELIVERY_ATTEMPTED: ["order placed", "packed", "shipped", "out for delivery"],
    FAILED: ["order placed", "packed", "shipped", "out for delivery"],
    DELIVERED: [
      "order placed",
      "packed",
      "shipped",
      "out for delivery",
      "delivered"
    ]
  };

  const completedLabels = completedLabelsByStatus[status] ?? [];

  return steps.map((step) => ({
    ...step,
    isCompleted: completedLabels.includes(step.label.toLowerCase().trim())
  }));
};

const buildTrackingEvent = ({
  status,
  title,
  description
}: {
  status: string;
  title: string;
  description: string;
}): OrderTrackingEvent => {
  return {
    id: generateTrackingEventId(),
    status,
    title,
    description,
    location: "Delivery Partner",
    timestamp: new Date().toISOString(),
    isCompleted: true
  };
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
    assignmentId: assignment.assignmentId ?? assignment.id,
    taskType: assignment.taskType,
    taskId: assignment.taskId,
    agentId: assignment.agentId,
    status,
    remarks,
    createdByUserId: assignment.agentId,
    createdByName: assignment.agentName,
    createdAt: new Date().toISOString()
  };

  return apiClient.post<AgentTaskLog, AgentTaskLog>(
    AGENT_TASK_LOGS_ENDPOINT,
    log
  );
};

const patchOrderStatus = async ({
  assignment,
  status,
  remarks
}: {
  assignment: AgentAssignment;
  status: AgentAssignmentStatus;
  remarks?: string;
}): Promise<void> => {
  if (!assignment.orderDbId) {
    return;
  }

  const now = new Date().toISOString();

  try {
    const order = await apiClient.get<OrderLike>(
      `${ORDERS_ENDPOINT}/${encodeURIComponent(assignment.orderDbId)}`
    );

    const existingEvents = Array.isArray(order.trackingEvents)
      ? order.trackingEvents
      : [];

    const orderPatch: Partial<OrderLike> = {
      updatedAt: now
    };

    if (status === "OUT_FOR_DELIVERY") {
      orderPatch.deliveryStatus = "OUT_FOR_DELIVERY";
      orderPatch.fulfillmentStatus = "OUT_FOR_DELIVERY";
      orderPatch.trackingSteps = updateTrackingSteps({
        steps: order.trackingSteps,
        status
      });
      orderPatch.trackingEvents = [
        ...existingEvents,
        buildTrackingEvent({
          status: "Out for Delivery",
          title: "Package is out for delivery",
          description:
            remarks ?? "Your package has been assigned to a delivery partner."
        })
      ];
    }

    if (status === "DELIVERY_ATTEMPTED" || status === "FAILED") {
      orderPatch.deliveryStatus = "DELIVERY_ATTEMPTED";
      orderPatch.fulfillmentStatus = "DELIVERY_ATTEMPTED";
      orderPatch.deliveryFailedAt = now;
      orderPatch.deliveryAttemptCount = (order.deliveryAttemptCount ?? 0) + 1;
      orderPatch.lastDeliveryAttemptId = assignment.assignmentId ?? assignment.id;
      orderPatch.trackingSteps = updateTrackingSteps({
        steps: order.trackingSteps,
        status
      });
      orderPatch.trackingEvents = [
        ...existingEvents,
        buildTrackingEvent({
          status: "Delivery Attempted",
          title: "Delivery attempt was not completed",
          description:
            remarks ??
            "Delivery partner attempted delivery but could not complete it."
        })
      ];
    }

    if (status === "DELIVERED") {
      orderPatch.deliveryStatus = "DELIVERED";
      orderPatch.fulfillmentStatus = "DELIVERED";
      orderPatch.orderStatus = "Delivered";
      orderPatch.deliveredAt = now;
      orderPatch.trackingSteps = updateTrackingSteps({
        steps: order.trackingSteps,
        status
      });
      orderPatch.trackingEvents = [
        ...existingEvents,
        buildTrackingEvent({
          status: "Delivered",
          title: "Package delivered successfully",
          description:
            remarks ?? "Your package has been delivered successfully."
        })
      ];
    }

    await apiClient.patch<OrderLike, Partial<OrderLike>>(
      `${ORDERS_ENDPOINT}/${encodeURIComponent(assignment.orderDbId)}`,
      orderPatch
    );
  } catch {
    // Order sync failure should not block assignment update.
  }
};

export const deliveryAgentService = {
  getDeliveryTasksByAgentId: async (
    agentId: string
  ): Promise<AgentAssignment[]> => {
    const assignments = await apiClient.get<AgentAssignment[]>(
      `${AGENT_ASSIGNMENTS_ENDPOINT}?agentId=${encodeURIComponent(
        agentId
      )}&taskType=ORDER_DELIVERY`
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
    const currentAttemptCount = assignment.attemptCount ?? 0;

    const nextAttemptCount =
      status === "DELIVERY_ATTEMPTED" || status === "FAILED"
        ? currentAttemptCount + 1
        : currentAttemptCount;

    const targetId = assignment.id || assignment.assignmentId;

    const updatedAssignment = await apiClient.patch<
      AgentAssignment,
      Partial<AgentAssignment>
    >(`${AGENT_ASSIGNMENTS_ENDPOINT}/${encodeURIComponent(targetId)}`, {
      status,
      remarks: remarks ?? assignment.remarks,
      attemptCount: nextAttemptCount,
      lastAttemptAt:
        status === "DELIVERY_ATTEMPTED" || status === "FAILED"
          ? now
          : assignment.lastAttemptAt,
      updatedAt: now
    });

    await createTaskLog({
      assignment: updatedAssignment,
      status,
      remarks
    });

    if (status === "DELIVERY_ATTEMPTED" || status === "FAILED") {
      await agentNotificationService.notifyAdminsTaskStatusChanged({
        assignment: updatedAssignment,
        title: "Delivery attempt failed",
        message: `Delivery attempt failed for ${updatedAssignment.taskId}. Reason: ${remarks ?? "No reason provided"
          }`,
        severity: "warning"
      });
    }

    if (status === "DELIVERED") {
      await agentNotificationService.notifyAdminsTaskStatusChanged({
        assignment: updatedAssignment,
        title: "Delivery completed",
        message: `Delivery completed successfully for ${updatedAssignment.taskId}.`,
        severity: "success"
      });
    }

    await patchOrderStatus({
      assignment: updatedAssignment,
      status,
      remarks
    });

    return updatedAssignment;
  },

  startDelivery: async (
    assignment: AgentAssignment
  ): Promise<AgentAssignment> => {
    return deliveryAgentService.updateAssignmentStatus({
      assignment,
      status: "OUT_FOR_DELIVERY",
      remarks: "Delivery agent started the delivery task."
    });
  },

  markDeliveryAttempted: async ({
    assignment,
    remarks
  }: {
    assignment: AgentAssignment;
    remarks: string;
  }): Promise<AgentAssignment> => {
    return deliveryAgentService.updateAssignmentStatus({
      assignment,
      status: "DELIVERY_ATTEMPTED",
      remarks
    });
  },

  createDeliveryProof: async (
    payload: CreateDeliveryProofPayload
  ): Promise<DeliveryProof> => {
    const now = new Date().toISOString();

    const proof: DeliveryProof = {
      ...payload,
      id: generateDeliveryProofDbId(),
      proofId: generateDeliveryProofId(),
      deliveredAt: now,
      createdAt: now
    };

    return apiClient.post<DeliveryProof, DeliveryProof>(
      DELIVERY_PROOFS_ENDPOINT,
      proof
    );
  },

  completeDelivery: async ({
    assignment,
    proofPayload
  }: {
    assignment: AgentAssignment;
    proofPayload: CreateDeliveryProofPayload;
  }): Promise<{
    assignment: AgentAssignment;
    proof: DeliveryProof;
  }> => {
    const proof = await deliveryAgentService.createDeliveryProof(proofPayload);

    const updatedAssignment = await deliveryAgentService.updateAssignmentStatus({
      assignment,
      status: "DELIVERED",
      remarks:
        proofPayload.agentRemarks ??
        "Order delivered successfully with delivery proof."
    });

    return {
      assignment: updatedAssignment,
      proof
    };
  }
};