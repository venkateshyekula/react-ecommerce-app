import { apiClient } from "./apiClient";
import type {
  UnifiedAuditAction,
  UnifiedAuditComplianceStatus,
  UnifiedAuditSeverity,
  UnifiedAuditSource,
  UnifiedOperationsAuditDashboardData,
  UnifiedOperationsAuditExportLog,
  UnifiedOperationsAuditRecord,
  UnifiedOperationsAuditSummary
} from "../types/unifiedOperationsAudit";

const RETURN_REQUESTS_ENDPOINT = "/returnRequests";
const REFUNDS_ENDPOINT = "/refunds";
const REFUND_REQUESTS_ENDPOINT = "/refundRequests";
const PICKUP_PROOFS_ENDPOINT = "/pickupProofs";
const RETURN_PICKUP_PROOFS_ENDPOINT = "/returnPickupProofs";
const DELIVERY_PROOFS_ENDPOINT = "/deliveryProofs";
const RETURN_AUTOMATION_RULE_AUDIT_LOGS_ENDPOINT =
  "/returnAutomationRuleAuditLogs";
const RETURN_LOGISTICS_AUTOMATION_RULE_AUDIT_LOGS_ENDPOINT =
  "/returnLogisticsAutomationRuleAuditLogs";
const RETURN_SLA_ESCALATIONS_ENDPOINT = "/returnSlaEscalations";
const AGENT_ESCALATIONS_ENDPOINT = "/agentEscalations";
const SELLER_PAYOUT_ADJUSTMENTS_ENDPOINT = "/sellerPayoutAdjustments";
const SUPPORT_ESCALATIONS_ENDPOINT = "/supportEscalations";
const RETURN_OPERATIONS_AUDIT_EXPORTS_ENDPOINT =
  "/returnOperationsAuditExports";
const UNIFIED_OPERATIONS_AUDIT_EXPORTS_ENDPOINT =
  "/unifiedOperationsAuditExports";

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

export const toNumber = (value: unknown): number => {
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

const getFirstNumber = (item: UnknownRecord, keys: string[]): number => {
  for (const key of keys) {
    if (key in item && item[key] !== null && item[key] !== undefined) {
      const parsed = Number(item[key]);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
};

const getDateValue = (item: UnknownRecord): string => {
  return (
    getFirstText(item, [
      "updatedAt",
      "createdAt",
      "changedAt",
      "generatedAt",
      "resolvedAt",
      "auditAt"
    ]) ?? new Date().toISOString()
  );
};

const stringifySnapshot = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const getComplianceStatus = (
  severity: UnifiedAuditSeverity
): UnifiedAuditComplianceStatus => {
  if (severity === "CRITICAL") {
    return "NON_COMPLIANT";
  }
  if (severity === "HIGH" || severity === "MEDIUM") {
    return "REVIEW_REQUIRED";
  }
  return "COMPLIANT";
};

const getSeverity = ({
  source,
  action,
  status,
  amount
}: {
  source: UnifiedAuditSource;
  action: UnifiedAuditAction;
  status?: string;
  amount?: number;
}): UnifiedAuditSeverity => {
  const normalizedStatus = normalizeStatus(status);
  const valAmount = amount ?? 0;

  // CRITICAL Thresholds
  if (
    action === "PAYOUT_HOLD" ||
    normalizedStatus.includes("CRITICAL") ||
    valAmount >= 100000
  ) {
    return "CRITICAL";
  }

  // HIGH Thresholds
  if (
    action === "DELETED" ||
    action === "FAILED" ||
    action === "REJECTED" ||
    normalizedStatus.includes("FAILED") ||
    normalizedStatus.includes("REJECTED") ||
    normalizedStatus.includes("BREACHED") ||
    valAmount >= 50000
  ) {
    return "HIGH";
  }

  // MEDIUM Thresholds
  if (
    source === "AGENT_ESCALATION" ||
    source === "RETURN_SLA_ESCALATION" ||
    action === "ESCALATED" ||
    action === "REASSIGNED" ||
    action === "BULK_IMPORTED" ||
    valAmount >= 25000
  ) {
    return "MEDIUM";
  }

  return "LOW";
};

const mapStatusAction = (item: UnknownRecord): UnifiedAuditAction => {
  const status = normalizeStatus(
    getFirstText(item, ["status", "returnStatus", "refundStatus", "decision"])
  );

  if (status.includes("APPROVED")) return "APPROVED";
  if (status.includes("REJECTED") || status.includes("DENIED")) return "REJECTED";
  if (status.includes("COMPLETED") || status.includes("CLOSED")) return "COMPLETED";
  if (status.includes("FAILED")) return "FAILED";
  if (status.includes("ESCALATED")) return "ESCALATED";
  if (status.includes("RESOLVED")) return "RESOLVED";
  if (status.includes("CANCELLED")) return "CANCELLED";

  return "UPDATED";
};

const mapAutomationAuditAction = (
  item: UnknownRecord
): UnifiedAuditAction => {
  const action = normalizeStatus(getOptionalText(item, "action"));

  if (action === "CREATED") return "CREATED";
  if (action === "UPDATED" || action === "STATUS_CHANGED") return "UPDATED";
  if (action === "CLONED") return "CLONED";
  if (action === "DELETED") return "DELETED";
  if (action === "BULK_IMPORTED") return "BULK_IMPORTED";

  return "UPDATED";
};

const mapProofAction = (item: UnknownRecord): UnifiedAuditAction => {
  const status = normalizeStatus(
    getFirstText(item, ["verificationStatus", "status"])
  );

  if (status.includes("REJECTED")) return "PROOF_REJECTED";
  if (status.includes("APPROVED") || status.includes("VERIFIED")) return "PROOF_VERIFIED";

  return "PROOF_SUBMITTED";
};

const getEntityId = (item: UnknownRecord): string => {
  return getFirstText(item, ["id", "auditId", "escalationId", "adjustmentId"]) ?? createId("ENTITY");
};

const buildRecord = ({
  source,
  action,
  entityType,
  entityId,
  actorName,
  actorRole,
  summary,
  details,
  item,
  status,
  amount,
  createdAt
}: {
  source: UnifiedAuditSource;
  action: UnifiedAuditAction;
  entityType: string;
  entityId: string;
  actorName: string;
  actorRole: string;
  summary: string;
  details: string;
  item: UnknownRecord;
  status?: string;
  amount?: number;
  createdAt: string;
}): UnifiedOperationsAuditRecord => {
  const severity = getSeverity({
    source,
    action,
    status,
    amount
  });

  return {
    id: createId("UOA"),
    auditId: createId("UAUD"),
    source,
    action,
    severity,
    complianceStatus: getComplianceStatus(severity),

    entityId,
    entityType,

    returnRequestId: getFirstText(item, [
      "returnRequestId",
      "requestId",
      "returnId"
    ]),
    orderId: getFirstText(item, ["orderId", "order_id"]),

    customerId: getFirstText(item, ["customerId", "userId"]),
    customerName: getFirstText(item, ["customerName", "userName"]),
    customerEmail: getFirstText(item, ["customerEmail", "userEmail"]),

    sellerId: getOptionalText(item, "sellerId"),
    sellerName: getOptionalText(item, "sellerName"),

    agentId: getFirstText(item, ["agentId", "previousAgentId", "newAgentId"]),
    agentName: getFirstText(item, [
      "agentName",
      "previousAgentName",
      "newAgentName"
    ]),

    ruleId: getOptionalText(item, "ruleId"),
    ruleName: getOptionalText(item, "ruleName"),

    actorId: getFirstText(item, [
      "actorId",
      "changedById",
      "createdBy",
      "generatedBy"
    ]),
    actorName,
    actorRole,

    summary,
    details,

    beforeValue:
      stringifySnapshot(item.beforeValue) ??
      stringifySnapshot(item.beforeSnapshot),
    afterValue:
      stringifySnapshot(item.afterValue) ??
      stringifySnapshot(item.afterSnapshot),

    metadata: {
      status,
      amount,
      sourceCollection: source
    },

    createdAt
  };
};

const buildUnifiedRecords = ({
  returnRequests,
  refunds,
  refundRequests,
  pickupProofs,
  returnPickupProofs,
  deliveryProofs,
  returnAutomationRuleAuditLogs,
  returnLogisticsAutomationRuleAuditLogs,
  returnSlaEscalations,
  agentEscalations,
  sellerPayoutAdjustments,
  supportEscalations,
  returnOperationsAuditExports
}: {
  returnRequests: UnknownRecord[];
  refunds: UnknownRecord[];
  refundRequests: UnknownRecord[];
  pickupProofs: UnknownRecord[];
  returnPickupProofs: UnknownRecord[];
  deliveryProofs: UnknownRecord[];
  returnAutomationRuleAuditLogs: UnknownRecord[];
  returnLogisticsAutomationRuleAuditLogs: UnknownRecord[];
  returnSlaEscalations: UnknownRecord[];
  agentEscalations: UnknownRecord[];
  sellerPayoutAdjustments: UnknownRecord[];
  supportEscalations: UnknownRecord[];
  returnOperationsAuditExports: UnknownRecord[];
}): UnifiedOperationsAuditRecord[] => {
  const records: UnifiedOperationsAuditRecord[] = [];

  returnRequests.forEach((item) => {
    const action = mapStatusAction(item);
    const returnId = getFirstText(item, ["returnRequestId", "requestId", "id"]) ?? "N/A";

    records.push(
      buildRecord({
        source: "RETURN_REQUEST",
        action,
        entityType: "Return Request",
        entityId: getEntityId(item),
        actorName: getFirstText(item, ["updatedBy", "createdBy"]) ?? "System",
        actorRole: getOptionalText(item, "updatedByRole") ?? "SYSTEM",
        summary: `Return request ${returnId} ${action.toLowerCase().replace(/_/g, " ")}.`,
        details:
          getFirstText(item, [
            "reason",
            "returnReason",
            "comments",
            "customerComment"
          ]) ?? "Return request audit event.",
        item,
        status: getFirstText(item, ["status", "returnStatus"]),
        amount: getFirstNumber(item, ["refundAmount", "amount"]),
        createdAt: getDateValue(item)
      })
    );
  });

  [...refunds, ...refundRequests].forEach((item) => {
    const action = mapStatusAction(item);
    const refundId = getFirstText(item, ["refundId", "id"]) ?? "N/A";

    records.push(
      buildRecord({
        source: "REFUND",
        action,
        entityType: "Refund",
        entityId: getEntityId(item),
        actorName: getFirstText(item, ["updatedBy", "createdBy"]) ?? "System",
        actorRole: getOptionalText(item, "updatedByRole") ?? "SYSTEM",
        summary: `Refund ${refundId} ${action.toLowerCase().replace(/_/g, " ")}.`,
        details:
          getFirstText(item, ["reason", "notes"]) ?? "Refund audit event.",
        item,
        status: getFirstText(item, ["status", "refundStatus"]),
        amount: getFirstNumber(item, ["amount", "refundAmount"]),
        createdAt: getDateValue(item)
      })
    );
  });

  [...pickupProofs, ...returnPickupProofs].forEach((item) => {
    const action = mapProofAction(item);

    records.push(
      buildRecord({
        source: "PICKUP_PROOF",
        action,
        entityType: "Pickup Proof",
        entityId: getEntityId(item),
        actorName:
          getFirstText(item, ["agentName", "createdBy"]) ?? "Pickup Agent",
        actorRole: "PICKUP_AGENT",
        summary: `Pickup proof ${getEntityId(item)} ${action.toLowerCase().replace(/_/g, " ")}.`,
        details:
          getFirstText(item, ["notes", "remark"]) ??
          "Pickup proof audit event.",
        item,
        status: getFirstText(item, ["verificationStatus", "status"]),
        createdAt: getDateValue(item)
      })
    );
  });

  deliveryProofs.forEach((item) => {
    const action = mapProofAction(item);

    records.push(
      buildRecord({
        source: "DELIVERY_PROOF",
        action,
        entityType: "Delivery Proof",
        entityId: getEntityId(item),
        actorName:
          getFirstText(item, ["agentName", "createdBy"]) ?? "Delivery Agent",
        actorRole: "DELIVERY_AGENT",
        summary: `Delivery proof ${getEntityId(item)} ${action.toLowerCase().replace(/_/g, " ")}.`,
        details:
          getFirstText(item, ["notes", "remark"]) ??
          "Delivery proof audit event.",
        item,
        status: getFirstText(item, ["verificationStatus", "status"]),
        createdAt: getDateValue(item)
      })
    );
  });

  returnAutomationRuleAuditLogs.forEach((item) => {
    const action = mapAutomationAuditAction(item);
    const ruleLabel = getFirstText(item, ["ruleName", "ruleId"]) ?? "N/A";

    records.push(
      buildRecord({
        source: "RETURN_AUTOMATION_RULE",
        action,
        entityType: "Return Automation Rule",
        entityId: getEntityId(item),
        actorName: getOptionalText(item, "changedBy") ?? "Admin",
        actorRole: "ADMIN",
        summary:
          getOptionalText(item, "details") ??
          `Return automation rule ${ruleLabel} changed.`,
        details:
          getOptionalText(item, "details") ??
          "Return automation rule audit event.",
        item,
        status: getOptionalText(item, "action"),
        createdAt: getDateValue(item)
      })
    );
  });

  returnLogisticsAutomationRuleAuditLogs.forEach((item) => {
    const action = mapAutomationAuditAction(item);
    const ruleLabel = getFirstText(item, ["ruleName", "ruleId"]) ?? "N/A";

    records.push(
      buildRecord({
        source: "RETURN_LOGISTICS_RULE",
        action,
        entityType: "Return Logistics Automation Rule",
        entityId: getEntityId(item),
        actorName: getOptionalText(item, "changedBy") ?? "Admin",
        actorRole: "ADMIN",
        summary:
          getOptionalText(item, "details") ??
          `Return logistics rule ${ruleLabel} changed.`,
        details:
          getOptionalText(item, "details") ??
          "Return logistics automation rule audit event.",
        item,
        status: getOptionalText(item, "action"),
        createdAt: getDateValue(item)
      })
    );
  });

  returnSlaEscalations.forEach((item) => {
    const action = mapStatusAction(item);

    records.push(
      buildRecord({
        source: "RETURN_SLA_ESCALATION",
        action: action === "UPDATED" ? "ESCALATED" : action,
        entityType: "Return SLA Escalation",
        entityId: getEntityId(item),
        actorName: getOptionalText(item, "createdBy") ?? "Admin",
        actorRole: "ADMIN",
        summary: `SLA escalation ${getFirstText(item, ["escalationId", "id"]) ?? "N/A"} recorded.`,
        details:
          getFirstText(item, ["reason", "details"]) ??
          "Return SLA escalation event.",
        item,
        status: getOptionalText(item, "status"),
        createdAt: getDateValue(item)
      })
    );
  });

  agentEscalations.forEach((item) => {
    const actionText = normalizeStatus(getOptionalText(item, "action"));
    const action: UnifiedAuditAction =
      actionText.includes("REASSIGN") ? "REASSIGNED" : mapStatusAction(item);

    records.push(
      buildRecord({
        source: "AGENT_ESCALATION",
        action,
        entityType: "Agent Escalation",
        entityId: getEntityId(item),
        actorName: getOptionalText(item, "createdBy") ?? "Admin",
        actorRole: "ADMIN",
        summary: `Agent escalation ${getFirstText(item, ["escalationId", "id"]) ?? "N/A"} ${action.toLowerCase().replace(/_/g, " ")}.`,
        details:
          getFirstText(item, ["reason", "details"]) ??
          "Agent escalation audit event.",
        item,
        status: getOptionalText(item, "status"),
        createdAt: getDateValue(item)
      })
    );
  });

  sellerPayoutAdjustments.forEach((item) => {
    const settlementStatus = normalizeStatus(
      getFirstText(item, ["settlementStatus", "status"])
    );

    const action: UnifiedAuditAction = settlementStatus.includes("HOLD")
      ? "PAYOUT_HOLD"
      : settlementStatus.includes("RELEASE")
        ? "PAYOUT_RELEASE"
        : "SETTLEMENT_UPDATED";

    records.push(
      buildRecord({
        source: "SELLER_PAYOUT_ADJUSTMENT",
        action,
        entityType: "Seller Payout Adjustment",
        entityId: getEntityId(item),
        actorName: getOptionalText(item, "createdBy") ?? "Admin",
        actorRole: "ADMIN",
        summary: `Seller payout adjustment ${getFirstText(item, ["adjustmentId", "id"]) ?? "N/A"} updated.`,
        details:
          getFirstText(item, ["reason", "details"]) ??
          "Seller payout adjustment audit event.",
        item,
        status: getFirstText(item, ["settlementStatus", "status"]),
        amount: getFirstNumber(item, [
          "payoutDeductionAmount",
          "payoutHoldAmount",
          "finalPayableAmount"
        ]),
        createdAt: getDateValue(item)
      })
    );
  });

  supportEscalations.forEach((item) => {
    const action = mapStatusAction(item);

    records.push(
      buildRecord({
        source: "SUPPORT_ESCALATION",
        action: action === "UPDATED" ? "ESCALATED" : action,
        entityType: "Support Escalation",
        entityId: getEntityId(item),
        actorName: getFirstText(item, ["createdBy", "assignedTo"]) ?? "Support",
        actorRole: "SUPPORT",
        summary: `Support escalation ${getFirstText(item, ["escalationId", "id"]) ?? "N/A"} recorded.`,
        details:
          getFirstText(item, ["reason", "description", "details"]) ??
          "Support escalation audit event.",
        item,
        status: getOptionalText(item, "status"),
        createdAt: getDateValue(item)
      })
    );
  });

  returnOperationsAuditExports.forEach((item) => {
    records.push(
      buildRecord({
        source: "SYSTEM_EXPORT",
        action: "EXPORT_GENERATED",
        entityType: "Return Operations Audit Export",
        entityId: getEntityId(item),
        actorName: getOptionalText(item, "generatedBy") ?? "Admin",
        actorRole: "ADMIN",
        summary: `Audit export ${getFirstText(item, ["exportId", "id"]) ?? "N/A"} generated.`,
        details: `Export type ${getOptionalText(item, "exportType") ?? "N/A"} with ${getFirstNumber(item, ["recordCount"])} records.`,
        item,
        status: getOptionalText(item, "exportType"),
        amount: getFirstNumber(item, ["recordCount"]),
        createdAt: getDateValue(item)
      })
    );
  });

  return records.sort((first, second) => {
    const timeA = new Date(first.createdAt).getTime() || 0;
    const timeB = new Date(second.createdAt).getTime() || 0;
    return timeB - timeA;
  });
};

const buildSummary = (
  records: UnifiedOperationsAuditRecord[]
): UnifiedOperationsAuditSummary => {
  const summary: UnifiedOperationsAuditSummary = {
    totalRecords: records.length,

    returnEvents: 0,
    refundEvents: 0,
    proofEvents: 0,
    automationEvents: 0,
    slaEscalationEvents: 0,
    agentEscalationEvents: 0,
    sellerPayoutEvents: 0,
    supportEvents: 0,
    exportEvents: 0,

    lowSeverityEvents: 0,
    mediumSeverityEvents: 0,
    highSeverityEvents: 0,
    criticalSeverityEvents: 0,

    compliantEvents: 0,
    reviewRequiredEvents: 0,
    nonCompliantEvents: 0,

    exportableRecords: records.length,
    latestAuditAt: records[0]?.createdAt
  };

  // Single-pass O(N) summary aggregation
  records.forEach((record) => {
    // Source counting
    switch (record.source) {
      case "RETURN_REQUEST":
        summary.returnEvents++;
        break;
      case "REFUND":
        summary.refundEvents++;
        break;
      case "PICKUP_PROOF":
      case "DELIVERY_PROOF":
        summary.proofEvents++;
        break;
      case "RETURN_AUTOMATION_RULE":
      case "RETURN_LOGISTICS_RULE":
        summary.automationEvents++;
        break;
      case "RETURN_SLA_ESCALATION":
        summary.slaEscalationEvents++;
        break;
      case "AGENT_ESCALATION":
        summary.agentEscalationEvents++;
        break;
      case "SELLER_PAYOUT_ADJUSTMENT":
        summary.sellerPayoutEvents++;
        break;
      case "SUPPORT_ESCALATION":
        summary.supportEvents++;
        break;
      case "SYSTEM_EXPORT":
        summary.exportEvents++;
        break;
    }

    // Severity counting
    switch (record.severity) {
      case "LOW":
        summary.lowSeverityEvents++;
        break;
      case "MEDIUM":
        summary.mediumSeverityEvents++;
        break;
      case "HIGH":
        summary.highSeverityEvents++;
        break;
      case "CRITICAL":
        summary.criticalSeverityEvents++;
        break;
    }

    // Compliance counting
    switch (record.complianceStatus) {
      case "COMPLIANT":
        summary.compliantEvents++;
        break;
      case "REVIEW_REQUIRED":
        summary.reviewRequiredEvents++;
        break;
      case "NON_COMPLIANT":
        summary.nonCompliantEvents++;
        break;
    }
  });

  return summary;
};

const escapeCsvValue = (value: unknown): string => {
  let text = String(value ?? "");
  
  // Prevent CSV Formula Injection
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

const convertRecordsToCsv = (
  records: UnifiedOperationsAuditRecord[]
): string => {
  const headers = [
    "Audit ID",
    "Source",
    "Action",
    "Severity",
    "Compliance Status",
    "Entity Type",
    "Entity ID",
    "Return Request ID",
    "Order ID",
    "Customer",
    "Seller",
    "Agent",
    "Rule",
    "Actor",
    "Actor Role",
    "Summary",
    "Details",
    "Created At"
  ];

  const rows = records.map((record) => [
    record.auditId,
    record.source,
    record.action,
    record.severity,
    record.complianceStatus,
    record.entityType,
    record.entityId,
    record.returnRequestId ?? "",
    record.orderId ?? "",
    record.customerName ?? record.customerId ?? "",
    record.sellerName ?? record.sellerId ?? "",
    record.agentName ?? record.agentId ?? "",
    record.ruleName ?? record.ruleId ?? "",
    record.actorName,
    record.actorRole,
    record.summary,
    record.details,
    record.createdAt
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
};

const downloadFile = ({
  content,
  fileName,
  mimeType
}: {
  content: string;
  fileName: string;
  mimeType: string;
}): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const unifiedOperationsAuditService = {
  getDashboardData: async (): Promise<UnifiedOperationsAuditDashboardData> => {
    const [
      returnRequests,
      refunds,
      refundRequests,
      pickupProofs,
      returnPickupProofs,
      deliveryProofs,
      returnAutomationRuleAuditLogs,
      returnLogisticsAutomationRuleAuditLogs,
      returnSlaEscalations,
      agentEscalations,
      sellerPayoutAdjustments,
      supportEscalations,
      returnOperationsAuditExports
    ] = await Promise.all([
      safeArray<UnknownRecord>(RETURN_REQUESTS_ENDPOINT),
      safeArray<UnknownRecord>(REFUNDS_ENDPOINT),
      safeArray<UnknownRecord>(REFUND_REQUESTS_ENDPOINT),
      safeArray<UnknownRecord>(PICKUP_PROOFS_ENDPOINT),
      safeArray<UnknownRecord>(RETURN_PICKUP_PROOFS_ENDPOINT),
      safeArray<UnknownRecord>(DELIVERY_PROOFS_ENDPOINT),
      safeArray<UnknownRecord>(RETURN_AUTOMATION_RULE_AUDIT_LOGS_ENDPOINT),
      safeArray<UnknownRecord>(
        RETURN_LOGISTICS_AUTOMATION_RULE_AUDIT_LOGS_ENDPOINT
      ),
      safeArray<UnknownRecord>(RETURN_SLA_ESCALATIONS_ENDPOINT),
      safeArray<UnknownRecord>(AGENT_ESCALATIONS_ENDPOINT),
      safeArray<UnknownRecord>(SELLER_PAYOUT_ADJUSTMENTS_ENDPOINT),
      safeArray<UnknownRecord>(SUPPORT_ESCALATIONS_ENDPOINT),
      safeArray<UnknownRecord>(RETURN_OPERATIONS_AUDIT_EXPORTS_ENDPOINT)
    ]);

    const records = buildUnifiedRecords({
      returnRequests,
      refunds,
      refundRequests,
      pickupProofs,
      returnPickupProofs,
      deliveryProofs,
      returnAutomationRuleAuditLogs,
      returnLogisticsAutomationRuleAuditLogs,
      returnSlaEscalations,
      agentEscalations,
      sellerPayoutAdjustments,
      supportEscalations,
      returnOperationsAuditExports
    });

    return {
      summary: buildSummary(records),
      records
    };
  },

  exportCsv: async (
    records: UnifiedOperationsAuditRecord[]
  ): Promise<void> => {
    const generatedAt = new Date().toISOString();

    try {
      await apiClient.post<
        UnifiedOperationsAuditExportLog,
        UnifiedOperationsAuditExportLog
      >(UNIFIED_OPERATIONS_AUDIT_EXPORTS_ENDPOINT, {
        id: createId("UOEXP"),
        exportId: createId("UOAE"),
        exportType: "CSV",
        recordCount: records.length,
        generatedBy: "Admin",
        generatedAt
      });
    } catch {
      // Allow CSV file download even if audit logging fails
    }

    downloadFile({
      content: convertRecordsToCsv(records),
      fileName: `unified-operations-audit-${generatedAt.slice(0, 10)}.csv`,
      mimeType: "text/csv;charset=utf-8;"
    });
  },

  exportJson: async (
    records: UnifiedOperationsAuditRecord[]
  ): Promise<void> => {
    const generatedAt = new Date().toISOString();

    try {
      await apiClient.post<
        UnifiedOperationsAuditExportLog,
        UnifiedOperationsAuditExportLog
      >(UNIFIED_OPERATIONS_AUDIT_EXPORTS_ENDPOINT, {
        id: createId("UOEXP"),
        exportId: createId("UOAE"),
        exportType: "JSON",
        recordCount: records.length,
        generatedBy: "Admin",
        generatedAt
      });
    } catch {
      // Allow JSON file download even if audit logging fails
    }

    downloadFile({
      content: JSON.stringify(records, null, 2),
      fileName: `unified-operations-audit-${generatedAt.slice(0, 10)}.json`,
      mimeType: "application/json;charset=utf-8;"
    });
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