import { apiClient } from "./apiClient";
import type {
  AgentAvailabilityStatus,
  AgentEscalationActionPayload,
  AgentEscalationDashboardData,
  AgentEscalationRecord,
  AgentEscalationRiskLevel,
  AgentEscalationSource,
  AgentEscalationStatus,
  AgentEscalationSummary,
  AgentEscalationWorkflowRow,
  AgentProfileLite
} from "../types/agentEscalationReassignment";

const AGENT_PROFILES_ENDPOINT = "/agentProfiles";
const AGENT_ASSIGNMENTS_ENDPOINT = "/agentAssignments";
const AGENT_TASK_LOGS_ENDPOINT = "/agentTaskLogs";
const RETURN_REQUESTS_ENDPOINT = "/returnRequests";
const RETURN_PICKUP_ATTEMPTS_ENDPOINT = "/returnPickupAttempts";
const SUPPORT_ESCALATIONS_ENDPOINT = "/supportEscalations";
const RETURN_SLA_ESCALATIONS_ENDPOINT = "/returnSlaEscalations";
const AGENT_ESCALATIONS_ENDPOINT = "/agentEscalations";

type UnknownRecord = Record<string, unknown>;

const safeArray = async <T>(endpoint: string): Promise<T[]> => {
  try {
    const data = await apiClient.get<T[]>(endpoint);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const createId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const toText = (value: unknown): string => {
  return String(value ?? "").trim();
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeStatus = (value: unknown): string => {
  return toText(value).toUpperCase();
};

const getOptionalText = (
  item: UnknownRecord,
  key: string
): string | undefined => {
  const value = item[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = toText(value);
  return text || undefined;
};

const getFirstText = (
  item: UnknownRecord,
  keys: string[]
): string | undefined => {
  for (const key of keys) {
    const value = getOptionalText(item, key);
    if (value) {
      return value;
    }
  }
  return undefined;
};

const getDateTime = (value?: string): number => {
  if (!value) {
    return 0;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const diffHours = (startDate?: string, endDate?: string): number => {
  const start = getDateTime(startDate);
  const end = getDateTime(endDate ?? new Date().toISOString());

  if (!start || !end) {
    return 0;
  }

  return Math.max(Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10, 0);
};

const getAvailabilityStatus = (value: unknown): AgentAvailabilityStatus => {
  const status = normalizeStatus(value);

  if (
    status === "AVAILABLE" ||
    status === "BUSY" ||
    status === "OFFLINE" ||
    status === "ON_LEAVE" ||
    status === "UNAVAILABLE"
  ) {
    return status;
  }

  return "AVAILABLE";
};

const buildAgentProfiles = ({
  agentProfiles,
  agentAssignments,
  agentTaskLogs
}: {
  agentProfiles: UnknownRecord[];
  agentAssignments: UnknownRecord[];
  agentTaskLogs: UnknownRecord[];
}): AgentProfileLite[] => {
  const agents = new Map<string, AgentProfileLite>();

  agentProfiles.forEach((profile) => {
    const agentId =
      getFirstText(profile, ["agentId", "id", "userId"]) ?? createId("AGENT");

    agents.set(agentId, {
      id: getFirstText(profile, ["id"]) ?? agentId,
      agentId,
      agentName:
        getFirstText(profile, ["agentName", "name", "fullName"]) ??
        `Agent ${agentId}`,
      phone: getFirstText(profile, ["phone", "mobile"]),
      email: getFirstText(profile, ["email"]),
      city: getFirstText(profile, ["city"]),
      pincode: getFirstText(profile, ["pincode", "pinCode"]),
      role: getFirstText(profile, ["role", "agentRole"]),
      availabilityStatus: getAvailabilityStatus(
        getFirstText(profile, ["availabilityStatus", "status"])
      ),
      activeTaskCount: 0,
      completedTaskCount: 0,
      failedTaskCount: 0,
      averageRating: toNumber(profile.averageRating)
    });
  });

  agentAssignments.forEach((assignment) => {
    const agentId = getFirstText(assignment, ["agentId", "assignedAgentId"]);
    if (!agentId) return;

    const existing =
      agents.get(agentId) ??
      ({
        id: agentId,
        agentId,
        agentName:
          getFirstText(assignment, ["agentName", "assignedAgentName"]) ??
          `Agent ${agentId}`,
        availabilityStatus: "AVAILABLE",
        activeTaskCount: 0,
        completedTaskCount: 0,
        failedTaskCount: 0
      } satisfies AgentProfileLite);

    const status = normalizeStatus(getFirstText(assignment, ["status"]));

    if (
      status.includes("ACTIVE") ||
      status.includes("ASSIGNED") ||
      status.includes("IN_PROGRESS") ||
      status.includes("PENDING")
    ) {
      existing.activeTaskCount += 1;
    }

    if (status.includes("COMPLETED") || status.includes("DELIVERED")) {
      existing.completedTaskCount += 1;
    }

    if (status.includes("FAILED") || status.includes("CANCELLED")) {
      existing.failedTaskCount += 1;
    }

    agents.set(agentId, existing);
  });

  // Track task log updates only for standalone logs not captured in assignments
  agentTaskLogs.forEach((log) => {
    const agentId = getFirstText(log, ["agentId", "assignedAgentId"]);
    if (!agentId) return;

    const existing = agents.get(agentId);
    if (!existing) return;

    const status = normalizeStatus(getFirstText(log, ["status", "taskStatus"]));

    if (status.includes("FAILED") && existing.failedTaskCount === 0) {
      existing.failedTaskCount += 1;
    }

    if (status.includes("COMPLETED") && existing.completedTaskCount === 0) {
      existing.completedTaskCount += 1;
    }
  });

  return Array.from(agents.values()).sort(
    (first, second) => first.activeTaskCount - second.activeTaskCount
  );
};

const getRiskLevel = ({
  failedAttemptCount,
  elapsedHours,
  breachedHours,
  agentAvailability,
  activeTaskCount
}: {
  failedAttemptCount: number;
  elapsedHours: number;
  breachedHours: number;
  agentAvailability?: AgentAvailabilityStatus;
  activeTaskCount: number;
}): AgentEscalationRiskLevel => {
  if (
    breachedHours >= 24 ||
    failedAttemptCount >= 3 ||
    agentAvailability === "OFFLINE" ||
    agentAvailability === "ON_LEAVE"
  ) {
    return "CRITICAL";
  }

  if (
    breachedHours >= 8 ||
    failedAttemptCount >= 2 ||
    agentAvailability === "UNAVAILABLE" ||
    activeTaskCount >= 8
  ) {
    return "HIGH";
  }

  if (elapsedHours >= 24 || activeTaskCount >= 5) {
    return "MEDIUM";
  }

  return "LOW";
};

const getSuggestedAgent = ({
  agents,
  currentAgentId,
  city,
  pincode
}: {
  agents: AgentProfileLite[];
  currentAgentId?: string;
  city?: string;
  pincode?: string;
}): AgentProfileLite | undefined => {
  const availableAgents = agents.filter(
    (agent) =>
      agent.agentId !== currentAgentId &&
      agent.availabilityStatus === "AVAILABLE"
  );

  const matchingLocation = availableAgents.find(
    (agent) =>
      Boolean(city && agent.city === city) ||
      Boolean(pincode && agent.pincode === pincode)
  );

  return (
    matchingLocation ??
    [...availableAgents].sort(
      (first, second) => first.activeTaskCount - second.activeTaskCount
    )[0]
  );
};

const getExistingEscalation = ({
  records,
  taskId,
  returnRequestId
}: {
  records: AgentEscalationRecord[];
  taskId?: string;
  returnRequestId?: string;
}): AgentEscalationRecord | undefined => {
  return records.find(
    (record) =>
      record.status !== "RESOLVED" &&
      record.status !== "CANCELLED" &&
      ((taskId && record.taskId === taskId) ||
        (returnRequestId && record.returnRequestId === returnRequestId))
  );
};

const buildReassignmentReasons = ({
  failedAttemptCount,
  elapsedHours,
  breachedHours,
  agentAvailability,
  activeTaskCount
}: {
  failedAttemptCount: number;
  elapsedHours: number;
  breachedHours: number;
  agentAvailability?: AgentAvailabilityStatus;
  activeTaskCount: number;
}): string[] => {
  const reasons: string[] = [];

  if (failedAttemptCount > 0) {
    reasons.push(`${failedAttemptCount} failed attempt(s) detected.`);
  }

  if (breachedHours > 0) {
    reasons.push(`SLA breached by ${breachedHours} hour(s).`);
  }

  if (elapsedHours >= 24) {
    reasons.push(`Task pending for ${elapsedHours} hour(s).`);
  }

  if (
    agentAvailability &&
    ["OFFLINE", "ON_LEAVE", "UNAVAILABLE"].includes(agentAvailability)
  ) {
    reasons.push(`Current agent availability is ${agentAvailability}.`);
  }

  if (activeTaskCount >= 5) {
    reasons.push(`Current agent has ${activeTaskCount} active task(s).`);
  }

  if (reasons.length === 0) {
    reasons.push("No immediate reassignment required.");
  }

  return reasons;
};

const buildRecommendedActions = ({
  riskLevel,
  hasSuggestedAgent,
  existingStatus
}: {
  riskLevel: AgentEscalationRiskLevel;
  hasSuggestedAgent: boolean;
  existingStatus?: AgentEscalationStatus;
}): string[] => {
  if (existingStatus === "ESCALATED" || existingStatus === "IN_PROGRESS") {
    return ["Follow up with assigned manager until resolution."];
  }

  if (riskLevel === "CRITICAL") {
    return [
      "Escalate to operations manager immediately.",
      hasSuggestedAgent
        ? "Reassign task to suggested available agent."
        : "Manually assign backup agent."
    ];
  }

  if (riskLevel === "HIGH") {
    return [
      hasSuggestedAgent
        ? "Reassign task to suggested agent."
        : "Escalate to manager for agent allocation."
    ];
  }

  if (riskLevel === "MEDIUM") {
    return ["Monitor task and prepare reassignment if delay continues."];
  }

  return ["Continue monitoring."];
};

const buildRows = ({
  agents,
  agentAssignments,
  pickupAttempts,
  returnRequests,
  supportEscalations,
  slaEscalations,
  escalationRecords
}: {
  agents: AgentProfileLite[];
  agentAssignments: UnknownRecord[];
  pickupAttempts: UnknownRecord[];
  returnRequests: UnknownRecord[];
  supportEscalations: UnknownRecord[];
  slaEscalations: UnknownRecord[];
  escalationRecords: AgentEscalationRecord[];
}): AgentEscalationWorkflowRow[] => {
  const rows: AgentEscalationWorkflowRow[] = [];

  const returnMap = new Map<string, UnknownRecord>();
  returnRequests.forEach((request) => {
    const returnRequestId = getFirstText(request, [
      "returnRequestId",
      "requestId",
      "id"
    ]);
    if (returnRequestId) {
      returnMap.set(returnRequestId, request);
    }
  });

  // Map pickup attempts by returnRequestId for O(1) performance lookup
  const pickupAttemptsMap = new Map<string, UnknownRecord[]>();
  pickupAttempts.forEach((attempt) => {
    const reqId = getFirstText(attempt, ["returnRequestId", "requestId"]);
    if (reqId) {
      const existing = pickupAttemptsMap.get(reqId) ?? [];
      existing.push(attempt);
      pickupAttemptsMap.set(reqId, existing);
    }
  });

  agentAssignments.forEach((assignment) => {
    const taskId = getFirstText(assignment, ["taskId", "id"]);
    const assignmentId = getFirstText(assignment, ["assignmentId", "id"]);
    const returnRequestId = getFirstText(assignment, [
      "returnRequestId",
      "requestId"
    ]);

    const request = returnRequestId ? returnMap.get(returnRequestId) : undefined;
    const agentId = getFirstText(assignment, ["agentId", "assignedAgentId"]);
    const agent = agents.find((item) => item.agentId === agentId);

    const currentStatus = normalizeStatus(
      getFirstText(assignment, ["status", "taskStatus"])
    );

    // Precise attempt lookup without cross-agent contamination
    const relatedAttempts = returnRequestId
      ? pickupAttemptsMap.get(returnRequestId) ?? []
      : [];

    const failedAttemptCount = relatedAttempts.filter((attempt) => {
      const status = normalizeStatus(getFirstText(attempt, ["status"]));
      return status.includes("FAILED") || status.includes("MISSED");
    }).length;

    const createdAt =
      getFirstText(assignment, ["createdAt", "assignedAt"]) ??
      new Date().toISOString();

    const updatedAt =
      getFirstText(assignment, ["updatedAt", "lastActivityAt"]) ?? createdAt;

    const elapsedHours = diffHours(createdAt);
    const breachedHours = Math.max(elapsedHours - 24, 0);

    const city =
      getFirstText(assignment, ["city"]) ??
      (request ? getFirstText(request, ["city", "customerCity"]) : undefined);

    const pincode =
      getFirstText(assignment, ["pincode", "pinCode"]) ??
      (request ? getFirstText(request, ["pincode", "pinCode"]) : undefined);

    const suggestedAgent = getSuggestedAgent({
      agents,
      currentAgentId: agentId,
      city,
      pincode
    });

    const existingEscalation = getExistingEscalation({
      records: escalationRecords,
      taskId,
      returnRequestId
    });

    const riskLevel = getRiskLevel({
      failedAttemptCount,
      elapsedHours,
      breachedHours,
      agentAvailability: agent?.availabilityStatus,
      activeTaskCount: agent?.activeTaskCount ?? 0
    });

    const status: AgentEscalationStatus =
      existingEscalation?.status ??
      (riskLevel === "HIGH" || riskLevel === "CRITICAL" ? "OPEN" : "IN_PROGRESS");

    const source: AgentEscalationSource =
      currentStatus.includes("DELIVERY") ? "DELIVERY" : "RETURN_PICKUP";

    rows.push({
      id: `${taskId ?? assignmentId ?? createId("ROW")}`,
      escalationId: existingEscalation?.escalationId,
      source,
      status,
      riskLevel,

      taskId,
      assignmentId,
      returnRequestId,
      orderId:
        getFirstText(assignment, ["orderId"]) ??
        (request ? getFirstText(request, ["orderId"]) : undefined),

      currentAgentId: agentId,
      currentAgentName:
        getFirstText(assignment, ["agentName", "assignedAgentName"]) ??
        agent?.agentName,

      suggestedAgentId: suggestedAgent?.agentId,
      suggestedAgentName: suggestedAgent?.agentName,

      customerName:
        getFirstText(assignment, ["customerName"]) ??
        (request ? getFirstText(request, ["customerName", "userName"]) : undefined),
      customerPhone:
        getFirstText(assignment, ["customerPhone", "phone"]) ??
        (request ? getFirstText(request, ["customerPhone", "phone"]) : undefined),

      city,
      pincode,

      issueTitle:
        riskLevel === "CRITICAL"
          ? "Critical agent escalation required"
          : riskLevel === "HIGH"
            ? "Agent reassignment recommended"
            : "Agent task monitoring required",

      issueDetails:
        failedAttemptCount > 0
          ? "Failed pickup or delivery attempt detected."
          : "Agent workload and SLA monitoring event detected.",

      attemptCount: relatedAttempts.length,
      failedAttemptCount,
      elapsedHours,
      breachedHours,

      recommendedActions: buildRecommendedActions({
        riskLevel,
        hasSuggestedAgent: Boolean(suggestedAgent),
        existingStatus: existingEscalation?.status
      }),
      reassignmentReasons: buildReassignmentReasons({
        failedAttemptCount,
        elapsedHours,
        breachedHours,
        agentAvailability: agent?.availabilityStatus,
        activeTaskCount: agent?.activeTaskCount ?? 0
      }),

      createdAt,
      updatedAt
    });
  });

  supportEscalations.forEach((support) => {
    const returnRequestId = getFirstText(support, [
      "returnRequestId",
      "requestId"
    ]);
    const taskId = getFirstText(support, ["taskId", "id"]);

    if (!returnRequestId && !taskId) {
      return;
    }

    const existingEscalation = getExistingEscalation({
      records: escalationRecords,
      taskId,
      returnRequestId
    });

    const createdAt =
      getFirstText(support, ["createdAt"]) ?? new Date().toISOString();
    const elapsedHours = diffHours(createdAt);
    const breachedHours = Math.max(elapsedHours - 24, 0);

    const riskLevel = getRiskLevel({
      failedAttemptCount: 0,
      elapsedHours,
      breachedHours,
      agentAvailability: undefined,
      activeTaskCount: 0
    });

    rows.push({
      id: `SUPPORT-${taskId ?? returnRequestId ?? createId("ROW")}`,
      escalationId: existingEscalation?.escalationId,
      source: "SUPPORT_ESCALATION",
      status: existingEscalation?.status ?? "OPEN",
      riskLevel,
      taskId,
      returnRequestId,
      orderId: getFirstText(support, ["orderId"]),
      currentAgentId: getFirstText(support, ["agentId"]),
      currentAgentName: getFirstText(support, ["agentName"]),
      customerName: getFirstText(support, ["customerName"]),
      customerPhone: getFirstText(support, ["customerPhone"]),
      city: getFirstText(support, ["city"]),
      pincode: getFirstText(support, ["pincode"]),
      issueTitle: "Support escalation requires agent follow-up",
      issueDetails:
        getFirstText(support, ["description", "reason", "details"]) ??
        "Support escalation event.",
      attemptCount: 0,
      failedAttemptCount: 0,
      elapsedHours,
      breachedHours,
      recommendedActions: ["Assign support owner and track resolution."],
      reassignmentReasons: buildReassignmentReasons({
        failedAttemptCount: 0,
        elapsedHours,
        breachedHours,
        activeTaskCount: 0
      }),
      createdAt,
      updatedAt: getFirstText(support, ["updatedAt"]) ?? createdAt
    });
  });

  slaEscalations.forEach((sla) => {
    const returnRequestId = getFirstText(sla, ["returnRequestId"]);
    const taskId = getFirstText(sla, ["taskId", "id"]);

    const existingEscalation = getExistingEscalation({
      records: escalationRecords,
      taskId,
      returnRequestId
    });

    const createdAt = getFirstText(sla, ["createdAt"]) ?? new Date().toISOString();
    const elapsedHours = diffHours(createdAt);
    const breachedHours = Math.max(elapsedHours - 12, 0);

    rows.push({
      id: `SLA-${taskId ?? returnRequestId ?? createId("ROW")}`,
      escalationId: existingEscalation?.escalationId,
      source: "SLA_BREACH",
      status: existingEscalation?.status ?? "OPEN",
      riskLevel: breachedHours >= 8 ? "HIGH" : "MEDIUM",
      taskId,
      returnRequestId,
      orderId: getFirstText(sla, ["orderId"]),
      currentAgentId: getFirstText(sla, ["agentId"]),
      currentAgentName: getFirstText(sla, ["agentName"]),
      issueTitle: "SLA breach requires escalation",
      issueDetails: getFirstText(sla, ["reason"]) ?? "SLA breach detected.",
      attemptCount: 0,
      failedAttemptCount: 0,
      elapsedHours,
      breachedHours,
      recommendedActions: ["Escalate to manager and reassign if necessary."],
      reassignmentReasons: buildReassignmentReasons({
        failedAttemptCount: 0,
        elapsedHours,
        breachedHours,
        activeTaskCount: 0
      }),
      createdAt,
      updatedAt: getFirstText(sla, ["updatedAt"]) ?? createdAt
    });
  });

  return rows.sort((first, second) => {
    const riskRank: Record<AgentEscalationRiskLevel, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    };

    return (
      riskRank[second.riskLevel] - riskRank[first.riskLevel] ||
      second.breachedHours - first.breachedHours
    );
  });
};

const buildSummary = ({
  rows,
  agents,
  escalationRecords
}: {
  rows: AgentEscalationWorkflowRow[];
  agents: AgentProfileLite[];
  escalationRecords: AgentEscalationRecord[];
}): AgentEscalationSummary => {
  const countStatus = (status: AgentEscalationStatus): number =>
    rows.filter((row) => row.status === status).length;

  const countRisk = (riskLevel: AgentEscalationRiskLevel): number =>
    rows.filter((row) => row.riskLevel === riskLevel).length;

  const averageElapsedHours =
    rows.length > 0
      ? Number(
          (
            rows.reduce((total, row) => total + row.elapsedHours, 0) /
            rows.length
          ).toFixed(2)
        )
      : 0;

  return {
    totalRows: rows.length,
    openEscalations: countStatus("OPEN"),
    inProgressEscalations: countStatus("IN_PROGRESS"),
    reassignedEscalations: countStatus("REASSIGNED"),
    resolvedEscalations:
      countStatus("RESOLVED") +
      escalationRecords.filter((item) => item.status === "RESOLVED").length,
    cancelledEscalations: countStatus("CANCELLED"),

    lowRiskCount: countRisk("LOW"),
    mediumRiskCount: countRisk("MEDIUM"),
    highRiskCount: countRisk("HIGH"),
    criticalRiskCount: countRisk("CRITICAL"),

    unavailableAgents: agents.filter((agent) =>
      ["OFFLINE", "ON_LEAVE", "UNAVAILABLE"].includes(agent.availabilityStatus)
    ).length,
    overloadedAgents: agents.filter((agent) => agent.activeTaskCount >= 5)
      .length,
    failedAttemptRows: rows.filter((row) => row.failedAttemptCount > 0).length,
    slaBreachedRows: rows.filter((row) => row.breachedHours > 0).length,

    averageElapsedHours
  };
};

const buildEscalationRecord = (
  payload: AgentEscalationActionPayload,
  selectedAgent?: AgentProfileLite
): AgentEscalationRecord => {
  const now = new Date().toISOString();

  const nextStatus: AgentEscalationStatus =
    payload.action === "MARK_RESOLVED"
      ? "RESOLVED"
      : payload.action === "CANCEL_ESCALATION"
        ? "CANCELLED"
        : payload.action === "REASSIGN_AGENT"
          ? "REASSIGNED"
          : payload.action === "MARK_IN_PROGRESS"
            ? "IN_PROGRESS"
            : "ESCALATED";

  return {
    id: createId("AESC"),
    escalationId: createId("AGESC"),

    source: payload.row.source,
    status: nextStatus,
    riskLevel: payload.row.riskLevel,

    taskId: payload.row.taskId,
    assignmentId: payload.row.assignmentId,
    returnRequestId: payload.row.returnRequestId,
    orderId: payload.row.orderId,

    previousAgentId: payload.row.currentAgentId,
    previousAgentName: payload.row.currentAgentName,
    newAgentId: selectedAgent?.agentId,
    newAgentName: selectedAgent?.agentName,

    action: payload.action,
    reason: payload.reason,

    createdBy: "Admin",
    createdAt: now,
    updatedAt: now,
    resolvedAt: nextStatus === "RESOLVED" ? now : undefined
  };
};

export const agentEscalationReassignmentService = {
  getDashboardData: async (): Promise<AgentEscalationDashboardData> => {
    const [
      agentProfiles,
      agentAssignments,
      agentTaskLogs,
      returnRequests,
      pickupAttempts,
      supportEscalations,
      slaEscalations,
      escalationRecords
    ] = await Promise.all([
      safeArray<UnknownRecord>(AGENT_PROFILES_ENDPOINT),
      safeArray<UnknownRecord>(AGENT_ASSIGNMENTS_ENDPOINT),
      safeArray<UnknownRecord>(AGENT_TASK_LOGS_ENDPOINT),
      safeArray<UnknownRecord>(RETURN_REQUESTS_ENDPOINT),
      safeArray<UnknownRecord>(RETURN_PICKUP_ATTEMPTS_ENDPOINT),
      safeArray<UnknownRecord>(SUPPORT_ESCALATIONS_ENDPOINT),
      safeArray<UnknownRecord>(RETURN_SLA_ESCALATIONS_ENDPOINT),
      safeArray<AgentEscalationRecord>(AGENT_ESCALATIONS_ENDPOINT)
    ]);

    const agents = buildAgentProfiles({
      agentProfiles,
      agentAssignments,
      agentTaskLogs
    });

    const rows = buildRows({
      agents,
      agentAssignments,
      pickupAttempts,
      returnRequests,
      supportEscalations,
      slaEscalations,
      escalationRecords
    });

    return {
      rows,
      agents,
      escalationRecords,
      summary: buildSummary({
        rows,
        agents,
        escalationRecords
      })
    };
  },

  createEscalationAction: async (
    payload: AgentEscalationActionPayload
  ): Promise<AgentEscalationRecord> => {
    const dashboard = await agentEscalationReassignmentService.getDashboardData();

    const selectedAgent = dashboard.agents.find(
      (agent) => agent.agentId === payload.newAgentId
    );

    const record = buildEscalationRecord(payload, selectedAgent);

    return apiClient.post<AgentEscalationRecord, AgentEscalationRecord>(
      AGENT_ESCALATIONS_ENDPOINT,
      record
    );
  },

  formatDateTime: (dateValue?: string): string => {
    if (!dateValue) {
      return "N/A";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
};