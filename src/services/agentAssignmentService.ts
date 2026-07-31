import { apiClient } from "./apiClient";
import type { ReturnRequest } from "../types/returnRequest";
import type {
  AgentAssignment,
  AgentProfile,
  AgentTaskLog,
  AgentTaskType,
  AssignAgentPayload,
  CreateAgentAssignmentPayload,
  UpdateAgentAssignmentPayload
} from "../types/agentAssignment";
import { assertValidDeleteId } from "../utils/deleteSafetyUtils";
import {
  buildAgentCapacityErrorMessage,
  getAgentRemainingCapacity
} from "../utils/agentWorkloadUtils";
import { agentNotificationService } from "./agentNotificationService";

const RETURN_REQUESTS_ENDPOINT = "/returnRequests";
const ORDERS_ENDPOINT = "/orders";
const AGENTS_ENDPOINT = "/agentProfiles";
const RETURN_PICKUP_PARTNERS_ENDPOINT = "/returnPickupPartners";
const AGENT_ASSIGNMENTS_ENDPOINT = "/agentAssignments";
const AGENT_TASK_LOGS_ENDPOINT = "/agentTaskLogs";

type DeliveryAddressObject = {
  fullName?: string;
  mobile?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

type OrderLike = {
  id: string;
  orderId?: string;
  userId?: string;
  customerName?: string;
  userName?: string;
  customerPhone?: string;
  phone?: string;
  customerEmail?: string;
  userEmail?: string;
  shippingAddress?: string | DeliveryAddressObject;
  deliveryAddress?: string | DeliveryAddressObject;
  address?: string | DeliveryAddressObject;
  pincode?: string;
  city?: string;
  state?: string;
  status?: string;
  orderStatus?: string;
  fulfillmentStatus?: string;
  deliveryStatus?: string;
  deliveryDate?: string;
  deliverySlot?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ReturnPickupPartnerLike = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role?: string;
  partnerId?: string;
  pickupPartnerId?: string;
};

type CreateTaskLogInput = {
  assignment: AgentAssignment;
  status: AgentAssignment["status"];
  remarks?: string;
  createdByUserId?: string;
  createdByName?: string;
};

const generateAssignmentDbId = (): string => {
  return `agent-assignment-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const generateAssignmentId = (): string => {
  return `AGT-ASG-${new Date()
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
    (firstAssignment, secondAssignment) =>
      getSafeTime(secondAssignment.updatedAt) -
      getSafeTime(firstAssignment.updatedAt)
  );
};

const getReturnDisplayId = (request: ReturnRequest): string => {
  return request.returnRequestId ?? request.requestId ?? request.id;
};

const extractPincode = (address?: string | null): string | undefined => {
  if (!address) {
    return undefined;
  }

  const match = address.match(/\b\d{6}\b/);

  return match?.[0];
};

const normalizeAddress = (
  address?: string | DeliveryAddressObject | null
): {
  addressText: string;
  customerName?: string;
  customerPhone?: string;
  city?: string;
  state?: string;
  pincode?: string;
} => {
  if (!address) {
    return {
      addressText: "Address not available"
    };
  }

  if (typeof address === "string") {
    return {
      addressText: address,
      pincode: extractPincode(address)
    };
  }

  const addressParts = [
    address.fullName,
    address.mobile,
    address.addressLine,
    address.city,
    address.state,
    address.pincode
  ].filter(Boolean);

  const addressText = addressParts.join(", ");

  return {
    addressText: addressText || "Address not available",
    customerName: address.fullName,
    customerPhone: address.mobile,
    city: address.city,
    state: address.state,
    pincode: address.pincode
  };
};

const getReturnCustomerName = (request: ReturnRequest): string => {
  return request.userName ?? "Customer";
};

const getReturnCustomerPhone = (request: ReturnRequest): string | undefined => {
  const pickupAddress = request.pickupAddress ?? "";
  const phoneMatch = pickupAddress.match(/\b[6-9]\d{9}\b/);

  return phoneMatch?.[0];
};

const isReturnPickupAssignable = (request: ReturnRequest): boolean => {
  const pickupStatus = request.pickupStatus?.trim().toUpperCase() ?? "";
  const returnStatus = request.status?.trim().toUpperCase() ?? "";

  if (["CANCELLED", "REJECTED", "REFUND_COMPLETED"].includes(returnStatus)) {
    return false;
  }

  return ["NOT_SCHEDULED", "SCHEDULED", "PENDING", ""].includes(pickupStatus);
};

const isOrderDeliveryAssignable = (order: OrderLike): boolean => {
  const deliveryStatus = order.deliveryStatus?.trim().toUpperCase() ?? "";
  const fulfillmentStatus = order.fulfillmentStatus?.trim().toUpperCase() ?? "";
  const orderStatus = (
    order.status ??
    order.orderStatus ??
    ""
  ).trim().toUpperCase();

  return (
    !["DELIVERED", "CANCELLED", "RETURNED"].includes(deliveryStatus) &&
    !["DELIVERED", "CANCELLED", "RETURNED"].includes(fulfillmentStatus) &&
    !["DELIVERED", "CANCELLED", "RETURNED"].includes(orderStatus)
  );
};

const mapPickupPartnerToAgentProfile = (
  partner: ReturnPickupPartnerLike
): AgentProfile => {
  return {
    id: partner.id,
    agentId: partner.pickupPartnerId ?? partner.partnerId ?? partner.id,
    name: partner.name,
    phone: partner.phone,
    email: partner.email,
    agentType: "PICKUP_AGENT",
    servicePincodes: [],
    status: "ACTIVE",
    maxDailyTasks: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

const dedupeAgentsByAgentId = (agents: AgentProfile[]): AgentProfile[] => {
  const agentMap = new Map<string, AgentProfile>();

  agents.forEach((agent) => {
    const key = agent.agentId || agent.id;

    if (!key) {
      return;
    }

    if (!agentMap.has(key)) {
      agentMap.set(key, agent);
    }
  });

  return Array.from(agentMap.values());
};

const buildReturnAssignmentPayload = (
  request: ReturnRequest
): CreateAgentAssignmentPayload => {
  const returnRequestId = getReturnDisplayId(request);
  const pickupAddress = request.pickupAddress ?? "Pickup address not available";

  return {
    taskType: "RETURN_PICKUP",
    taskId: returnRequestId,
    returnRequestId,
    returnRequestDbId: request.id,
    orderId: request.orderId,
    orderDbId: request.orderDbId,
    userId: request.userId,
    customerName: getReturnCustomerName(request),
    customerPhone: getReturnCustomerPhone(request),
    customerEmail: request.userEmail,
    address: pickupAddress,
    pincode: extractPincode(pickupAddress),
    priority:
      request.refundAmount && request.refundAmount >= 50000 ? "HIGH" : "MEDIUM",
    scheduledDate: request.pickupDate ?? undefined,
    scheduledSlot: request.pickupSlot ?? undefined,
    remarks: request.adminRemarks ?? undefined
  };
};

const buildOrderAssignmentPayload = (
  order: OrderLike
): CreateAgentAssignmentPayload => {
  const orderId = order.orderId ?? order.id;

  const normalizedAddress = normalizeAddress(
    order.shippingAddress ?? order.deliveryAddress ?? order.address
  );

  return {
    taskType: "ORDER_DELIVERY",
    taskId: orderId,
    orderId,
    orderDbId: order.id,
    userId: order.userId,
    customerName:
      order.customerName ??
      order.userName ??
      normalizedAddress.customerName ??
      "Customer",
    customerPhone:
      order.customerPhone ?? order.phone ?? normalizedAddress.customerPhone,
    customerEmail: order.customerEmail ?? order.userEmail,
    address: normalizedAddress.addressText,
    pincode: order.pincode ?? normalizedAddress.pincode,
    city: order.city ?? normalizedAddress.city,
    state: order.state ?? normalizedAddress.state,
    priority: "MEDIUM",
    scheduledDate: order.deliveryDate,
    scheduledSlot: order.deliverySlot
  };
};

const buildAssignmentFromPayload = (
  payload: CreateAgentAssignmentPayload
): AgentAssignment => {
  const now = new Date().toISOString();

  return {
    ...payload,
    id: generateAssignmentDbId(),
    assignmentId: generateAssignmentId(),
    status: "UNASSIGNED",
    attemptCount: 0,
    createdAt: now,
    updatedAt: now
  };
};

const buildAssignmentFromReturnRequest = (
  request: ReturnRequest
): AgentAssignment => {
  const assignment = buildAssignmentFromPayload(
    buildReturnAssignmentPayload(request)
  );

  if (request.pickupPartnerId || request.pickupPartnerName) {
    return {
      ...assignment,
      agentId: request.pickupPartnerId ?? undefined,
      agentName: request.pickupPartnerName ?? undefined,
      agentPhone: request.pickupPartnerPhone ?? undefined,
      agentType: "PICKUP_AGENT",
      status: "ASSIGNED",
      assignedAt: request.pickupScheduledAt ?? request.updatedAt,
      scheduledDate: request.pickupDate ?? undefined,
      scheduledSlot: request.pickupSlot ?? undefined
    };
  }

  return assignment;
};

export const agentAssignmentService = {
  getAgents: async (): Promise<AgentProfile[]> => {
    try {
      const agents = await apiClient.get<AgentProfile[]>(AGENTS_ENDPOINT);

      if (Array.isArray(agents) && agents.length > 0) {
        return dedupeAgentsByAgentId(agents);
      }
    } catch {
      // Fallback to returnPickupPartners below.
    }

    try {
      const pickupPartners = await apiClient.get<ReturnPickupPartnerLike[]>(
        RETURN_PICKUP_PARTNERS_ENDPOINT
      );

      return Array.isArray(pickupPartners)
        ? dedupeAgentsByAgentId(
          pickupPartners.map(mapPickupPartnerToAgentProfile)
        )
        : [];
    } catch {
      return [];
    }
  },

  getActiveAgents: async (): Promise<AgentProfile[]> => {
    const agents = await agentAssignmentService.getAgents();

    return agents.filter((agent) => agent.status === "ACTIVE");
  },

  getAssignments: async (): Promise<AgentAssignment[]> => {
    try {
      const assignments = await apiClient.get<AgentAssignment[]>(
        AGENT_ASSIGNMENTS_ENDPOINT
      );

      return sortAssignmentsByLatest(
        Array.isArray(assignments) ? assignments : []
      );
    } catch {
      return [];
    }
  },

  getAssignmentsByAgentId: async (
    agentId: string
  ): Promise<AgentAssignment[]> => {
    try {
      const assignments = await apiClient.get<AgentAssignment[]>(
        `${AGENT_ASSIGNMENTS_ENDPOINT}?agentId=${encodeURIComponent(agentId)}`
      );

      return sortAssignmentsByLatest(
        Array.isArray(assignments) ? assignments : []
      );
    } catch {
      return [];
    }
  },

  getAssignmentByTask: async ({
    taskType,
    taskId
  }: {
    taskType: AgentTaskType;
    taskId: string;
  }): Promise<AgentAssignment | undefined> => {
    try {
      const assignments = await apiClient.get<AgentAssignment[]>(
        `${AGENT_ASSIGNMENTS_ENDPOINT}?taskType=${encodeURIComponent(
          taskType
        )}&taskId=${encodeURIComponent(taskId)}`
      );

      return Array.isArray(assignments) ? assignments[0] : undefined;
    } catch {
      return undefined;
    }
  },

  createAssignment: async (
    payload: CreateAgentAssignmentPayload
  ): Promise<AgentAssignment> => {
    const assignment = buildAssignmentFromPayload(payload);

    return apiClient.post<AgentAssignment, AgentAssignment>(
      AGENT_ASSIGNMENTS_ENDPOINT,
      assignment
    );
  },

  createTaskLog: async ({
    assignment,
    status,
    remarks,
    createdByUserId,
    createdByName
  }: CreateTaskLogInput): Promise<AgentTaskLog> => {
    const log: AgentTaskLog = {
      id: generateTaskLogDbId(),
      assignmentId: assignment.assignmentId,
      taskType: assignment.taskType,
      taskId: assignment.taskId,
      agentId: assignment.agentId,
      status,
      remarks,
      createdByUserId,
      createdByName,
      createdAt: new Date().toISOString()
    };

    return apiClient.post<AgentTaskLog, AgentTaskLog>(
      AGENT_TASK_LOGS_ENDPOINT,
      log
    );
  },

  updateAssignment: async (
    assignmentDbId: string,
    payload: UpdateAgentAssignmentPayload
  ): Promise<AgentAssignment> => {
    return apiClient.patch<AgentAssignment, UpdateAgentAssignmentPayload>(
      `${AGENT_ASSIGNMENTS_ENDPOINT}/${encodeURIComponent(assignmentDbId)}`,
      {
        ...payload,
        updatedAt: new Date().toISOString()
      }
    );
  },

  validateAgentCapacity: async ({
    agent,
    scheduledDate,
    ignoreAssignmentDbId
  }: {
    agent: AgentProfile;
    scheduledDate?: string;
    ignoreAssignmentDbId?: string;
  }): Promise<void> => {
    const assignments = await agentAssignmentService.getAssignments();

    const capacity = getAgentRemainingCapacity({
      agent,
      assignments,
      scheduledDate,
      ignoreAssignmentDbId
    });

    if (capacity.isCapacityReached) {
      throw new Error(
        buildAgentCapacityErrorMessage({
          agentName: agent.name,
          date: scheduledDate,
          maxDailyTasks: capacity.maxDailyTasks
        })
      );
    }
  },

  assignAgent: async ({
    assignment,
    payload
  }: {
    assignment: AgentAssignment;
    payload: AssignAgentPayload;
  }): Promise<AgentAssignment> => {
    const now = new Date().toISOString();

    const targetDate =
      payload.scheduledDate ?? assignment.scheduledDate ?? now;

    const agents = await agentAssignmentService.getAgents();

    const selectedAgent = agents.find(
      (agent) =>
        agent.agentId === payload.agentId ||
        agent.id === payload.agentId
    );

    if (selectedAgent) {
      await agentAssignmentService.validateAgentCapacity({
        agent: selectedAgent,
        scheduledDate: targetDate,
        ignoreAssignmentDbId: assignment.id
      });
    }

    let persistedAssignment = assignment;

    const existingAssignment = await agentAssignmentService.getAssignmentByTask({
      taskType: assignment.taskType,
      taskId: assignment.taskId
    });

    if (!existingAssignment) {
      persistedAssignment = await apiClient.post<
        AgentAssignment,
        AgentAssignment
      >(AGENT_ASSIGNMENTS_ENDPOINT, assignment);
    }

    const assignmentToUpdate = existingAssignment ?? persistedAssignment;

    const updatedAssignment = await agentAssignmentService.updateAssignment(
      assignmentToUpdate.id,
      {
        agentId: payload.agentId,
        agentName: payload.agentName,
        agentPhone: payload.agentPhone,
        agentType: payload.agentType,
        assignedByUserId: payload.assignedByUserId,
        assignedByName: payload.assignedByName,
        assignedAt: now,
        scheduledDate: targetDate,
        scheduledSlot: payload.scheduledSlot ?? assignment.scheduledSlot,
        remarks: payload.remarks ?? assignment.remarks,
        status: "ASSIGNED"
      }
    );

    await agentAssignmentService.createTaskLog({
      assignment: updatedAssignment,
      status: "ASSIGNED",
      remarks: `Assigned to ${payload.agentName}.`,
      createdByUserId: payload.assignedByUserId,
      createdByName: payload.assignedByName
    });

    await agentNotificationService.notifyAgentAssigned({
      assignment: updatedAssignment,
      assignedAgentRole: payload.agentType
    });

    if (
      assignment.taskType === "RETURN_PICKUP" &&
      assignment.returnRequestDbId
    ) {
      await apiClient.patch<ReturnRequest, Partial<ReturnRequest>>(
        `${RETURN_REQUESTS_ENDPOINT}/${encodeURIComponent(
          assignment.returnRequestDbId
        )}`,
        {
          pickupPartnerId: payload.agentId,
          pickupPartnerName: payload.agentName,
          pickupPartnerPhone: payload.agentPhone,
          pickupStatus: "SCHEDULED",
          pickupDate: targetDate,
          pickupSlot: payload.scheduledSlot ?? assignment.scheduledSlot,
          pickupScheduledAt: now,
          updatedAt: now
        }
      );
    }

    if (assignment.taskType === "ORDER_DELIVERY" && assignment.orderDbId) {
      await apiClient.patch<OrderLike, Partial<OrderLike>>(
        `${ORDERS_ENDPOINT}/${encodeURIComponent(assignment.orderDbId)}`,
        {
          deliveryStatus: "ASSIGNED",
          fulfillmentStatus: "DELIVERY_ASSIGNED",
          updatedAt: now
        }
      );
    }

    return updatedAssignment;
  },

  syncReturnPickupCandidates: async (): Promise<AgentAssignment[]> => {
    const [requests, assignments] = await Promise.all([
      apiClient.get<ReturnRequest[]>(RETURN_REQUESTS_ENDPOINT),
      agentAssignmentService.getAssignments()
    ]);

    const safeRequests = Array.isArray(requests) ? requests : [];

    const existingTaskKeys = new Set(
      assignments
        .filter((assignment) => assignment.taskType === "RETURN_PICKUP")
        .map((assignment) => assignment.taskId)
    );

    return safeRequests
      .filter(isReturnPickupAssignable)
      .map(buildAssignmentFromReturnRequest)
      .filter((assignment) => !existingTaskKeys.has(assignment.taskId));
  },

  syncOrderDeliveryCandidates: async (): Promise<AgentAssignment[]> => {
    let orders: OrderLike[] = [];

    try {
      const orderResponse = await apiClient.get<OrderLike[]>(ORDERS_ENDPOINT);
      orders = Array.isArray(orderResponse) ? orderResponse : [];
    } catch {
      orders = [];
    }

    const assignments = await agentAssignmentService.getAssignments();

    const existingTaskKeys = new Set(
      assignments
        .filter((assignment) => assignment.taskType === "ORDER_DELIVERY")
        .map((assignment) => assignment.taskId)
    );

    return orders
      .filter(isOrderDeliveryAssignable)
      .map(buildOrderAssignmentPayload)
      .map(buildAssignmentFromPayload)
      .filter((assignment) => !existingTaskKeys.has(assignment.taskId));
  },

  syncAssignmentCandidates: async (): Promise<AgentAssignment[]> => {
    const currentAssignments = await agentAssignmentService.getAssignments();

    let pickupAssignments: AgentAssignment[] = [];
    let deliveryAssignments: AgentAssignment[] = [];

    try {
      pickupAssignments =
        await agentAssignmentService.syncReturnPickupCandidates();
    } catch {
      pickupAssignments = [];
    }

    try {
      deliveryAssignments =
        await agentAssignmentService.syncOrderDeliveryCandidates();
    } catch {
      deliveryAssignments = [];
    }

    const assignmentMap = new Map<string, AgentAssignment>();

    [...pickupAssignments, ...deliveryAssignments, ...currentAssignments].forEach(
      (assignment) => {
        const key = `${assignment.taskType}-${assignment.taskId}`;
        assignmentMap.set(key, assignment);
      }
    );

    return sortAssignmentsByLatest(Array.from(assignmentMap.values()));
  },

  deleteAssignment: async (assignmentDbId: string): Promise<void> => {
    assertValidDeleteId({
      entityType: "agentAssignment",
      id: assignmentDbId
    });

    await apiClient.delete<void>(
      `${AGENT_ASSIGNMENTS_ENDPOINT}/${encodeURIComponent(assignmentDbId)}`
    );
  }
};