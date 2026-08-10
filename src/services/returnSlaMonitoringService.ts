import { apiClient } from "./apiClient";
import type {
  ReturnSlaEscalationAction,
  ReturnSlaEscalationPayload,
  ReturnSlaEscalationRecord,
  ReturnSlaEscalationStatus,
  ReturnSlaMonitoringDashboardData,
  ReturnSlaMonitoringRow,
  ReturnSlaMonitoringSummary,
  ReturnSlaRiskLevel,
  ReturnSlaRule,
  ReturnSlaStage,
  ReturnSlaStatus
} from "../types/returnSlaMonitoring";

const RETURN_REQUESTS_ENDPOINT = "/returnRequests";
const RETURN_PICKUP_ATTEMPTS_ENDPOINT = "/returnPickupAttempts";
const RETURN_QC_INSPECTIONS_ENDPOINT = "/returnQcInspections";
const REFUNDS_ENDPOINT = "/refunds";
const REFUND_REQUESTS_ENDPOINT = "/refundRequests";
const SELLER_RETURN_DISPUTES_ENDPOINT = "/sellerReturnDisputes";
const SUPPORT_ESCALATIONS_ENDPOINT = "/supportEscalations";
const RETURN_SLA_ESCALATIONS_ENDPOINT = "/returnSlaEscalations";

type UnknownRecord = Record<string, unknown>;

const SLA_RULES: ReturnSlaRule[] = [
  {
    stage: "RETURN_REQUEST",
    label: "Return Request Review",
    allowedHours: 24,
    warningHours: 18
  },
  {
    stage: "PICKUP",
    label: "Return Pickup",
    allowedHours: 48,
    warningHours: 36
  },
  {
    stage: "QC",
    label: "Warehouse QC",
    allowedHours: 24,
    warningHours: 18
  },
  {
    stage: "REFUND",
    label: "Refund Processing",
    allowedHours: 48,
    warningHours: 36
  },
  {
    stage: "SELLER_DISPUTE",
    label: "Seller Dispute Review",
    allowedHours: 72,
    warningHours: 54
  },
  {
    stage: "SUPPORT_ESCALATION",
    label: "Support Escalation",
    allowedHours: 24,
    warningHours: 18
  }
];

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

const normalizeStatus = (value: unknown): string => {
  return toText(value).toUpperCase();
};

const getNestedText = (item: UnknownRecord, path: string): string | undefined => {
  const keys = path.split(".");
  let current: unknown = item;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as UnknownRecord)[key];
    } else {
      return undefined;
    }
  }

  const text = toText(current);
  return text || undefined;
};

const getFirstText = (
  item: UnknownRecord,
  keys: string[]
): string | undefined => {
  for (const key of keys) {
    const value = getNestedText(item, key);

    if (value) {
      return value;
    }
  }

  return undefined;
};

const getDateTime = (value?: string): number | null => {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

const getNowIso = (): string => {
  return new Date().toISOString();
};

const addHours = (
  dateValue: string | undefined,
  hours: number
): string | undefined => {
  if (!dateValue) {
    return undefined;
  }

  const dateTime = getDateTime(dateValue);

  if (dateTime === null) {
    return undefined;
  }

  return new Date(dateTime + hours * 60 * 60 * 1000).toISOString();
};

const diffHours = (startDate?: string, endDate?: string): number => {
  const start = getDateTime(startDate);
  const end = getDateTime(endDate) ?? getDateTime(getNowIso());

  if (start === null || end === null) {
    return 0;
  }

  return Math.max(Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10, 0);
};

const getReturnRequestId = (item: UnknownRecord): string => {
  return (
    getFirstText(item, ["returnRequestId", "requestId", "id"]) ??
    createId("RET")
  );
};

const getOrderId = (item: UnknownRecord): string | undefined => {
  return getFirstText(item, ["orderId", "order_id"]);
};

const isReturnCompleted = (item: UnknownRecord): boolean => {
  const status = normalizeStatus(getFirstText(item, ["status", "returnStatus"]));
  const refundStatus = normalizeStatus(getFirstText(item, ["refundStatus"]));

  return (
    status.includes("COMPLETED") ||
    status.includes("CLOSED") ||
    status.includes("REFUNDED") ||
    refundStatus.includes("COMPLETED")
  );
};

const getSlaStatus = ({
  elapsedHours,
  allowedHours,
  warningHours,
  completedAt,
  escalationStatus
}: {
  elapsedHours: number;
  allowedHours: number;
  warningHours: number;
  completedAt?: string;
  escalationStatus?: ReturnSlaEscalationStatus;
}): ReturnSlaStatus => {
  if (completedAt) {
    return "COMPLETED";
  }

  if (escalationStatus && escalationStatus !== "RESOLVED") {
    return "ESCALATED";
  }

  if (elapsedHours > allowedHours) {
    return "BREACHED";
  }

  if (elapsedHours >= warningHours) {
    return "WARNING";
  }

  return "WITHIN_SLA";
};

const getRiskLevel = ({
  status,
  breachedHours,
  elapsedHours,
  allowedHours
}: {
  status: ReturnSlaStatus;
  breachedHours: number;
  elapsedHours: number;
  allowedHours: number;
}): ReturnSlaRiskLevel => {
  if (status === "ESCALATED" || breachedHours >= 24) {
    return "CRITICAL";
  }

  if (status === "BREACHED" || breachedHours >= 8) {
    return "HIGH";
  }

  if (status === "WARNING" || elapsedHours >= allowedHours * 0.75) {
    return "MEDIUM";
  }

  return "LOW";
};

const getStageStatus = ({
  request,
  pickupAttempts,
  qcInspections,
  refunds,
  refundRequests,
  sellerDisputes,
  supportEscalations,
  stage
}: {
  request: UnknownRecord;
  pickupAttempts: UnknownRecord[];
  qcInspections: UnknownRecord[];
  refunds: UnknownRecord[];
  refundRequests: UnknownRecord[];
  sellerDisputes: UnknownRecord[];
  supportEscalations: UnknownRecord[];
  stage: ReturnSlaStage;
}): {
  startedAt?: string;
  completedAt?: string;
  lastActivityAt?: string;
  statusText?: string;
} => {
  const returnRequestId = getReturnRequestId(request);
  const orderId = getOrderId(request);

  const matchesReturn = (item: UnknownRecord): boolean => {
    const itemReturnId = getFirstText(item, [
      "returnRequestId",
      "returnRequestDbId",
      "requestId"
    ]);

    if (itemReturnId) {
      return itemReturnId === returnRequestId;
    }

    const itemOrderId = getOrderId(item);
    return Boolean(itemOrderId && orderId && itemOrderId === orderId);
  };

  if (stage === "RETURN_REQUEST") {
    const completedAt = isReturnCompleted(request)
      ? getFirstText(request, ["updatedAt", "completedAt", "closedAt"])
      : undefined;

    return {
      startedAt: getFirstText(request, ["createdAt", "requestedAt"]),
      completedAt,
      lastActivityAt: getFirstText(request, ["updatedAt", "createdAt"]),
      statusText: getFirstText(request, ["status", "returnStatus"])
    };
  }

  if (stage === "PICKUP") {
    const attempts = pickupAttempts.filter(matchesReturn);
    const latestAttempt = [...attempts].sort(
      (first, second) =>
        (getDateTime(getFirstText(second, ["updatedAt", "createdAt", "attemptedAt"])) ?? 0) -
        (getDateTime(getFirstText(first, ["updatedAt", "createdAt", "attemptedAt"])) ?? 0)
    )[0];

    const status = normalizeStatus(
      getFirstText(latestAttempt ?? {}, ["status", "pickupStatus"])
    );

    const completedAt =
      status.includes("COMPLETED") || status.includes("PICKED")
        ? getFirstText(latestAttempt ?? {}, [
            "updatedAt",
            "completedAt",
            "attemptedAt"
          ])
        : undefined;

    return {
      startedAt: getFirstText(request, ["approvedAt", "createdAt", "requestedAt"]),
      completedAt,
      lastActivityAt: getFirstText(latestAttempt ?? request, [
        "updatedAt",
        "createdAt",
        "attemptedAt"
      ]),
      statusText: getFirstText(latestAttempt ?? {}, ["status", "pickupStatus"])
    };
  }

  if (stage === "QC") {
    const inspections = qcInspections.filter(matchesReturn);
    const latestInspection = [...inspections].sort(
      (first, second) =>
        (getDateTime(getFirstText(second, ["updatedAt", "createdAt", "inspectedAt"])) ?? 0) -
        (getDateTime(getFirstText(first, ["updatedAt", "createdAt", "inspectedAt"])) ?? 0)
    )[0];

    const status = normalizeStatus(
      getFirstText(latestInspection ?? request, [
        "qcStatus",
        "qualityCheckStatus",
        "status",
        "qcResult"
      ])
    );

    const completedAt =
      status.includes("PASSED") ||
      status.includes("FAILED") ||
      status.includes("REJECTED") ||
      status.includes("APPROVED")
        ? getFirstText(latestInspection ?? request, [
            "updatedAt",
            "completedAt",
            "inspectedAt"
          ])
        : undefined;

    return {
      startedAt: getFirstText(request, ["pickupCompletedAt", "updatedAt", "createdAt"]),
      completedAt,
      lastActivityAt: getFirstText(latestInspection ?? request, [
        "updatedAt",
        "createdAt",
        "inspectedAt"
      ]),
      statusText: getFirstText(latestInspection ?? request, [
        "qcStatus",
        "qualityCheckStatus",
        "status",
        "qcResult"
      ])
    };
  }

  if (stage === "REFUND") {
    const refundItems = [...refunds, ...refundRequests].filter(matchesReturn);
    const latestRefund = [...refundItems].sort(
      (first, second) =>
        (getDateTime(getFirstText(second, ["updatedAt", "createdAt", "processedAt"])) ?? 0) -
        (getDateTime(getFirstText(first, ["updatedAt", "createdAt", "processedAt"])) ?? 0)
    )[0];

    const status = normalizeStatus(
      getFirstText(latestRefund ?? request, ["status", "refundStatus"])
    );

    const completedAt =
      status.includes("COMPLETED") ||
      status.includes("RELEASED") ||
      status.includes("PROCESSED")
        ? getFirstText(latestRefund ?? request, [
            "updatedAt",
            "processedAt",
            "completedAt"
          ])
        : undefined;

    return {
      startedAt: getFirstText(request, ["qcCompletedAt", "updatedAt", "createdAt"]),
      completedAt,
      lastActivityAt: getFirstText(latestRefund ?? request, [
        "updatedAt",
        "createdAt",
        "processedAt"
      ]),
      statusText: getFirstText(latestRefund ?? request, ["status", "refundStatus"])
    };
  }

  if (stage === "SELLER_DISPUTE") {
    const disputes = sellerDisputes.filter(matchesReturn);
    const latestDispute = [...disputes].sort(
      (first, second) =>
        (getDateTime(getFirstText(second, ["updatedAt", "createdAt"])) ?? 0) -
        (getDateTime(getFirstText(first, ["updatedAt", "createdAt"])) ?? 0)
    )[0];

    if (!latestDispute) {
      return {};
    }

    const status = normalizeStatus(
      getFirstText(latestDispute, ["status", "decision"])
    );

    const completedAt =
      status.includes("APPROVED") ||
      status.includes("REJECTED") ||
      status.includes("DENIED")
        ? getFirstText(latestDispute, ["updatedAt", "resolvedAt"])
        : undefined;

    return {
      startedAt: getFirstText(latestDispute, ["createdAt", "raisedAt"]),
      completedAt,
      lastActivityAt: getFirstText(latestDispute, ["updatedAt", "createdAt"]),
      statusText: getFirstText(latestDispute, ["status", "decision"])
    };
  }

  const escalations = supportEscalations.filter(matchesReturn);
  const latestEscalation = [...escalations].sort(
    (first, second) =>
      (getDateTime(getFirstText(second, ["updatedAt", "createdAt"])) ?? 0) -
      (getDateTime(getFirstText(first, ["updatedAt", "createdAt"])) ?? 0)
  )[0];

  if (!latestEscalation) {
    return {};
  }

  const status = normalizeStatus(getFirstText(latestEscalation, ["status"]));

  const completedAt =
    status.includes("RESOLVED") || status.includes("CLOSED")
      ? getFirstText(latestEscalation, ["updatedAt", "resolvedAt"])
      : undefined;

  return {
    startedAt: getFirstText(latestEscalation, ["createdAt"]),
    completedAt,
    lastActivityAt: getFirstText(latestEscalation, ["updatedAt", "createdAt"]),
    statusText: getFirstText(latestEscalation, ["status"])
  };
};

const findEscalationForStage = ({
  escalations,
  returnRequestId,
  stage
}: {
  escalations: ReturnSlaEscalationRecord[];
  returnRequestId: string;
  stage: ReturnSlaStage;
}): ReturnSlaEscalationRecord | undefined => {
  return escalations.find(
    (item) =>
      item.returnRequestId === returnRequestId &&
      item.stage === stage &&
      item.status !== "RESOLVED" &&
      item.status !== "CANCELLED"
  );
};

const buildReasons = ({
  stageLabel,
  status,
  elapsedHours,
  allowedHours,
  breachedHours
}: {
  stageLabel: string;
  status: ReturnSlaStatus;
  elapsedHours: number;
  allowedHours: number;
  breachedHours: number;
}): string[] => {
  const reasons: string[] = [];

  if (status === "COMPLETED") {
    reasons.push(`${stageLabel} is completed.`);
  } else if (status === "ESCALATED") {
    reasons.push(`${stageLabel} is already escalated.`);
  } else if (status === "BREACHED") {
    reasons.push(
      `${stageLabel} breached SLA by ${Math.round(breachedHours)} hour(s).`
    );
  } else if (status === "WARNING") {
    reasons.push(`${stageLabel} is close to SLA breach.`);
  } else {
    reasons.push(`${stageLabel} is within SLA.`);
  }

  reasons.push(`Elapsed ${elapsedHours} hour(s) out of ${allowedHours} allowed.`);

  return reasons;
};

const buildRecommendedActions = ({
  stage,
  status
}: {
  stage: ReturnSlaStage;
  status: ReturnSlaStatus;
}): string[] => {
  if (status === "COMPLETED") {
    return ["No action required. Continue monitoring."];
  }

  if (status === "ESCALATED") {
    return ["Follow up with assigned team until resolution."];
  }

  if (stage === "PICKUP") {
    return ["Escalate to pickup manager if the pickup is not completed."];
  }

  if (stage === "QC") {
    return ["Escalate to QC manager for warehouse inspection completion."];
  }

  if (stage === "REFUND") {
    return ["Escalate to refund team to process customer refund."];
  }

  if (stage === "SELLER_DISPUTE") {
    return ["Escalate seller dispute to admin review queue."];
  }

  if (stage === "SUPPORT_ESCALATION") {
    return ["Escalate to support lead for case closure."];
  }

  return ["Review return request and update SLA status."];
};

const buildRows = ({
  returnRequests,
  pickupAttempts,
  qcInspections,
  refunds,
  refundRequests,
  sellerDisputes,
  supportEscalations,
  slaEscalations
}: {
  returnRequests: UnknownRecord[];
  pickupAttempts: UnknownRecord[];
  qcInspections: UnknownRecord[];
  refunds: UnknownRecord[];
  refundRequests: UnknownRecord[];
  sellerDisputes: UnknownRecord[];
  supportEscalations: UnknownRecord[];
  slaEscalations: ReturnSlaEscalationRecord[];
}): ReturnSlaMonitoringRow[] => {
  const rows: ReturnSlaMonitoringRow[] = [];

  returnRequests.forEach((request) => {
    const returnRequestId = getReturnRequestId(request);

    SLA_RULES.forEach((rule) => {
      const stageData = getStageStatus({
        request,
        pickupAttempts,
        qcInspections,
        refunds,
        refundRequests,
        sellerDisputes,
        supportEscalations,
        stage: rule.stage
      });

      if (!stageData.startedAt && rule.stage !== "RETURN_REQUEST") {
        return;
      }

      const activeEscalation = findEscalationForStage({
        escalations: slaEscalations,
        returnRequestId,
        stage: rule.stage
      });

      const elapsedHours = diffHours(
        stageData.startedAt,
        stageData.completedAt ?? getNowIso()
      );

      const dueAt = addHours(stageData.startedAt, rule.allowedHours);
      const remainingHours = Math.max(rule.allowedHours - elapsedHours, 0);
      const breachedHours = Math.max(elapsedHours - rule.allowedHours, 0);

      const slaStatus = getSlaStatus({
        elapsedHours,
        allowedHours: rule.allowedHours,
        warningHours: rule.warningHours,
        completedAt: stageData.completedAt,
        escalationStatus: activeEscalation?.status
      });

      const riskLevel = getRiskLevel({
        status: slaStatus,
        breachedHours,
        elapsedHours,
        allowedHours: rule.allowedHours
      });

      rows.push({
        id: `${returnRequestId}-${rule.stage}`,
        returnRequestId,
        orderId: getOrderId(request),

        customerId: getFirstText(request, ["customerId", "userId", "customer.id", "user.id"]),
        customerName: getFirstText(request, ["customerName", "userName", "customer.name", "user.name"]),
        customerEmail: getFirstText(request, ["customerEmail", "userEmail", "customer.email", "user.email"]),

        sellerId: getFirstText(request, ["sellerId", "seller.id"]),
        sellerName: getFirstText(request, ["sellerName", "seller.name"]),

        stage: rule.stage,
        stageLabel: rule.label,

        status: slaStatus,
        riskLevel,

        startedAt: stageData.startedAt,
        dueAt,
        completedAt: stageData.completedAt,
        lastActivityAt: stageData.lastActivityAt,

        elapsedHours,
        allowedHours: rule.allowedHours,
        remainingHours,
        breachedHours,

        returnStatus: getFirstText(request, ["status", "returnStatus"]),
        pickupStatus:
          rule.stage === "PICKUP" ? stageData.statusText : undefined,
        qcStatus: rule.stage === "QC" ? stageData.statusText : undefined,
        refundStatus: rule.stage === "REFUND" ? stageData.statusText : undefined,
        disputeStatus:
          rule.stage === "SELLER_DISPUTE" ? stageData.statusText : undefined,

        escalationStatus: activeEscalation?.status,
        escalationId: activeEscalation?.escalationId,
        assignedTeam: activeEscalation?.assignedTeam,
        assignedTo: activeEscalation?.assignedTo,

        slaReasons: buildReasons({
          stageLabel: rule.label,
          status: slaStatus,
          elapsedHours,
          allowedHours: rule.allowedHours,
          breachedHours
        }),
        recommendedActions: buildRecommendedActions({
          stage: rule.stage,
          status: slaStatus
        }),

        updatedAt:
          stageData.lastActivityAt ?? getFirstText(request, ["updatedAt", "createdAt"])
      });
    });
  });

  return rows.sort((first, second) => {
    const riskRank: Record<ReturnSlaRiskLevel, number> = {
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

const buildSummary = (
  rows: ReturnSlaMonitoringRow[],
  escalationRecords: ReturnSlaEscalationRecord[]
): ReturnSlaMonitoringSummary => {
  const countStatus = (status: ReturnSlaStatus): number =>
    rows.filter((row) => row.status === status).length;

  const countRisk = (riskLevel: ReturnSlaRiskLevel): number =>
    rows.filter((row) => row.riskLevel === riskLevel).length;

  const countBreachedStage = (stage: ReturnSlaStage): number =>
    rows.filter(
      (row) =>
        row.stage === stage &&
        (row.status === "BREACHED" || row.status === "ESCALATED")
    ).length;

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
    totalSlaRows: rows.length,

    withinSlaCount: countStatus("WITHIN_SLA"),
    warningCount: countStatus("WARNING"),
    breachedCount: countStatus("BREACHED"),
    escalatedCount: countStatus("ESCALATED"),
    completedCount: countStatus("COMPLETED"),

    lowRiskCount: countRisk("LOW"),
    mediumRiskCount: countRisk("MEDIUM"),
    highRiskCount: countRisk("HIGH"),
    criticalRiskCount: countRisk("CRITICAL"),

    pickupBreaches: countBreachedStage("PICKUP"),
    qcBreaches: countBreachedStage("QC"),
    refundBreaches: countBreachedStage("REFUND"),
    sellerDisputeBreaches: countBreachedStage("SELLER_DISPUTE"),
    supportEscalationBreaches: countBreachedStage("SUPPORT_ESCALATION"),

    openEscalations: escalationRecords.filter(
      (item) => item.status === "OPEN" || item.status === "IN_PROGRESS"
    ).length,
    resolvedEscalations: escalationRecords.filter(
      (item) => item.status === "RESOLVED"
    ).length,

    averageElapsedHours
  };
};

const getTeamForAction = (action: ReturnSlaEscalationAction): string => {
  if (action === "ESCALATE_TO_QC_MANAGER") {
    return "QC Team";
  }

  if (action === "ESCALATE_TO_REFUND_TEAM") {
    return "Refund Team";
  }

  if (action === "ESCALATE_TO_PICKUP_MANAGER") {
    return "Pickup Operations";
  }

  if (action === "ESCALATE_TO_SUPPORT") {
    return "Support Team";
  }

  return "Admin Operations";
};

const buildEscalationRecord = (
  payload: ReturnSlaEscalationPayload
): ReturnSlaEscalationRecord => {
  const now = getNowIso();

  const status: ReturnSlaEscalationStatus =
    payload.action === "MARK_RESOLVED"
      ? "RESOLVED"
      : payload.action === "CANCEL_ESCALATION"
        ? "CANCELLED"
        : "OPEN";

  return {
    id: createId("RSLA"),
    escalationId: createId("SLAESC"),
    returnRequestId: payload.row.returnRequestId,
    orderId: payload.row.orderId,

    stage: payload.row.stage,
    action: payload.action,
    status,

    riskLevel: payload.row.riskLevel,
    reason: payload.reason,

    assignedTeam: getTeamForAction(payload.action),
    assignedTo: undefined,

    createdBy: "Admin",
    createdAt: now,
    updatedAt: now,
    resolvedAt: status === "RESOLVED" ? now : undefined
  };
};

export const returnSlaMonitoringService = {
  getDashboardData: async (): Promise<ReturnSlaMonitoringDashboardData> => {
    const [
      returnRequests,
      pickupAttempts,
      qcInspections,
      refunds,
      refundRequests,
      sellerDisputes,
      supportEscalations,
      slaEscalations
    ] = await Promise.all([
      safeArray<UnknownRecord>(RETURN_REQUESTS_ENDPOINT),
      safeArray<UnknownRecord>(RETURN_PICKUP_ATTEMPTS_ENDPOINT),
      safeArray<UnknownRecord>(RETURN_QC_INSPECTIONS_ENDPOINT),
      safeArray<UnknownRecord>(REFUNDS_ENDPOINT),
      safeArray<UnknownRecord>(REFUND_REQUESTS_ENDPOINT),
      safeArray<UnknownRecord>(SELLER_RETURN_DISPUTES_ENDPOINT),
      safeArray<UnknownRecord>(SUPPORT_ESCALATIONS_ENDPOINT),
      safeArray<ReturnSlaEscalationRecord>(RETURN_SLA_ESCALATIONS_ENDPOINT)
    ]);

    const rows = buildRows({
      returnRequests,
      pickupAttempts,
      qcInspections,
      refunds,
      refundRequests,
      sellerDisputes,
      supportEscalations,
      slaEscalations
    });

    return {
      summary: buildSummary(rows, slaEscalations),
      rows,
      escalationRecords: slaEscalations
    };
  },

  createEscalation: async (
    payload: ReturnSlaEscalationPayload
  ): Promise<ReturnSlaEscalationRecord> => {
    const escalationRecord = buildEscalationRecord(payload);

    return apiClient.post<ReturnSlaEscalationRecord, ReturnSlaEscalationRecord>(
      RETURN_SLA_ESCALATIONS_ENDPOINT,
      escalationRecord
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