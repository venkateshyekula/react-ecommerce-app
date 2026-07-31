import { apiClient } from "./apiClient";
import type {
  AgentAssignment,
  AgentAssignmentStatus,
  AgentProfile
} from "../types/agentAssignment";
import type { DeliveryProof } from "../types/deliveryAgent";
import type { PickupProof } from "../types/pickupAgent";
import type {
  AgentIncentiveRule,
  AgentPayoutDashboardData,
  AgentPayoutRecord,
  AgentPayoutRow,
  AgentPayoutStatus,
  AgentPayoutSummary
} from "../types/agentPayout";

const AGENTS_ENDPOINT = "/agentProfiles";
const RETURN_PICKUP_PARTNERS_ENDPOINT = "/returnPickupPartners";
const AGENT_ASSIGNMENTS_ENDPOINT = "/agentAssignments";
const PICKUP_PROOFS_ENDPOINT = "/pickupProofs";
const DELIVERY_PROOFS_ENDPOINT = "/deliveryProofs";
const AGENT_INCENTIVE_RULES_ENDPOINT = "/agentIncentiveRules";
const AGENT_PAYOUTS_ENDPOINT = "/agentPayouts";

type ReturnPickupPartnerLike = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role?: string;
  partnerId?: string;
  pickupPartnerId?: string;
};

const defaultIncentiveRule: AgentIncentiveRule = {
  id: "agent-incentive-rule-default",
  ruleId: "AGT-RULE-DEFAULT",
  name: "Default Agent Incentive Rule",
  isActive: true,
  pickupCompletionAmount: 35,
  deliveryCompletionAmount: 45,
  failedAttemptAllowance: 10,
  slaBonusAmount: 15,
  proofVerifiedBonusAmount: 10,
  proofRejectedPenaltyAmount: 20,
  maxFailedAttemptAllowancePerPeriod: 10,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const completedPickupStatus: AgentAssignmentStatus = "PICKUP_COMPLETED";
const completedDeliveryStatus: AgentAssignmentStatus = "DELIVERED";

const failedAttemptStatuses: AgentAssignmentStatus[] = [
  "PICKUP_ATTEMPTED",
  "DELIVERY_ATTEMPTED",
  "FAILED"
];

const generatePayoutDbId = (): string => {
  return `agent-payout-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const generatePayoutId = (): string => {
  return `AGT-PAYOUT-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${Date.now()}`;
};

const getSafeTime = (dateValue?: string | null): number => {
  if (!dateValue) {
    return 0;
  }

  const time = new Date(dateValue).getTime();

  return Number.isNaN(time) ? 0 : time;
};

const getDueAt = (assignment: AgentAssignment): string => {
  if (assignment.scheduledDate) {
    const date = new Date(assignment.scheduledDate);

    if (!Number.isNaN(date.getTime())) {
      date.setHours(23, 59, 59, 999);
      return date.toISOString();
    }
  }

  const fallbackDate = new Date(assignment.assignedAt ?? assignment.createdAt);

  if (Number.isNaN(fallbackDate.getTime())) {
    return new Date().toISOString();
  }

  fallbackDate.setHours(
    fallbackDate.getHours() + (assignment.taskType === "RETURN_PICKUP" ? 24 : 48)
  );

  return fallbackDate.toISOString();
};

const isCompletedWithinSla = (assignment: AgentAssignment): boolean => {
  if (
    assignment.status !== completedPickupStatus &&
    assignment.status !== completedDeliveryStatus
  ) {
    return false;
  }

  const completionTime = getSafeTime(assignment.updatedAt);
  const dueTime = getSafeTime(getDueAt(assignment));

  return completionTime > 0 && dueTime > 0 && completionTime <= dueTime;
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
    // Fallback below
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

const getActiveIncentiveRule = async (): Promise<AgentIncentiveRule> => {
  try {
    const rules = await apiClient.get<AgentIncentiveRule[]>(
      AGENT_INCENTIVE_RULES_ENDPOINT
    );

    const activeRule = Array.isArray(rules)
      ? rules.find((rule) => rule.isActive)
      : undefined;

    return activeRule ?? defaultIncentiveRule;
  } catch {
    return defaultIncentiveRule;
  }
};

const buildBaseRow = (agent: AgentProfile): AgentPayoutRow => {
  return {
    agentId: agent.agentId,
    agentName: agent.name,
    agentPhone: agent.phone,
    agentEmail: agent.email,
    agentType: agent.agentType,

    completedPickups: 0,
    completedDeliveries: 0,
    failedAttempts: 0,
    slaEligibleTasks: 0,
    verifiedProofs: 0,
    rejectedProofs: 0,

    pickupEarnings: 0,
    deliveryEarnings: 0,
    failedAttemptAllowance: 0,
    slaBonus: 0,
    proofVerifiedBonus: 0,
    proofRejectedPenalty: 0,

    grossAmount: 0,
    deductions: 0,
    netPayableAmount: 0,

    payoutStatus: "READY_FOR_APPROVAL",
    riskLevel: "LOW"
  };
};

const calculateFinalAmounts = ({
  row,
  rule
}: {
  row: AgentPayoutRow;
  rule: AgentIncentiveRule;
}): AgentPayoutRow => {
  const payableFailedAttempts = rule.maxFailedAttemptAllowancePerPeriod
    ? Math.min(row.failedAttempts, rule.maxFailedAttemptAllowancePerPeriod)
    : row.failedAttempts;

  const pickupEarnings = row.completedPickups * rule.pickupCompletionAmount;
  const deliveryEarnings =
    row.completedDeliveries * rule.deliveryCompletionAmount;
  const failedAttemptAllowance =
    payableFailedAttempts * rule.failedAttemptAllowance;
  const slaBonus = row.slaEligibleTasks * rule.slaBonusAmount;
  const proofVerifiedBonus =
    row.verifiedProofs * rule.proofVerifiedBonusAmount;
  const proofRejectedPenalty =
    row.rejectedProofs * rule.proofRejectedPenaltyAmount;

  const grossAmount =
    pickupEarnings +
    deliveryEarnings +
    failedAttemptAllowance +
    slaBonus +
    proofVerifiedBonus;

  const deductions = proofRejectedPenalty;

  const netPayableAmount = Math.max(grossAmount - deductions, 0);

  const riskLevel =
    row.rejectedProofs >= 3 || row.failedAttempts >= 5
      ? "HIGH"
      : row.rejectedProofs > 0 || row.failedAttempts >= 3
        ? "MEDIUM"
        : "LOW";

  const payoutStatus: AgentPayoutStatus =
    riskLevel === "HIGH" ? "ON_HOLD" : "READY_FOR_APPROVAL";

  return {
    ...row,
    pickupEarnings,
    deliveryEarnings,
    failedAttemptAllowance,
    slaBonus,
    proofVerifiedBonus,
    proofRejectedPenalty,
    grossAmount,
    deductions,
    netPayableAmount,
    riskLevel,
    payoutStatus
  };
};

export const agentPayoutService = {
  getDashboardData: async (): Promise<AgentPayoutDashboardData> => {
    const [
      agents,
      assignmentsResponse,
      pickupProofsResponse,
      deliveryProofsResponse,
      activeRule
    ] = await Promise.all([
      getAgents(),
      apiClient.get<AgentAssignment[]>(AGENT_ASSIGNMENTS_ENDPOINT),
      apiClient.get<PickupProof[]>(PICKUP_PROOFS_ENDPOINT),
      apiClient.get<DeliveryProof[]>(DELIVERY_PROOFS_ENDPOINT),
      getActiveIncentiveRule()
    ]);

    const assignments = Array.isArray(assignmentsResponse)
      ? assignmentsResponse
      : [];

    const pickupProofs = Array.isArray(pickupProofsResponse)
      ? pickupProofsResponse
      : [];

    const deliveryProofs = Array.isArray(deliveryProofsResponse)
      ? deliveryProofsResponse
      : [];

    const rowMap = new Map<string, AgentPayoutRow>();

    agents.forEach((agent) => {
      rowMap.set(agent.agentId, buildBaseRow(agent));
    });

    assignments.forEach((assignment) => {
      if (!assignment.agentId) {
        return;
      }

      const row =
        rowMap.get(assignment.agentId) ??
        ({
          ...buildBaseRow({
            id: assignment.agentId,
            agentId: assignment.agentId,
            name: assignment.agentName ?? "Unknown Agent",
            phone: assignment.agentPhone ?? "",
            agentType: assignment.agentType ?? "BOTH",
            servicePincodes: [],
            status: "ACTIVE",
            createdAt: assignment.createdAt
          }),
          agentType: assignment.agentType ?? "BOTH"
        } satisfies AgentPayoutRow);

      if (assignment.status === completedPickupStatus) {
        row.completedPickups += 1;
      }

      if (assignment.status === completedDeliveryStatus) {
        row.completedDeliveries += 1;
      }

      if (failedAttemptStatuses.includes(assignment.status)) {
        row.failedAttempts += 1;
      }

      if (isCompletedWithinSla(assignment)) {
        row.slaEligibleTasks += 1;
      }

      rowMap.set(assignment.agentId, row);
    });

    pickupProofs.forEach((proof) => {
      const row = rowMap.get(proof.agentId);

      if (!row) {
        return;
      }

      if (proof.verificationStatus === "VERIFIED") {
        row.verifiedProofs += 1;
      }

      if (proof.verificationStatus === "REJECTED") {
        row.rejectedProofs += 1;
      }
    });

    deliveryProofs.forEach((proof) => {
      const row = rowMap.get(proof.agentId);

      if (!row) {
        return;
      }

      if (proof.verificationStatus === "VERIFIED") {
        row.verifiedProofs += 1;
      }

      if (proof.verificationStatus === "REJECTED") {
        row.rejectedProofs += 1;
      }
    });

    const rows = Array.from(rowMap.values())
      .map((row) =>
        calculateFinalAmounts({
          row,
          rule: activeRule
        })
      )
      .sort(
        (first, second) => second.netPayableAmount - first.netPayableAmount
      );

    const summary: AgentPayoutSummary = {
      totalAgents: rows.length,
      totalCompletedPickups: rows.reduce(
        (total, row) => total + row.completedPickups,
        0
      ),
      totalCompletedDeliveries: rows.reduce(
        (total, row) => total + row.completedDeliveries,
        0
      ),
      totalFailedAttempts: rows.reduce(
        (total, row) => total + row.failedAttempts,
        0
      ),
      totalVerifiedProofs: rows.reduce(
        (total, row) => total + row.verifiedProofs,
        0
      ),
      totalRejectedProofs: rows.reduce(
        (total, row) => total + row.rejectedProofs,
        0
      ),
      totalGrossAmount: rows.reduce(
        (total, row) => total + row.grossAmount,
        0
      ),
      totalDeductions: rows.reduce(
        (total, row) => total + row.deductions,
        0
      ),
      totalNetPayableAmount: rows.reduce(
        (total, row) => total + row.netPayableAmount,
        0
      ),
      readyForApprovalCount: rows.filter(
        (row) => row.payoutStatus === "READY_FOR_APPROVAL"
      ).length,
      highRiskCount: rows.filter((row) => row.riskLevel === "HIGH").length
    };

    return {
      summary,
      rows,
      activeRule
    };
  },

  createPayoutRecord: async ({
    row,
    periodStart,
    periodEnd,
    remarks
  }: {
    row: AgentPayoutRow;
    periodStart: string;
    periodEnd: string;
    remarks?: string;
  }): Promise<AgentPayoutRecord> => {
    const now = new Date().toISOString();

    const record: AgentPayoutRecord = {
      id: generatePayoutDbId(),
      payoutId: generatePayoutId(),
      agentId: row.agentId,
      agentName: row.agentName,
      agentType: row.agentType,
      periodStart,
      periodEnd,
      completedPickups: row.completedPickups,
      completedDeliveries: row.completedDeliveries,
      failedAttempts: row.failedAttempts,
      slaEligibleTasks: row.slaEligibleTasks,
      verifiedProofs: row.verifiedProofs,
      rejectedProofs: row.rejectedProofs,
      grossAmount: row.grossAmount,
      deductions: row.deductions,
      netPayableAmount: row.netPayableAmount,
      status: row.payoutStatus,
      remarks,
      createdAt: now,
      updatedAt: now
    };

    return apiClient.post<AgentPayoutRecord, AgentPayoutRecord>(
      AGENT_PAYOUTS_ENDPOINT,
      record
    );
  },

  approvePayout: async ({
    payoutDbId,
    approvedByUserId,
    approvedByName
  }: {
    payoutDbId: string;
    approvedByUserId: string;
    approvedByName: string;
  }): Promise<AgentPayoutRecord> => {
    const now = new Date().toISOString();

    return apiClient.patch<AgentPayoutRecord, Partial<AgentPayoutRecord>>(
      `${AGENT_PAYOUTS_ENDPOINT}/${encodeURIComponent(payoutDbId)}`,
      {
        status: "APPROVED",
        approvedByUserId,
        approvedByName,
        approvedAt: now,
        updatedAt: now
      }
    );
  },

  markPayoutPaid: async ({
    payoutDbId
  }: {
    payoutDbId: string;
  }): Promise<AgentPayoutRecord> => {
    const now = new Date().toISOString();

    return apiClient.patch<AgentPayoutRecord, Partial<AgentPayoutRecord>>(
      `${AGENT_PAYOUTS_ENDPOINT}/${encodeURIComponent(payoutDbId)}`,
      {
        status: "PAID",
        paidAt: now,
        updatedAt: now
      }
    );
  },

  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  }
};