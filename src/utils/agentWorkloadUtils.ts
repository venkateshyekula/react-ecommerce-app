import type {
  AgentAssignment,
  AgentAssignmentStatus,
  AgentProfile
} from "../types/agentAssignment";

export const getDateKey = (dateValue?: string | null): string => {
  if (!dateValue || typeof dateValue !== "string") {
    return new Date().toISOString().slice(0, 10);
  }

  // Handle YYYY-MM-DD directly to prevent timezone offset shifts
  const cleanDateStr = dateValue.trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDateStr)) {
    return cleanDateStr;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
};

export const isActiveAgentTaskStatus = (
  status?: AgentAssignmentStatus | string | null
): boolean => {
  if (!status) {
    return false;
  }

  return [
    "ASSIGNED",
    "ACCEPTED",
    "OUT_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "PICKUP_ATTEMPTED",
    "DELIVERY_ATTEMPTED",
    "REASSIGNED"
  ].includes(status);
};

export const getAssignmentDateKey = (
  assignment: AgentAssignment
): string => {
  return getDateKey(
    assignment.scheduledDate ??
      assignment.assignedAt ??
      assignment.updatedAt ??
      assignment.createdAt
  );
};

export const getAgentDailyAssignedCount = ({
  assignments,
  agentId,
  scheduledDate,
  ignoreAssignmentDbId
}: {
  assignments: AgentAssignment[];
  agentId: string;
  scheduledDate?: string;
  ignoreAssignmentDbId?: string;
}): number => {
  const dateKey = getDateKey(scheduledDate);

  return assignments.filter((assignment) => {
    const targetAssignmentId = assignment.id || assignment.assignmentId;
    const isSameAgent = assignment.agentId === agentId;
    const isSameDate = getAssignmentDateKey(assignment) === dateKey;
    const isActive = isActiveAgentTaskStatus(assignment.status);
    const isIgnored =
      Boolean(ignoreAssignmentDbId) && targetAssignmentId === ignoreAssignmentDbId;

    return isSameAgent && isSameDate && isActive && !isIgnored;
  }).length;
};

export const getAgentMaxDailyTasks = (agent?: AgentProfile | null): number => {
  if (!agent) {
    return 0;
  }

  if (
    typeof agent.maxDailyTasks === "number" &&
    Number.isFinite(agent.maxDailyTasks) &&
    agent.maxDailyTasks > 0
  ) {
    return agent.maxDailyTasks;
  }

  // Returns 0 to represent unconfigured / unlimited daily capacity
  return 0;
};

export const getAgentRemainingCapacity = ({
  agent,
  assignments,
  scheduledDate,
  ignoreAssignmentDbId
}: {
  agent: AgentProfile;
  assignments: AgentAssignment[];
  scheduledDate?: string;
  ignoreAssignmentDbId?: string;
}): {
  maxDailyTasks: number;
  assignedCount: number;
  remainingCapacity: number;
  isUnlimited: boolean;
  isCapacityReached: boolean;
} => {
  const maxDailyTasks = getAgentMaxDailyTasks(agent);

  const assignedCount = getAgentDailyAssignedCount({
    assignments,
    agentId: agent.agentId,
    scheduledDate,
    ignoreAssignmentDbId
  });

  const isUnlimited = maxDailyTasks <= 0;
  const remainingCapacity = isUnlimited
    ? Number.POSITIVE_INFINITY
    : Math.max(maxDailyTasks - assignedCount, 0);

  return {
    maxDailyTasks,
    assignedCount,
    remainingCapacity,
    isUnlimited,
    isCapacityReached: !isUnlimited && assignedCount >= maxDailyTasks
  };
};

export const buildAgentCapacityErrorMessage = ({
  agentName,
  date,
  maxDailyTasks
}: {
  agentName: string;
  date?: string;
  maxDailyTasks: number;
}): string => {
  const dateLabel = getDateKey(date);

  return `${agentName} has already reached the daily task limit of ${maxDailyTasks} tasks for ${dateLabel}. Please choose another agent or another date.`;
};