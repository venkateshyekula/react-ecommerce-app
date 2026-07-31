import { apiClient } from "./apiClient";
import type {
  AgentAssignment,
  AgentAssignmentStatus,
  AgentProfile,
  AgentTaskType
} from "../types/agentAssignment";
import type {
  AgentSlaDashboardData,
  AgentSlaSeverity,
  AgentSlaStatus,
  AgentSlaTaskRow,
  AgentWorkloadRow
} from "../types/agentSla";

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

const PICKUP_SLA_HOURS = 24;
const DELIVERY_SLA_HOURS = 48;
const AT_RISK_THRESHOLD_HOURS = 4;

const completedStatuses: AgentAssignmentStatus[] = [
  "PICKUP_COMPLETED",
  "DELIVERED",
  "CANCELLED"
];

const attemptedStatuses: AgentAssignmentStatus[] = [
  "PICKUP_ATTEMPTED",
  "DELIVERY_ATTEMPTED",
  "FAILED"
];

const activeAssignedStatuses: AgentAssignmentStatus[] = [
  "ASSIGNED",
  "ACCEPTED",
  "OUT_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "PICKUP_ATTEMPTED",
  "DELIVERY_ATTEMPTED",
  "REASSIGNED"
];

const getSafeTime = (dateValue?: string | null): number => {
  if (!dateValue) {
    return 0;
  }

  const time = new Date(dateValue).getTime();

  return Number.isNaN(time) ? 0 : time;
};

const getNowTime = (): number => {
  return new Date().getTime();
};

const formatDateTime = (date: Date): string => {
  return date.toISOString();
};

const addHours = (dateValue: string, hours: number): string => {
  const baseDate = new Date(dateValue);
  const safeDate = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;

  safeDate.setHours(safeDate.getHours() + hours);

  return safeDate.toISOString();
};

const getTaskSlaHours = (taskType: AgentTaskType): number => {
  return taskType === "RETURN_PICKUP" ? PICKUP_SLA_HOURS : DELIVERY_SLA_HOURS;
};

const getDueAt = (assignment: AgentAssignment): string => {
  if (assignment.scheduledDate) {
    const scheduledDate = new Date(assignment.scheduledDate);

    if (!Number.isNaN(scheduledDate.getTime())) {
      scheduledDate.setHours(23, 59, 59, 999);
      return scheduledDate.toISOString();
    }
  }

  const baseDate =
    assignment.assignedAt ?? assignment.createdAt ?? new Date().toISOString();

  return addHours(baseDate, getTaskSlaHours(assignment.taskType));
};

const getSlaStatus = ({
  assignment,
  dueAt
}: {
  assignment: AgentAssignment;
  dueAt: string;
}): {
  slaStatus: AgentSlaStatus;
  hoursRemaining: number;
  hoursOverdue: number;
  severity: AgentSlaSeverity;
} => {
  if (completedStatuses.includes(assignment.status)) {
    return {
      slaStatus: "COMPLETED",
      hoursRemaining: 0,
      hoursOverdue: 0,
      severity: "LOW"
    };
  }

  const now = getNowTime();
  const dueTime = getSafeTime(dueAt);
  const diffHours = (dueTime - now) / (1000 * 60 * 60);

  if (diffHours < 0) {
    const hoursOverdue = Math.max(1, Math.round(Math.abs(diffHours)));

    return {
      slaStatus: "BREACHED",
      hoursRemaining: 0,
      hoursOverdue,
      severity:
        hoursOverdue >= 24 ? "CRITICAL" : hoursOverdue >= 8 ? "HIGH" : "MEDIUM"
    };
  }

  const hoursRemaining = Math.max(0, Math.round(diffHours));

  if (diffHours <= AT_RISK_THRESHOLD_HOURS) {
    return {
      slaStatus: "AT_RISK",
      hoursRemaining,
      hoursOverdue: 0,
      severity: "MEDIUM"
    };
  }

  return {
    slaStatus: "ON_TRACK",
    hoursRemaining,
    hoursOverdue: 0,
    severity: "LOW"
  };
};

const getRiskLevelFromCounts = ({
  totalTasks,
  breachedTasks,
  atRiskTasks
}: {
  totalTasks: number;
  breachedTasks: number;
  atRiskTasks: number;
}): AgentSlaSeverity => {
  if (totalTasks === 0) {
    return "LOW";
  }

  const breachRatio = breachedTasks / totalTasks;
  const atRiskRatio = atRiskTasks / totalTasks;

  if (breachRatio >= 0.5) {
    return "CRITICAL";
  }

  if (breachRatio >= 0.3) {
    return "HIGH";
  }

  if (breachRatio > 0 || atRiskRatio >= 0.4) {
    return "MEDIUM";
  }

  return "LOW";
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
    const key = agent.agentId || agent.id;

    if (!agentMap.has(key)) {
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
    // Fallback below.
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

const buildTaskRows = (assignments: AgentAssignment[]): AgentSlaTaskRow[] => {
  return assignments.map((assignment) => {
    const dueAt = getDueAt(assignment);
    const slaResult = getSlaStatus({
      assignment,
      dueAt
    });

    return {
      assignmentId: assignment.assignmentId,
      assignmentDbId: assignment.id,
      taskType: assignment.taskType,
      taskId: assignment.taskId,
      orderId: assignment.orderId,
      returnRequestId: assignment.returnRequestId,
      customerName: assignment.customerName,
      address: assignment.address,
      pincode: assignment.pincode,
      city: assignment.city,
      agentId: assignment.agentId,
      agentName: assignment.agentName,
      agentPhone: assignment.agentPhone,
      status: assignment.status,
      priority: assignment.priority,
      scheduledDate: assignment.scheduledDate,
      scheduledSlot: assignment.scheduledSlot,
      assignedAt: assignment.assignedAt,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      attemptCount: assignment.attemptCount,
      dueAt,
      remarks: assignment.remarks,
      ...slaResult
    };
  });
};

const buildAgentRows = ({
  agents,
  taskRows
}: {
  agents: AgentProfile[];
  taskRows: AgentSlaTaskRow[];
}): AgentWorkloadRow[] => {
  const agentMap = new Map<string, AgentWorkloadRow>();

  agents.forEach((agent) => {
    agentMap.set(agent.agentId, {
      agentId: agent.agentId,
      agentName: agent.name,
      agentPhone: agent.phone,
      totalTasks: 0,
      assignedTasks: 0,
      pickupTasks: 0,
      deliveryTasks: 0,
      completedTasks: 0,
      attemptedTasks: 0,
      breachedTasks: 0,
      atRiskTasks: 0,
      maxDailyTasks: agent.maxDailyTasks,
      utilizationPercent: 0,
      riskLevel: "LOW"
    });
  });

  taskRows.forEach((task) => {
    const agentId = task.agentId ?? "UNASSIGNED";

    const existingRow =
      agentMap.get(agentId) ??
      ({
        agentId,
        agentName: task.agentName ?? "Unassigned",
        agentPhone: task.agentPhone,
        totalTasks: 0,
        assignedTasks: 0,
        pickupTasks: 0,
        deliveryTasks: 0,
        completedTasks: 0,
        attemptedTasks: 0,
        breachedTasks: 0,
        atRiskTasks: 0,
        maxDailyTasks: undefined,
        utilizationPercent: 0,
        riskLevel: "LOW"
      } satisfies AgentWorkloadRow);

    existingRow.totalTasks += 1;

    if (activeAssignedStatuses.includes(task.status)) {
      existingRow.assignedTasks += 1;
    }

    if (task.taskType === "RETURN_PICKUP") {
      existingRow.pickupTasks += 1;
    }

    if (task.taskType === "ORDER_DELIVERY") {
      existingRow.deliveryTasks += 1;
    }

    if (task.slaStatus === "COMPLETED") {
      existingRow.completedTasks += 1;
    }

    if (attemptedStatuses.includes(task.status)) {
      existingRow.attemptedTasks += 1;
    }

    if (task.slaStatus === "BREACHED") {
      existingRow.breachedTasks += 1;
    }

    if (task.slaStatus === "AT_RISK") {
      existingRow.atRiskTasks += 1;
    }

    agentMap.set(agentId, existingRow);
  });

  return Array.from(agentMap.values())
    .map((row) => {
      const maxDailyTasks = row.maxDailyTasks ?? 0;
      const utilizationPercent =
        maxDailyTasks > 0
          ? Math.min(Math.round((row.assignedTasks / maxDailyTasks) * 100), 100)
          : 0;

      return {
        ...row,
        utilizationPercent,
        riskLevel: getRiskLevelFromCounts({
          totalTasks: row.totalTasks,
          breachedTasks: row.breachedTasks,
          atRiskTasks: row.atRiskTasks
        })
      };
    })
    .sort((first, second) => {
      if (second.breachedTasks !== first.breachedTasks) {
        return second.breachedTasks - first.breachedTasks;
      }

      return second.assignedTasks - first.assignedTasks;
    });
};

export const agentSlaDashboardService = {
  getDashboardData: async (): Promise<AgentSlaDashboardData> => {
    const [assignmentsResponse, agents] = await Promise.all([
      apiClient.get<AgentAssignment[]>(AGENT_ASSIGNMENTS_ENDPOINT),
      getAgents()
    ]);

    const assignments = Array.isArray(assignmentsResponse)
      ? assignmentsResponse
      : [];

    const taskRows = buildTaskRows(assignments).sort(
      (first, second) =>
        getSafeTime(first.dueAt) - getSafeTime(second.dueAt)
    );

    const agentRows = buildAgentRows({
      agents,
      taskRows
    });

    const summary = {
      totalTasks: taskRows.length,
      assignedTasks: taskRows.filter((task) =>
        activeAssignedStatuses.includes(task.status)
      ).length,
      unassignedTasks: taskRows.filter((task) => !task.agentId).length,
      pickupTasks: taskRows.filter((task) => task.taskType === "RETURN_PICKUP")
        .length,
      deliveryTasks: taskRows.filter(
        (task) => task.taskType === "ORDER_DELIVERY"
      ).length,
      completedTasks: taskRows.filter((task) => task.slaStatus === "COMPLETED")
        .length,
      attemptedTasks: taskRows.filter((task) =>
        attemptedStatuses.includes(task.status)
      ).length,
      atRiskTasks: taskRows.filter((task) => task.slaStatus === "AT_RISK")
        .length,
      breachedTasks: taskRows.filter((task) => task.slaStatus === "BREACHED")
        .length,
      activeAgents: agents.filter((agent) => agent.status === "ACTIVE").length,
      overloadedAgents: agentRows.filter(
        (agent) =>
          typeof agent.maxDailyTasks === "number" &&
          agent.maxDailyTasks > 0 &&
          agent.assignedTasks >= agent.maxDailyTasks
      ).length
    };

    return {
      summary,
      taskRows,
      agentRows
    };
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
  },

  getCurrentTimestamp: (): string => {
    return formatDateTime(new Date());
  }
};