import { apiClient } from "./apiClient";
import type {
  AgentAssignment,
  AgentAssignmentStatus,
  AgentProfile
} from "../types/agentAssignment";
import type { DeliveryProof } from "../types/deliveryAgent";
import type { PickupProof } from "../types/pickupAgent";
import type {
  AgentPerformanceReportData,
  AgentPerformanceRiskLevel,
  AgentPerformanceRow
} from "../types/agentPerformance";

const AGENT_ASSIGNMENTS_ENDPOINT = "/agentAssignments";
const AGENTS_ENDPOINT = "/agentProfiles";
const RETURN_PICKUP_PARTNERS_ENDPOINT = "/returnPickupPartners";
const PICKUP_PROOFS_ENDPOINT = "/pickupProofs";
const DELIVERY_PROOFS_ENDPOINT = "/deliveryProofs";

type ReturnPickupPartnerLike = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role?: string;
  partnerId?: string;
  pickupPartnerId?: string;
};

const completedStatuses: AgentAssignmentStatus[] = [
  "PICKUP_COMPLETED",
  "DELIVERED"
];

const attemptedStatuses: AgentAssignmentStatus[] = [
  "PICKUP_ATTEMPTED",
  "DELIVERY_ATTEMPTED"
];

const failedStatuses: AgentAssignmentStatus[] = [
  "FAILED"
];

const activeStatuses: AgentAssignmentStatus[] = [
  "ASSIGNED",
  "ACCEPTED",
  "OUT_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "REASSIGNED"
];

const getSafeTime = (dateValue?: string | null): number => {
  if (!dateValue) {
    return 0;
  }

  const time = new Date(dateValue).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const getSafePercent = (numerator: number, denominator: number): number => {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
};

const getAverage = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
};

const getAgentRiskLevel = (score: number): AgentPerformanceRiskLevel => {
  if (score >= 90) {
    return "EXCELLENT";
  }

  if (score >= 75) {
    return "GOOD";
  }

  if (score >= 55) {
    return "AVERAGE";
  }

  if (score >= 35) {
    return "POOR";
  }

  return "CRITICAL";
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

const getCompletionHours = (assignment: AgentAssignment): number | null => {
  if (!completedStatuses.includes(assignment.status)) {
    return null;
  }

  const startTime = getSafeTime(
    assignment.assignedAt ?? assignment.createdAt
  );
  const endTime = getSafeTime(assignment.updatedAt);

  if (!startTime || !endTime || endTime < startTime) {
    return null;
  }

  const hours = (endTime - startTime) / (1000 * 60 * 60);
  return Math.round(hours * 10) / 10;
};

const buildInitialAgentRow = (agent: AgentProfile): AgentPerformanceRow => {
  return {
    agentId: agent.agentId,
    agentName: agent.name,
    agentPhone: agent.phone,
    agentType: agent.agentType,
    city: agent.city,

    totalTasks: 0,
    pickupTasks: 0,
    deliveryTasks: 0,

    assignedTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    attemptedTasks: 0,
    failedTasks: 0,
    cancelledTasks: 0,

    pickupCompleted: 0,
    deliveriesCompleted: 0,

    totalProofs: 0,
    pendingProofs: 0,
    verifiedProofs: 0,
    rejectedProofs: 0,

    completionRate: 0,
    failureRate: 0,
    proofVerificationRate: 0,
    averageCompletionHours: 0,

    performanceScore: 0,
    riskLevel: "AVERAGE"
  };
};

const calculatePerformanceScore = ({
  completionRate,
  failureRate,
  proofVerificationRate,
  averageCompletionHours,
  totalTasks,
  completedTasks
}: {
  completionRate: number;
  failureRate: number;
  proofVerificationRate: number;
  averageCompletionHours: number;
  totalTasks: number;
  completedTasks: number;
}): number => {
  if (totalTasks === 0) {
    return 0;
  }

  const completionScore = completionRate * 0.45;
  const proofScore = proofVerificationRate * 0.25;
  const failureScore = Math.max(100 - failureRate, 0) * 0.2;

  let speedScore = 0;
  if (completedTasks > 0) {
    if (averageCompletionHours <= 4) {
      speedScore = 10;
    } else if (averageCompletionHours <= 12) {
      speedScore = 7;
    } else if (averageCompletionHours <= 24) {
      speedScore = 4;
    } else {
      speedScore = 1;
    }
  }

  const score = completionScore + proofScore + failureScore + speedScore;

  return Math.min(Math.round(score), 100);
};

export const agentPerformanceReportService = {
  getReportData: async (): Promise<AgentPerformanceReportData> => {
    const [agents, assignmentsResponse, pickupProofs, deliveryProofs] =
      await Promise.all([
        getAgents(),
        apiClient.get<AgentAssignment[]>(AGENT_ASSIGNMENTS_ENDPOINT),
        apiClient.get<PickupProof[]>(PICKUP_PROOFS_ENDPOINT),
        apiClient.get<DeliveryProof[]>(DELIVERY_PROOFS_ENDPOINT)
      ]);

    const assignments = Array.isArray(assignmentsResponse)
      ? assignmentsResponse
      : [];
    const safePickupProofs = Array.isArray(pickupProofs) ? pickupProofs : [];
    const safeDeliveryProofs = Array.isArray(deliveryProofs)
      ? deliveryProofs
      : [];

    const agentMap = new Map<string, AgentPerformanceRow>();
    const completionHoursByAgent = new Map<string, number[]>();

    agents.forEach((agent) => {
      agentMap.set(agent.agentId, buildInitialAgentRow(agent));
      completionHoursByAgent.set(agent.agentId, []);
    });

    assignments.forEach((assignment) => {
      const agentId = assignment.agentId ?? "UNASSIGNED";

      const existingRow =
        agentMap.get(agentId) ??
        ({
          ...buildInitialAgentRow({
            id: agentId,
            agentId,
            name: assignment.agentName ?? "Unassigned",
            phone: assignment.agentPhone ?? "",
            agentType: assignment.agentType ?? "BOTH",
            status: "ACTIVE",
            servicePincodes: [],
            createdAt: assignment.createdAt
          } as AgentProfile)
        } satisfies AgentPerformanceRow);

      existingRow.totalTasks += 1;

      if (assignment.taskType === "RETURN_PICKUP") {
        existingRow.pickupTasks += 1;
      }

      if (assignment.taskType === "ORDER_DELIVERY") {
        existingRow.deliveryTasks += 1;
      }

      if (assignment.status === "ASSIGNED") {
        existingRow.assignedTasks += 1;
      }

      if (activeStatuses.includes(assignment.status)) {
        existingRow.inProgressTasks += 1;
      }

      if (completedStatuses.includes(assignment.status)) {
        existingRow.completedTasks += 1;
      }

      if (attemptedStatuses.includes(assignment.status)) {
        existingRow.attemptedTasks += 1;
      }

      if (failedStatuses.includes(assignment.status)) {
        existingRow.failedTasks += 1;
      }

      if (assignment.status === "CANCELLED") {
        existingRow.cancelledTasks += 1;
      }

      if (assignment.status === "PICKUP_COMPLETED") {
        existingRow.pickupCompleted += 1;
      }

      if (assignment.status === "DELIVERED") {
        existingRow.deliveriesCompleted += 1;
      }

      const completionHours = getCompletionHours(assignment);

      if (completionHours !== null) {
        const currentHours = completionHoursByAgent.get(agentId) ?? [];
        currentHours.push(completionHours);
        completionHoursByAgent.set(agentId, currentHours);
      }

      const lastTaskAt = existingRow.lastTaskAt;
      const currentUpdatedAt = assignment.updatedAt;

      if (
        !lastTaskAt ||
        getSafeTime(currentUpdatedAt) > getSafeTime(lastTaskAt)
      ) {
        existingRow.lastTaskAt = currentUpdatedAt;
      }

      agentMap.set(agentId, existingRow);
    });

    safePickupProofs.forEach((proof) => {
      const row = agentMap.get(proof.agentId);

      if (!row) {
        return;
      }

      row.totalProofs += 1;

      if (proof.verificationStatus === "VERIFIED") {
        row.verifiedProofs += 1;
      } else if (proof.verificationStatus === "REJECTED") {
        row.rejectedProofs += 1;
      } else {
        row.pendingProofs += 1;
      }
    });

    safeDeliveryProofs.forEach((proof) => {
      const row = agentMap.get(proof.agentId);

      if (!row) {
        return;
      }

      row.totalProofs += 1;

      if (proof.verificationStatus === "VERIFIED") {
        row.verifiedProofs += 1;
      } else if (proof.verificationStatus === "REJECTED") {
        row.rejectedProofs += 1;
      } else {
        row.pendingProofs += 1;
      }
    });

    const rows = Array.from(agentMap.values()).map((row) => {
      const completionRate = getSafePercent(row.completedTasks, row.totalTasks);
      const failureRate = getSafePercent(row.failedTasks, row.totalTasks);
      const proofVerificationRate = getSafePercent(
        row.verifiedProofs,
        row.totalProofs
      );
      const averageCompletionHours = getAverage(
        completionHoursByAgent.get(row.agentId) ?? []
      );

      const performanceScore = calculatePerformanceScore({
        completionRate,
        failureRate,
        proofVerificationRate,
        averageCompletionHours,
        totalTasks: row.totalTasks,
        completedTasks: row.completedTasks
      });

      return {
        ...row,
        completionRate,
        failureRate,
        proofVerificationRate,
        averageCompletionHours,
        performanceScore,
        riskLevel: getAgentRiskLevel(performanceScore)
      };
    });

    const activeRows = rows.filter((row) => row.totalTasks > 0);

    const averageCompletionRate = getAverage(
      activeRows.map((row) => row.completionRate)
    );

    const averagePerformanceScore = getAverage(
      activeRows.map((row) => row.performanceScore)
    );

    return {
      summary: {
        totalAgents: rows.length,
        activeAgents: activeRows.length,
        totalTasks: rows.reduce((total, row) => total + row.totalTasks, 0),
        completedTasks: rows.reduce(
          (total, row) => total + row.completedTasks,
          0
        ),
        attemptedTasks: rows.reduce(
          (total, row) => total + row.attemptedTasks,
          0
        ),
        failedTasks: rows.reduce((total, row) => total + row.failedTasks, 0),
        verifiedProofs: rows.reduce(
          (total, row) => total + row.verifiedProofs,
          0
        ),
        rejectedProofs: rows.reduce(
          (total, row) => total + row.rejectedProofs,
          0
        ),
        averageCompletionRate,
        averagePerformanceScore
      },
      agents: rows.sort(
        (firstAgent, secondAgent) =>
          secondAgent.performanceScore - firstAgent.performanceScore
      )
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
  }
};