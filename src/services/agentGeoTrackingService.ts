import { apiClient } from "./apiClient";
import type {
  AgentGeoLocation,
  AgentGeoLocationLog,
  AgentGeoRiskLevel,
  AgentGeoTaskStatus,
  AgentGeoTaskType,
  AgentGeoTrackingDashboardData,
  AgentGeoTrackingRow,
  AgentGeoTrackingStatus,
  AgentGeoTrackingSummary
} from "../types/agentGeoTracking";

const AGENT_ASSIGNMENTS_ENDPOINT = "/agentAssignments";
const AGENT_PROFILES_ENDPOINT = "/agentProfiles";
const RETURN_REQUESTS_ENDPOINT = "/returnRequests";
const ORDERS_ENDPOINT = "/orders";
const ADDRESSES_ENDPOINT = "/addresses";
const AGENT_MOBILE_ACTIVITY_LOGS_ENDPOINT = "/agentMobileActivityLogs";
const AGENT_GEO_LOCATION_LOGS_ENDPOINT = "/agentGeoLocationLogs";

type UnknownRecord = Record<string, unknown>;

const STALE_LOCATION_MINUTES = 30;
const SLA_WARNING_HOURS = 12;
const SLA_BREACH_HOURS = 24;

const safeArray = async <T>(endpoint: string): Promise<T[]> => {
  try {
    const data = await apiClient.get<T[]>(endpoint);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const toText = (value: unknown): string => {
  return String(value ?? "").trim();
};

const toNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

const getFirstNumber = (
  item: UnknownRecord,
  keys: string[]
): number | undefined => {
  for (const key of keys) {
    const value = toNumber(item[key]);

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
};

const getDateTime = (dateValue?: string): number => {
  if (!dateValue) {
    return 0;
  }

  const time = new Date(dateValue).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const diffHours = (startDate?: string, endDate?: string): number => {
  const start = getDateTime(startDate);
  const end = getDateTime(endDate ?? new Date().toISOString());

  if (!start || !end) {
    return 0;
  }

  return Math.max(Math.round(((end - start) / 3600000) * 10) / 10, 0);
};

const diffMinutes = (startDate?: string, endDate?: string): number => {
  const start = getDateTime(startDate);
  const end = getDateTime(endDate ?? new Date().toISOString());

  if (!start || !end) {
    return 0;
  }

  return Math.max(Math.round((end - start) / 60000), 0);
};

const getTaskType = (assignment: UnknownRecord): AgentGeoTaskType => {
  const type = normalizeStatus(
    getFirstText(assignment, ["taskType", "assignmentType", "type"])
  );

  if (type.includes("DELIVERY")) {
    return "DELIVERY";
  }

  if (type.includes("PROOF")) {
    return "PROOF_VERIFICATION";
  }

  if (type.includes("SUPPORT")) {
    return "SUPPORT_VISIT";
  }

  return "RETURN_PICKUP";
};

const getTaskStatus = (assignment: UnknownRecord): AgentGeoTaskStatus => {
  const status = normalizeStatus(
    getFirstText(assignment, ["status", "taskStatus", "assignmentStatus"])
  );

  if (status.includes("ACCEPTED")) {
    return "ACCEPTED";
  }

  if (status.includes("IN_PROGRESS")) {
    return "IN_PROGRESS";
  }

  if (status.includes("REACHED")) {
    return "REACHED_LOCATION";
  }

  if (status.includes("PICKED")) {
    return "PICKED_UP";
  }

  if (status.includes("DELIVERED")) {
    return "DELIVERED";
  }

  if (status.includes("FAILED")) {
    return "FAILED";
  }

  if (status.includes("RESCHEDULED")) {
    return "RESCHEDULED";
  }

  if (status.includes("COMPLETED")) {
    return "COMPLETED";
  }

  if (status.includes("CANCELLED")) {
    return "CANCELLED";
  }

  return "ASSIGNED";
};

const isCompletedStatus = (status: AgentGeoTaskStatus): boolean => {
  return (
    status === "COMPLETED" ||
    status === "DELIVERED" ||
    status === "PICKED_UP" ||
    status === "CANCELLED"
  );
};

const findById = (
  collection: UnknownRecord[],
  keys: string[],
  value?: string
): UnknownRecord | undefined => {
  if (!value) {
    return undefined;
  }

  return collection.find((item) =>
    keys.some((key) => getOptionalText(item, key) === value)
  );
};

const getLatestLocationLog = ({
  taskId,
  assignmentId,
  agentId,
  locationLogs,
  activityLogs
}: {
  taskId: string;
  assignmentId?: string;
  agentId: string;
  locationLogs: AgentGeoLocationLog[];
  activityLogs: UnknownRecord[];
}): AgentGeoLocation => {
  const matchingGeoLogs = locationLogs.filter(
    (log) =>
      log.taskId === taskId ||
      log.assignmentId === assignmentId ||
      log.agentId === agentId
  );

  const matchingActivityLogs = activityLogs
    .filter((log) => {
      const logTaskId = getOptionalText(log, "taskId");
      const logAgentId = getOptionalText(log, "agentId");
      const latitude = getFirstNumber(log, ["latitude"]);
      const longitude = getFirstNumber(log, ["longitude"]);

      return (
        latitude !== undefined &&
        longitude !== undefined &&
        (logTaskId === taskId || logAgentId === agentId)
      );
    })
    .map<AgentGeoLocationLog>((log) => ({
      id: getOptionalText(log, "id") ?? "",
      logId: getOptionalText(log, "logId") ?? "",
      taskId: getOptionalText(log, "taskId") ?? taskId,
      assignmentId,
      agentId: getOptionalText(log, "agentId") ?? agentId,
      agentName: getOptionalText(log, "agentName"),
      latitude: getFirstNumber(log, ["latitude"]) ?? 0,
      longitude: getFirstNumber(log, ["longitude"]) ?? 0,
      source: "AGENT_MOBILE",
      capturedAt:
        getFirstText(log, ["capturedAt", "createdAt", "updatedAt"]) ??
        new Date().toISOString(),
      createdAt: getFirstText(log, ["createdAt"]) ?? new Date().toISOString()
    }));

  const latest = [...matchingGeoLogs, ...matchingActivityLogs].sort(
    (first, second) =>
      getDateTime(second.capturedAt) - getDateTime(first.capturedAt)
  )[0];

  if (!latest) {
    return {};
  }

  return {
    latitude: latest.latitude,
    longitude: latest.longitude,
    capturedAt: latest.capturedAt
  };
};

const calculateDistanceKm = (
  firstLocation: AgentGeoLocation,
  secondLocation: AgentGeoLocation
): number | undefined => {
  if (
    firstLocation.latitude === undefined ||
    firstLocation.longitude === undefined ||
    secondLocation.latitude === undefined ||
    secondLocation.longitude === undefined
  ) {
    return undefined;
  }

  const earthRadiusKm = 6371;
  const latitudeDelta =
    ((secondLocation.latitude - firstLocation.latitude) * Math.PI) / 180;
  const longitudeDelta =
    ((secondLocation.longitude - firstLocation.longitude) * Math.PI) / 180;

  const firstLatitude = (firstLocation.latitude * Math.PI) / 180;
  const secondLatitude = (secondLocation.latitude * Math.PI) / 180;

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2) *
      Math.cos(firstLatitude) *
      Math.cos(secondLatitude);

  // Clamp haversine to [0, 1] to prevent NaN from floating-point inaccuracies
  const clampedHaversine = Math.min(1, Math.max(0, haversine));

  const centralAngle =
    2 * Math.atan2(Math.sqrt(clampedHaversine), Math.sqrt(1 - clampedHaversine));

  return Math.round(earthRadiusKm * centralAngle * 10) / 10;
};

const getTrackingStatus = ({
  taskStatus,
  agentLocation,
  lastLocationAgeMinutes
}: {
  taskStatus: AgentGeoTaskStatus;
  agentLocation: AgentGeoLocation;
  lastLocationAgeMinutes: number;
}): AgentGeoTrackingStatus => {
  if (taskStatus === "FAILED") {
    return "FAILED";
  }

  if (isCompletedStatus(taskStatus)) {
    return "COMPLETED";
  }

  if (
    agentLocation.latitude === undefined ||
    agentLocation.longitude === undefined
  ) {
    return "NO_LOCATION";
  }

  if (lastLocationAgeMinutes > STALE_LOCATION_MINUTES) {
    return "STALE";
  }

  return "LIVE";
};

const getRiskLevel = ({
  trackingStatus,
  breachedHours,
  lastLocationAgeMinutes,
  distanceKm
}: {
  trackingStatus: AgentGeoTrackingStatus;
  breachedHours: number;
  lastLocationAgeMinutes: number;
  distanceKm?: number;
}): AgentGeoRiskLevel => {
  if (
    trackingStatus === "NO_LOCATION" ||
    breachedHours >= 24 ||
    lastLocationAgeMinutes >= 120
  ) {
    return "CRITICAL";
  }

  if (
    trackingStatus === "STALE" ||
    breachedHours >= 8 ||
    (distanceKm !== undefined && distanceKm >= 20)
  ) {
    return "HIGH";
  }

  if (
    breachedHours > 0 ||
    lastLocationAgeMinutes >= STALE_LOCATION_MINUTES ||
    (distanceKm !== undefined && distanceKm >= 10)
  ) {
    return "MEDIUM";
  }

  return "LOW";
};

const buildIssueFlags = ({
  trackingStatus,
  breachedHours,
  lastLocationAgeMinutes,
  distanceKm
}: {
  trackingStatus: AgentGeoTrackingStatus;
  breachedHours: number;
  lastLocationAgeMinutes: number;
  distanceKm?: number;
}): string[] => {
  const flags: string[] = [];

  if (trackingStatus === "NO_LOCATION") {
    flags.push("No live location available.");
  }

  if (trackingStatus === "STALE") {
    flags.push(`Location is stale by ${lastLocationAgeMinutes} minute(s).`);
  }

  if (breachedHours > 0) {
    flags.push(`Task SLA breached by ${breachedHours} hour(s).`);
  }

  if (distanceKm !== undefined && distanceKm >= 10) {
    flags.push(`Agent is ${distanceKm} km away from customer location.`);
  }

  if (flags.length === 0) {
    flags.push("Tracking looks healthy.");
  }

  return flags;
};

const buildRecommendedActions = ({
  trackingStatus,
  riskLevel
}: {
  trackingStatus: AgentGeoTrackingStatus;
  riskLevel: AgentGeoRiskLevel;
}): string[] => {
  if (riskLevel === "CRITICAL") {
    return [
      "Call agent immediately.",
      "Escalate to operations manager.",
      "Consider reassignment if task is still active."
    ];
  }

  if (riskLevel === "HIGH") {
    return [
      "Ask agent to refresh location.",
      "Monitor task progress closely.",
      "Escalate if no movement is seen."
    ];
  }

  if (trackingStatus === "STALE") {
    return ["Request fresh GPS update from agent mobile app."];
  }

  return ["Continue monitoring."];
};

const buildRows = ({
  assignments,
  agents,
  returnRequests,
  orders,
  addresses,
  activityLogs,
  locationLogs
}: {
  assignments: UnknownRecord[];
  agents: UnknownRecord[];
  returnRequests: UnknownRecord[];
  orders: UnknownRecord[];
  addresses: UnknownRecord[];
  activityLogs: UnknownRecord[];
  locationLogs: AgentGeoLocationLog[];
}): AgentGeoTrackingRow[] => {
  return assignments.map((assignment) => {
    const taskId = getFirstText(assignment, ["taskId", "id"]) ?? "";
    const assignmentId = getFirstText(assignment, ["assignmentId", "id"]);
    const agentId =
      getFirstText(assignment, ["agentId", "assignedAgentId"]) ??
      "UNKNOWN_AGENT";

    const returnRequestId = getFirstText(assignment, [
      "returnRequestId",
      "requestId"
    ]);
    const orderId = getOptionalText(assignment, "orderId");

    const relatedReturn = findById(
      returnRequests,
      ["id", "returnRequestId", "requestId"],
      returnRequestId
    );
    const relatedOrder = findById(orders, ["id", "orderId"], orderId);
    const relatedAgent = findById(agents, ["id", "agentId", "userId"], agentId);

    const addressKey =
      getOptionalText(assignment, "addressId") ?? orderId ?? returnRequestId;

    const relatedAddress = findById(
      addresses,
      ["id", "addressId", "orderId", "returnRequestId"],
      addressKey
    );

    const taskType = getTaskType(assignment);
    const taskStatus = getTaskStatus(assignment);

    const agentLocation = getLatestLocationLog({
      taskId,
      assignmentId,
      agentId,
      locationLogs,
      activityLogs
    });

    const customerLocation: AgentGeoLocation = {
      latitude:
        getFirstNumber(assignment, ["customerLatitude", "dropLatitude"]) ??
        getFirstNumber(relatedAddress ?? {}, ["latitude"]),
      longitude:
        getFirstNumber(assignment, ["customerLongitude", "dropLongitude"]) ??
        getFirstNumber(relatedAddress ?? {}, ["longitude"]),
      capturedAt: getFirstText(relatedAddress ?? {}, ["updatedAt", "createdAt"])
    };

    const assignedAt = getFirstText(assignment, ["assignedAt", "createdAt"]);
    const updatedAt = getFirstText(assignment, ["updatedAt", "createdAt"]);

    const elapsedHours = diffHours(assignedAt);
    const breachedHours = Math.max(elapsedHours - SLA_BREACH_HOURS, 0);

    const lastLocationAgeMinutes = agentLocation.capturedAt
      ? diffMinutes(agentLocation.capturedAt)
      : 0;

    const trackingStatus = getTrackingStatus({
      taskStatus,
      agentLocation,
      lastLocationAgeMinutes
    });

    const distanceKm = calculateDistanceKm(agentLocation, customerLocation);

    const riskLevel = getRiskLevel({
      trackingStatus,
      breachedHours,
      lastLocationAgeMinutes,
      distanceKm
    });

    return {
      id: `${taskId || assignmentId || agentId}`,
      taskId,
      assignmentId,

      agentId,
      agentName:
        getFirstText(assignment, ["agentName", "assignedAgentName"]) ??
        getFirstText(relatedAgent ?? {}, ["agentName", "name", "fullName"]) ??
        `Agent ${agentId}`,
      agentPhone:
        getFirstText(assignment, ["agentPhone"]) ??
        getFirstText(relatedAgent ?? {}, ["phone", "mobile"]),

      taskType,
      taskStatus,
      trackingStatus,
      riskLevel,

      returnRequestId,
      orderId,
      customerName:
        getFirstText(assignment, ["customerName", "userName"]) ??
        getFirstText(relatedReturn ?? {}, ["customerName", "userName"]) ??
        getFirstText(relatedOrder ?? {}, ["customerName", "userName"]),
      customerPhone:
        getFirstText(assignment, ["customerPhone", "phone", "mobile"]) ??
        getFirstText(relatedReturn ?? {}, [
          "customerPhone",
          "phone",
          "mobile"
        ]) ??
        getFirstText(relatedOrder ?? {}, ["customerPhone", "phone", "mobile"]),

      addressLine:
        getFirstText(assignment, ["addressLine1", "address"]) ??
        getFirstText(relatedAddress ?? {}, ["addressLine1", "address"]),
      city:
        getOptionalText(assignment, "city") ??
        getOptionalText(relatedAddress ?? {}, "city"),
      state:
        getOptionalText(assignment, "state") ??
        getOptionalText(relatedAddress ?? {}, "state"),
      pincode:
        getFirstText(assignment, ["pincode", "pinCode"]) ??
        getFirstText(relatedAddress ?? {}, ["pincode", "pinCode"]),

      agentLocation,
      customerLocation,
      distanceKm,
      lastLocationAgeMinutes,

      scheduledAt: getFirstText(assignment, [
        "scheduledAt",
        "pickupScheduledAt"
      ]),
      assignedAt,
      updatedAt,

      elapsedHours,
      breachedHours,

      issueFlags: buildIssueFlags({
        trackingStatus,
        breachedHours,
        lastLocationAgeMinutes,
        distanceKm
      }),
      recommendedActions: buildRecommendedActions({
        trackingStatus,
        riskLevel
      })
    };
  });
};

const buildSummary = (rows: AgentGeoTrackingRow[]): AgentGeoTrackingSummary => {
  const countTracking = (status: AgentGeoTrackingStatus): number =>
    rows.filter((row) => row.trackingStatus === status).length;

  const countRisk = (riskLevel: AgentGeoRiskLevel): number =>
    rows.filter((row) => row.riskLevel === riskLevel).length;

  // Exclude tasks without actual location logs from the average age calculation
  const rowsWithLocation = rows.filter(
    (row) => row.trackingStatus !== "NO_LOCATION"
  );

  const averageLocationAgeMinutes =
    rowsWithLocation.length > 0
      ? Number(
          (
            rowsWithLocation.reduce(
              (total, row) => total + row.lastLocationAgeMinutes,
              0
            ) / rowsWithLocation.length
          ).toFixed(2)
        )
      : 0;

  return {
    totalRows: rows.length,

    liveTrackingRows: countTracking("LIVE"),
    staleTrackingRows: countTracking("STALE"),
    noLocationRows: countTracking("NO_LOCATION"),
    completedRows: countTracking("COMPLETED"),
    failedRows: countTracking("FAILED"),

    lowRiskRows: countRisk("LOW"),
    mediumRiskRows: countRisk("MEDIUM"),
    highRiskRows: countRisk("HIGH"),
    criticalRiskRows: countRisk("CRITICAL"),

    activeAgents: new Set(rows.map((row) => row.agentId)).size,
    delayedTasks: rows.filter((row) => row.elapsedHours >= SLA_WARNING_HOURS)
      .length,
    breachedTasks: rows.filter((row) => row.breachedHours > 0).length,

    averageLocationAgeMinutes
  };
};

export const agentGeoTrackingService = {
  getDashboardData: async (): Promise<AgentGeoTrackingDashboardData> => {
    const [
      assignments,
      agents,
      returnRequests,
      orders,
      addresses,
      activityLogs,
      locationLogs
    ] = await Promise.all([
      safeArray<UnknownRecord>(AGENT_ASSIGNMENTS_ENDPOINT),
      safeArray<UnknownRecord>(AGENT_PROFILES_ENDPOINT),
      safeArray<UnknownRecord>(RETURN_REQUESTS_ENDPOINT),
      safeArray<UnknownRecord>(ORDERS_ENDPOINT),
      safeArray<UnknownRecord>(ADDRESSES_ENDPOINT),
      safeArray<UnknownRecord>(AGENT_MOBILE_ACTIVITY_LOGS_ENDPOINT),
      safeArray<AgentGeoLocationLog>(AGENT_GEO_LOCATION_LOGS_ENDPOINT)
    ]);

    const rows = buildRows({
      assignments,
      agents,
      returnRequests,
      orders,
      addresses,
      activityLogs,
      locationLogs
    }).sort((first, second) => {
      const riskRank: Record<AgentGeoRiskLevel, number> = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1
      };

      return (
        riskRank[second.riskLevel] - riskRank[first.riskLevel] ||
        second.breachedHours - first.breachedHours ||
        second.lastLocationAgeMinutes - first.lastLocationAgeMinutes
      );
    });

    return {
      rows,
      locationLogs,
      summary: buildSummary(rows)
    };
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
  },

  buildMapUrl: (location: AgentGeoLocation): string => {
    if (location.latitude !== undefined && location.longitude !== undefined) {
      return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    }

    return "https://www.google.com/maps";
  }
};