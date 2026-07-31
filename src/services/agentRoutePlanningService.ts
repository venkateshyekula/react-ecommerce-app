import { apiClient } from "./apiClient";
import type {
  AgentAssignment,
  AgentAssignmentStatus,
  AgentProfile,
  AgentTaskType
} from "../types/agentAssignment";
import type {
  AgentRouteCluster,
  AgentRoutePlanningDashboardData,
  AgentRouteSuggestion,
  AgentRouteTask,
  RouteClusterPriority
} from "../types/agentRoutePlanning";
import {
  getAgentDailyAssignedCount,
  getAgentMaxDailyTasks,
  getDateKey
} from "../utils/agentWorkloadUtils";

const AGENT_ASSIGNMENTS_ENDPOINT = "/agentAssignments";
const AGENTS_ENDPOINT = "/agentProfiles";
const RETURN_PICKUP_PARTNERS_ENDPOINT = "/returnPickupPartners";

type ReturnPickupPartnerLike = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role?: string;
  partnerId?: string;
  pickupPartnerId?: string;
};

const activeTaskStatuses: AgentAssignmentStatus[] = [
  "UNASSIGNED",
  "ASSIGNED",
  "ACCEPTED",
  "OUT_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "PICKUP_ATTEMPTED",
  "DELIVERY_ATTEMPTED",
  "REASSIGNED"
];

const completedTaskStatuses: AgentAssignmentStatus[] = [
  "PICKUP_COMPLETED",
  "DELIVERED",
  "CANCELLED"
];

const getSafeDateKey = (dateValue?: string): string => {
  return getDateKey(dateValue ?? new Date().toISOString());
};

const normalizePincode = (assignment: AgentAssignment): string => {
  if (assignment.pincode?.trim()) {
    return assignment.pincode.trim();
  }

  const match = assignment.address?.match(/\b\d{6}\b/);

  return match?.[0] ?? "UNKNOWN";
};

const normalizeCity = (assignment: AgentAssignment): string | undefined => {
  return assignment.city?.trim() || undefined;
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
    city: undefined,
    status: "ACTIVE",
    maxDailyTasks: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

const dedupeAgentsByAgentId = (agents: AgentProfile[]): AgentProfile[] => {
  const agentMap = new Map<string, AgentProfile>();

  agents.forEach((agent) => {
    const key = agent.agentId?.trim() || agent.id;

    if (key && !agentMap.has(key)) {
      agentMap.set(key, agent);
    }
  });

  return Array.from(agentMap.values());
};

const getAgents = async (): Promise<AgentProfile[]> => {
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
};

const canAgentHandleTaskType = ({
  agent,
  taskType
}: {
  agent: AgentProfile;
  taskType: AgentTaskType | "MIXED";
}): boolean => {
  if (agent.status !== "ACTIVE") {
    return false;
  }

  if (agent.agentType === "BOTH" || agent.agentType === "LOGISTICS_AGENT") {
    return true;
  }

  if (taskType === "MIXED") {
    return false;
  }

  if (taskType === "RETURN_PICKUP") {
    return agent.agentType === "PICKUP_AGENT";
  }

  if (taskType === "ORDER_DELIVERY") {
    return agent.agentType === "DELIVERY_AGENT";
  }

  return false;
};

const isPincodeSupported = ({
  agent,
  pincode
}: {
  agent: AgentProfile;
  pincode: string;
}): boolean => {
  if (pincode === "UNKNOWN") {
    return false;
  }

  if (!agent.servicePincodes || agent.servicePincodes.length === 0) {
    return true;
  }

  return agent.servicePincodes.includes(pincode);
};

const getPriorityScore = (priority: RouteClusterPriority): number => {
  switch (priority) {
    case "URGENT":
      return 4;
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    default:
      return 1;
  }
};

const mapAssignmentToRouteTask = (
  assignment: AgentAssignment
): AgentRouteTask => {
  return {
    assignment,
    taskType: assignment.taskType,
    taskId: assignment.taskId,
    customerName: assignment.customerName,
    address: assignment.address,
    pincode: normalizePincode(assignment),
    city: normalizeCity(assignment),
    scheduledDate: assignment.scheduledDate,
    scheduledSlot: assignment.scheduledSlot,
    priority: assignment.priority,
    agentId: assignment.agentId,
    agentName: assignment.agentName,
    status: assignment.status
  };
};

const getClusterTaskType = (
  tasks: AgentRouteTask[]
): AgentTaskType | "MIXED" => {
  const taskTypes = new Set(tasks.map((task) => task.taskType));

  if (taskTypes.size === 1) {
    return tasks[0]?.taskType ?? "RETURN_PICKUP";
  }

  return "MIXED";
};

const buildAgentSuggestions = ({
  agents,
  assignments,
  cluster
}: {
  agents: AgentProfile[];
  assignments: AgentAssignment[];
  cluster: Omit<AgentRouteCluster, "suggestedAgents">;
}): AgentRouteSuggestion[] => {
  return agents
    .filter((agent) =>
      canAgentHandleTaskType({
        agent,
        taskType: cluster.taskType
      })
    )
    .map((agent) => {
      const selectedDate = cluster.scheduledDate ?? new Date().toISOString();

      const assignedTodayCount = getAgentDailyAssignedCount({
        assignments,
        agentId: agent.agentId,
        scheduledDate: selectedDate
      });

      const maxDailyTasks = getAgentMaxDailyTasks(agent);
      const isUnlimited = maxDailyTasks <= 0;

      const remainingCapacity = isUnlimited
        ? 999
        : Math.max(maxDailyTasks - assignedTodayCount, 0);

      const pincodeSupported = isPincodeSupported({
        agent,
        pincode: cluster.pincode
      });

      const hasExplicitPincodes = Boolean(
        agent.servicePincodes && agent.servicePincodes.length > 0
      );

      const capacityScore = Math.min(remainingCapacity, 10);
      const pincodeScore = pincodeSupported ? 15 : 0;
      const taskLoadScore = Math.max(10 - assignedTodayCount, 0);
      const urgencyScore = cluster.urgentTasks > 0 ? 5 : 0;
      const logisticsScore =
        agent.agentType === "LOGISTICS_AGENT" || agent.agentType === "BOTH"
          ? 3
          : 0;

      const score =
        capacityScore +
        pincodeScore +
        taskLoadScore +
        urgencyScore +
        logisticsScore;

      // Updated recommendation reason logic
      const recommendationReason = !hasExplicitPincodes
        ? `${agent.name} has open service pincodes and ${remainingCapacity} remaining capacity.`
        : pincodeSupported
        ? `${agent.name} supports pincode ${cluster.pincode} and has ${remainingCapacity} remaining capacity.`
        : `${agent.name} can handle the task type, but pincode ${cluster.pincode} is not explicitly in service pincodes.`;

      return {
        agent,
        assignedTodayCount,
        remainingCapacity,
        isCapacityAvailable: remainingCapacity > 0,
        isPincodeSupported: pincodeSupported,
        score,
        recommendationReason
      };
    })
    .filter((suggestion) => suggestion.isCapacityAvailable)
    .sort((first, second) => second.score - first.score)
    .slice(0, 3);
};

const buildClusters = ({
  assignments,
  agents
}: {
  assignments: AgentAssignment[];
  agents: AgentProfile[];
}): AgentRouteCluster[] => {
  const eligibleAssignments = assignments.filter((assignment) => {
    return (
      activeTaskStatuses.includes(assignment.status) &&
      !completedTaskStatuses.includes(assignment.status)
    );
  });

  const clusterMap = new Map<string, AgentRouteTask[]>();

  eligibleAssignments.forEach((assignment) => {
    const task = mapAssignmentToRouteTask(assignment);
    const dateKey = getSafeDateKey(assignment.scheduledDate);
    const pincode = task.pincode ?? "UNKNOWN";
    const city = task.city ?? "ALL";
    const key = `${dateKey}-${pincode}-${city}`;

    const existingTasks = clusterMap.get(key) ?? [];
    existingTasks.push(task);
    clusterMap.set(key, existingTasks);
  });

  return Array.from(clusterMap.entries())
    .map(([key, tasks]) => {
      const firstTask = tasks[0];

      const taskType = getClusterTaskType(tasks);
      const pincode = firstTask?.pincode ?? "UNKNOWN";
      const city = firstTask?.city;
      const scheduledDate = firstTask?.scheduledDate;

      const pickupTasks = tasks.filter(
        (task) => task.taskType === "RETURN_PICKUP"
      ).length;

      const deliveryTasks = tasks.filter(
        (task) => task.taskType === "ORDER_DELIVERY"
      ).length;

      const unassignedTasks = tasks.filter((task) => !task.agentId).length;

      const assignedTasks = tasks.filter((task) =>
        Boolean(task.agentId)
      ).length;

      const urgentTasks = tasks.filter(
        (task) => getPriorityScore(task.priority) >= 3
      ).length;

      const baseCluster: Omit<AgentRouteCluster, "suggestedAgents"> = {
        clusterId: `route-cluster-${key}`,
        pincode,
        city,
        taskType,
        totalTasks: tasks.length,
        pickupTasks,
        deliveryTasks,
        unassignedTasks,
        assignedTasks,
        urgentTasks,
        scheduledDate,
        tasks
      };

      return {
        ...baseCluster,
        suggestedAgents: buildAgentSuggestions({
          agents,
          assignments,
          cluster: baseCluster
        })
      };
    })
    .sort((first, second) => {
      if (second.urgentTasks !== first.urgentTasks) {
        return second.urgentTasks - first.urgentTasks;
      }

      return second.totalTasks - first.totalTasks;
    });
};

export const agentRoutePlanningService = {
  getDashboardData: async (): Promise<AgentRoutePlanningDashboardData> => {
    const [assignmentsResponse, agents] = await Promise.all([
      apiClient.get<AgentAssignment[]>(AGENT_ASSIGNMENTS_ENDPOINT),
      getAgents()
    ]);

    const assignments = Array.isArray(assignmentsResponse)
      ? assignmentsResponse
      : [];

    const clusters = buildClusters({
      assignments,
      agents
    });

    const summary = {
      totalClusters: clusters.length,
      totalTasks: clusters.reduce(
        (total, cluster) => total + cluster.totalTasks,
        0
      ),
      pickupTasks: clusters.reduce(
        (total, cluster) => total + cluster.pickupTasks,
        0
      ),
      deliveryTasks: clusters.reduce(
        (total, cluster) => total + cluster.deliveryTasks,
        0
      ),
      unassignedTasks: clusters.reduce(
        (total, cluster) => total + cluster.unassignedTasks,
        0
      ),
      assignedTasks: clusters.reduce(
        (total, cluster) => total + cluster.assignedTasks,
        0
      ),
      urgentTasks: clusters.reduce(
        (total, cluster) => total + cluster.urgentTasks,
        0
      ),
      clustersWithNoAgentSuggestion: clusters.filter(
        (cluster) => cluster.suggestedAgents.length === 0
      ).length
    };

    return {
      summary,
      clusters
    };
  },

  formatDate: (dateValue?: string): string => {
    if (!dateValue) {
      return "Not Scheduled";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not Scheduled";
    }

    return date.toLocaleDateString("en-IN");
  }
};