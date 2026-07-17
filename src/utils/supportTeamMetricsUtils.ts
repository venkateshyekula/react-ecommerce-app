import type { SupportEscalation } from "../types/supportEscalation";
import type {
  SupportTeamMember,
  SupportTeamMemberAvailability
} from "../types/supportTeam";

export interface SupportTeamMemberMetric {
  member: SupportTeamMember;
  assignedCount: number;
  activeCount: number;
  resolvedCount: number;
  breachedCount: number;
  averageResolutionHours: number;
  capacityUsagePercent: number;
  derivedAvailability: SupportTeamMemberAvailability;
}

export interface SupportTeamPerformanceSummary {
  totalMembers: number;
  availableMembers: number;
  busyMembers: number;
  awayMembers: number;
  offlineMembers: number;
  onLeaveMembers: number;
  totalAssignedEscalations: number;
  activeEscalations: number;
  resolvedEscalations: number;
  averageResolutionHours: number;
}

const ACTIVE_STATUSES = new Set([
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_EXTERNAL_TEAM"
]);

const getHoursBetween = (start: string, end: string): number => {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();

  if (Number.isNaN(diffMs) || diffMs <= 0) {
    return 0;
  }

  return Math.round((diffMs / 3_600_000) * 10) / 10;
};

export const isRecentlyActive = (
  lastActiveAt?: string,
  thresholdMinutes = 5
): boolean => {
  if (!lastActiveAt) {
    return false;
  }

  const diffMs = Date.now() - new Date(lastActiveAt).getTime();

  return diffMs <= thresholdMinutes * 60 * 1000;
};

export const deriveMemberAvailability = (
  member: SupportTeamMember
): SupportTeamMemberAvailability => {
  const explicitStatus = member.availabilityStatus ?? "OFFLINE";

  if (explicitStatus === "ON_LEAVE" || explicitStatus === "AWAY") {
    return explicitStatus;
  }

  if (!isRecentlyActive(member.lastActiveAt)) {
    return "OFFLINE";
  }

  const activeCount = member.activeEscalationCount ?? 0;
  const maxCapacity = member.maxEscalationCapacity ?? 5;

  if (activeCount >= maxCapacity) {
    return "BUSY";
  }

  return explicitStatus === "BUSY" ? "BUSY" : "AVAILABLE";
};

export const buildSupportTeamMemberMetrics = ({
  members,
  escalations
}: {
  members: SupportTeamMember[];
  escalations: SupportEscalation[];
}): SupportTeamMemberMetric[] => {
  return members.map((member) => {
    const assignedEscalations = escalations.filter(
      (escalation) => escalation.assignedToUserId === member.userId
    );

    const activeEscalations = assignedEscalations.filter((escalation) =>
      ACTIVE_STATUSES.has(escalation.status)
    );

    const resolvedEscalations = assignedEscalations.filter(
      (escalation) => escalation.status === "RESOLVED"
    );

    const resolutionHours = resolvedEscalations.map((escalation) =>
      escalation.resolvedAt
        ? getHoursBetween(escalation.createdAt, escalation.resolvedAt)
        : 0
    );

    const averageResolutionHours =
      resolutionHours.length > 0
        ? Math.round(
            (resolutionHours.reduce((total, value) => total + value, 0) /
              resolutionHours.length) *
              10
          ) / 10
        : 0;

    const maxCapacity = member.maxEscalationCapacity ?? 5;
    const activeCount = activeEscalations.length;

    const capacityUsagePercent =
      maxCapacity > 0
        ? Math.min(100, Math.round((activeCount / maxCapacity) * 100))
        : 0;

    const enrichedMember: SupportTeamMember = {
      ...member,
      activeEscalationCount: activeCount
    };

    return {
      member: enrichedMember,
      assignedCount: assignedEscalations.length,
      activeCount,
      resolvedCount: resolvedEscalations.length,
      breachedCount: 0,
      averageResolutionHours,
      capacityUsagePercent,
      derivedAvailability: deriveMemberAvailability(enrichedMember)
    };
  });
};

export const buildSupportTeamPerformanceSummary = (
  metrics: SupportTeamMemberMetric[]
): SupportTeamPerformanceSummary => {
  const totalResolved = metrics.reduce(
    (total, metric) => total + metric.resolvedCount,
    0
  );

  const weightedResolutionHours = metrics.reduce(
    (total, metric) =>
      total + metric.averageResolutionHours * metric.resolvedCount,
    0
  );

  return {
    totalMembers: metrics.length,
    availableMembers: metrics.filter(
      (metric) => metric.derivedAvailability === "AVAILABLE"
    ).length,
    busyMembers: metrics.filter(
      (metric) => metric.derivedAvailability === "BUSY"
    ).length,
    awayMembers: metrics.filter(
      (metric) => metric.derivedAvailability === "AWAY"
    ).length,
    offlineMembers: metrics.filter(
      (metric) => metric.derivedAvailability === "OFFLINE"
    ).length,
    onLeaveMembers: metrics.filter(
      (metric) => metric.derivedAvailability === "ON_LEAVE"
    ).length,
    totalAssignedEscalations: metrics.reduce(
      (total, metric) => total + metric.assignedCount,
      0
    ),
    activeEscalations: metrics.reduce(
      (total, metric) => total + metric.activeCount,
      0
    ),
    resolvedEscalations: totalResolved,
    averageResolutionHours:
      totalResolved > 0
        ? Math.round((weightedResolutionHours / totalResolved) * 10) / 10
        : 0
  };
};