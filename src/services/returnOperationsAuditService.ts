import { apiClient } from "./apiClient";
import type {
  ReturnAuditAction,
  ReturnAuditComplianceStatus,
  ReturnAuditSeverity,
  ReturnAuditSource,
  ReturnOperationsAuditDashboardData,
  ReturnOperationsAuditRecord,
  ReturnOperationsAuditSummary
} from "../types/returnOperationsAudit";

const RETURN_REQUESTS_ENDPOINT = "/returnRequests";
const REFUNDS_ENDPOINT = "/refunds";
const PICKUP_PROOFS_ENDPOINT = "/pickupProofs";
const DELIVERY_PROOFS_ENDPOINT = "/deliveryProofs";
const SELLER_RETURN_DISPUTES_ENDPOINT = "/sellerReturnDisputes";
const DAMAGED_RETURN_INVENTORY_ENDPOINT = "/damagedReturnInventory";
const RETURN_AUTOMATION_RULE_AUDIT_LOGS_ENDPOINT =
  "/returnAutomationRuleAuditLogs";
const RETURN_OPERATIONS_AUDIT_EXPORTS_ENDPOINT =
  "/returnOperationsAuditExports";

type UnknownRecord = Record<string, unknown>;

type ExportPayload = {
  id: string;
  exportId: string;
  exportType: "CSV" | "JSON";
  recordCount: number;
  generatedBy: string;
  generatedAt: string;
};

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

const getFirstNumber = (item: UnknownRecord, keys: string[]): number => {
  for (const key of keys) {
    const value = item[key];
    const numberValue = toNumber(value);

    if (numberValue > 0) {
      return numberValue;
    }
  }

  return 0;
};

const createId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const getDateValue = (item: UnknownRecord): string => {
  return (
    getFirstText(item, ["updatedAt", "createdAt", "changedAt", "auditAt"]) ??
    new Date().toISOString()
  );
};

const getReturnRequestId = (item: UnknownRecord): string | undefined => {
  return getFirstText(item, ["returnRequestId", "requestId", "id"]);
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

const getAuditSeverity = ({
  source,
  action,
  status,
  amount
}: {
  source: ReturnAuditSource;
  action: ReturnAuditAction;
  status?: string;
  amount?: number;
}): ReturnAuditSeverity => {
  const normalizedStatus = normalizeStatus(status);

  if (
    action === "QC_FAILED" ||
    action === "PROOF_REJECTED" ||
    action === "DISPUTE_APPROVED" ||
    action === "REFUND_HOLD" ||
    action === "RULE_DELETED"
  ) {
    return "HIGH";
  }

  if (
    normalizedStatus.includes("FRAUD") ||
    normalizedStatus.includes("REJECTED") ||
    normalizedStatus.includes("FAILED") ||
    (amount ?? 0) >= 25000
  ) {
    return "HIGH";
  }

  if (
    source === "AUTOMATION_RULE" ||
    action === "STATUS_CHANGED" ||
    action === "DISPUTE_RAISED"
  ) {
    return "MEDIUM";
  }

  return "LOW";
};

const getComplianceStatus = (
  severity: ReturnAuditSeverity
): ReturnAuditComplianceStatus => {
  if (severity === "CRITICAL") {
    return "NON_COMPLIANT";
  }

  if (severity === "HIGH" || severity === "MEDIUM") {
    return "REVIEW_REQUIRED";
  }

  return "COMPLIANT";
};

const mapReturnRequestAction = (request: UnknownRecord): ReturnAuditAction => {
  const status = normalizeStatus(
    getFirstText(request, ["status", "returnStatus"])
  );

  const qcStatus = normalizeStatus(
    getFirstText(request, [
      "qualityCheckStatus",
      "qcStatus",
      "qcDecision",
      "qcResult"
    ])
  );

  if (qcStatus.includes("FAILED") || qcStatus.includes("REJECTED")) {
    return "QC_FAILED";
  }

  if (qcStatus.includes("PASSED") || qcStatus.includes("APPROVED")) {
    return "QC_PASSED";
  }

  if (status.includes("APPROVED")) {
    return "APPROVED";
  }

  if (status.includes("REJECTED")) {
    return "REJECTED";
  }

  if (status.includes("COMPLETED") || status.includes("CLOSED")) {
    return "STATUS_CHANGED";
  }

  return "CREATED";
};

const mapRefundAction = (refund: UnknownRecord): ReturnAuditAction => {
  const status = normalizeStatus(
    getFirstText(refund, ["status", "refundStatus"])
  );

  if (status.includes("HOLD")) {
    return "REFUND_HOLD";
  }

  if (status.includes("RELEASED") || status.includes("COMPLETED")) {
    return "REFUND_RELEASED";
  }

  if (status.includes("REJECTED")) {
    return "REJECTED";
  }

  if (status.includes("APPROVED")) {
    return "APPROVED";
  }

  return "UPDATED";
};

const mapProofAction = (proof: UnknownRecord): ReturnAuditAction => {
  const status = normalizeStatus(
    getFirstText(proof, ["verificationStatus", "status"])
  );

  if (status.includes("REJECTED")) {
    return "PROOF_REJECTED";
  }

  if (status.includes("APPROVED") || status.includes("VERIFIED")) {
    return "APPROVED";
  }

  return "PROOF_SUBMITTED";
};

const mapSellerDisputeAction = (
  dispute: UnknownRecord
): ReturnAuditAction => {
  const status = normalizeStatus(
    getFirstText(dispute, ["status", "decision"])
  );

  if (
    status.includes("APPROVED") ||
    status.includes("SELLER_LIABLE") ||
    status.includes("ADMIN_APPROVED")
  ) {
    return "DISPUTE_APPROVED";
  }

  if (
    status.includes("REJECTED") ||
    status.includes("DENIED") ||
    status.includes("ADMIN_REJECTED")
  ) {
    return "DISPUTE_REJECTED";
  }

  return "DISPUTE_RAISED";
};

const mapAutomationRuleAction = (
  log: UnknownRecord
): ReturnAuditAction => {
  const action = normalizeStatus(getOptionalText(log, "action"));

  if (action === "CREATED") {
    return "RULE_CREATED";
  }

  if (action === "UPDATED" || action === "STATUS_CHANGED") {
    return "RULE_UPDATED";
  }

  if (action === "CLONED") {
    return "RULE_CLONED";
  }

  if (action === "DELETED") {
    return "RULE_DELETED";
  }

  if (action === "BULK_IMPORTED") {
    return "RULE_BULK_IMPORTED";
  }

  return "UPDATED";
};

const buildRecord = ({
  source,
  action,
  entityId,
  entityType,
  actorName,
  actorRole,
  summary,
  details,
  createdAt,
  status,
  amount,
  item
}: {
  source: ReturnAuditSource;
  action: ReturnAuditAction;
  entityId: string;
  entityType: string;
  actorName: string;
  actorRole: string;
  summary: string;
  details: string;
  createdAt: string;
  status?: string;
  amount?: number;
  item: UnknownRecord;
}): ReturnOperationsAuditRecord => {
  const severity = getAuditSeverity({
    source,
    action,
    status,
    amount
  });

  return {
    id: createId("ROA"),
    auditId: createId("AUDIT"),
    source,
    action,
    severity,
    complianceStatus: getComplianceStatus(severity),

    entityId,
    entityType,

    returnRequestId: getReturnRequestId(item),
    orderId: getOptionalText(item, "orderId"),

    customerId: getFirstText(item, ["customerId", "userId"]),
    customerName: getFirstText(item, ["customerName", "userName"]),
    customerEmail: getFirstText(item, ["customerEmail", "userEmail"]),

    sellerId: getOptionalText(item, "sellerId"),
    sellerName: getOptionalText(item, "sellerName"),

    ruleId: getOptionalText(item, "ruleId"),
    ruleName: getOptionalText(item, "ruleName"),

    actorId: getFirstText(item, [
      "changedById",
      "actorId",
      "agentId",
      "createdBy"
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
      status: getFirstText(item, [
        "status",
        "refundStatus",
        "verificationStatus"
      ]),
      amount,
      sourceCollection: source
    },

    createdAt
  };
};

const buildAuditRecords = ({
  returnRequests,
  refunds,
  pickupProofs,
  deliveryProofs,
  sellerDisputes,
  damagedInventory,
  ruleAuditLogs
}: {
  returnRequests: UnknownRecord[];
  refunds: UnknownRecord[];
  pickupProofs: UnknownRecord[];
  deliveryProofs: UnknownRecord[];
  sellerDisputes: UnknownRecord[];
  damagedInventory: UnknownRecord[];
  ruleAuditLogs: UnknownRecord[];
}): ReturnOperationsAuditRecord[] => {
  const records: ReturnOperationsAuditRecord[] = [];

  returnRequests.forEach((request) => {
    const action = mapReturnRequestAction(request);
    const returnRequestId = getReturnRequestId(request);

    records.push(
      buildRecord({
        source: "RETURN_REQUEST",
        action,
        entityId: toText(request.id),
        entityType: "Return Request",
        actorName: getFirstText(request, ["updatedBy", "createdBy"]) ?? "System",
        actorRole: getOptionalText(request, "updatedByRole") ?? "SYSTEM",
        summary: `Return request ${returnRequestId ?? "N/A"} ${action
          .toLowerCase()
          .replace(/_/g, " ")}.`,
        details:
          getFirstText(request, [
            "customerComment",
            "comments",
            "reason",
            "returnReason"
          ]) ?? "Return request audit event.",
        createdAt: getDateValue(request),
        status: getFirstText(request, [
          "status",
          "returnStatus",
          "qualityCheckStatus"
        ]),
        amount: getFirstNumber(request, ["refundAmount"]),
        item: request
      })
    );
  });

  refunds.forEach((refund) => {
    const action = mapRefundAction(refund);
    const refundId = getFirstText(refund, ["refundId", "id"]) ?? "N/A";

    records.push(
      buildRecord({
        source: "REFUND",
        action,
        entityId: toText(refund.id),
        entityType: "Refund",
        actorName: getFirstText(refund, ["updatedBy", "createdBy"]) ?? "System",
        actorRole: getOptionalText(refund, "updatedByRole") ?? "SYSTEM",
        summary: `Refund ${refundId} ${action
          .toLowerCase()
          .replace(/_/g, " ")}.`,
        details:
          getFirstText(refund, ["notes", "reason"]) ??
          "Refund audit event.",
        createdAt: getDateValue(refund),
        status: getFirstText(refund, ["status", "refundStatus"]),
        amount: getFirstNumber(refund, ["amount", "refundAmount"]),
        item: refund
      })
    );
  });

  pickupProofs.forEach((proof) => {
    const action = mapProofAction(proof);

    records.push(
      buildRecord({
        source: "PICKUP_PROOF",
        action,
        entityId: toText(proof.id),
        entityType: "Pickup Proof",
        actorName:
          getFirstText(proof, ["agentName", "createdBy"]) ?? "Pickup Agent",
        actorRole: "PICKUP_AGENT",
        summary: `Pickup proof ${toText(proof.id)} ${action
          .toLowerCase()
          .replace(/_/g, " ")}.`,
        details:
          getFirstText(proof, ["notes", "remark"]) ??
          "Pickup proof audit event.",
        createdAt: getDateValue(proof),
        status: getFirstText(proof, ["verificationStatus", "status"]),
        item: proof
      })
    );
  });

  deliveryProofs.forEach((proof) => {
    const action = mapProofAction(proof);

    records.push(
      buildRecord({
        source: "DELIVERY_PROOF",
        action,
        entityId: toText(proof.id),
        entityType: "Delivery Proof",
        actorName:
          getFirstText(proof, ["agentName", "createdBy"]) ?? "Delivery Agent",
        actorRole: "DELIVERY_AGENT",
        summary: `Delivery proof ${toText(proof.id)} ${action
          .toLowerCase()
          .replace(/_/g, " ")}.`,
        details:
          getFirstText(proof, ["notes", "remark"]) ??
          "Delivery proof audit event.",
        createdAt: getDateValue(proof),
        status: getFirstText(proof, ["verificationStatus", "status"]),
        item: proof
      })
    );
  });

  sellerDisputes.forEach((dispute) => {
    const action = mapSellerDisputeAction(dispute);
    const disputeId = getFirstText(dispute, ["disputeId", "id"]) ?? "N/A";

    records.push(
      buildRecord({
        source: "SELLER_DISPUTE",
        action,
        entityId: toText(dispute.id),
        entityType: "Seller Dispute",
        actorName:
          getFirstText(dispute, ["updatedBy", "sellerName"]) ?? "Seller",
        actorRole: getOptionalText(dispute, "updatedByRole") ?? "SELLER",
        summary: `Seller dispute ${disputeId} ${action
          .toLowerCase()
          .replace(/_/g, " ")}.`,
        details:
          getFirstText(dispute, ["reason", "decisionNote"]) ??
          "Seller dispute audit event.",
        createdAt: getDateValue(dispute),
        status: getFirstText(dispute, ["status", "decision"]),
        amount: getFirstNumber(dispute, ["refundAmount", "liabilityAmount"]),
        item: dispute
      })
    );
  });

  damagedInventory.forEach((item) => {
    const productLabel =
      getFirstText(item, ["productName", "productId", "id"]) ?? "N/A";

    records.push(
      buildRecord({
        source: "DAMAGED_INVENTORY",
        action: "DAMAGED_ITEM_RECORDED",
        entityId: toText(item.id),
        entityType: "Damaged Inventory",
        actorName: getOptionalText(item, "createdBy") ?? "Warehouse",
        actorRole: "WAREHOUSE",
        summary: `Damaged inventory recorded for ${productLabel}.`,
        details:
          getFirstText(item, ["notes", "damageReason"]) ??
          "Damaged inventory audit event.",
        createdAt: getDateValue(item),
        status: getOptionalText(item, "status"),
        amount: getFirstNumber(item, [
          "estimatedLossAmount",
          "lossAmount",
          "refundAmount"
        ]),
        item
      })
    );
  });

  ruleAuditLogs.forEach((log) => {
    const action = mapAutomationRuleAction(log);
    const ruleLabel = getFirstText(log, ["ruleName", "ruleId"]) ?? "N/A";

    records.push(
      buildRecord({
        source: "AUTOMATION_RULE",
        action,
        entityId: toText(log.id),
        entityType: "Automation Rule",
        actorName: getOptionalText(log, "changedBy") ?? "Admin",
        actorRole: "ADMIN",
        summary:
          getOptionalText(log, "details") ??
          `Automation rule ${ruleLabel} changed.`,
        details:
          getOptionalText(log, "details") ??
          "Automation rule audit event.",
        createdAt: getOptionalText(log, "changedAt") ?? getDateValue(log),
        status: getOptionalText(log, "action"),
        item: log
      })
    );
  });

  return records.sort((first, second) => {
    const firstTime = new Date(first.createdAt).getTime() || 0;
    const secondTime = new Date(second.createdAt).getTime() || 0;
    return secondTime - firstTime;
  });
};

const buildSummary = (
  records: ReturnOperationsAuditRecord[]
): ReturnOperationsAuditSummary => {
  const countSource = (source: ReturnAuditSource): number =>
    records.filter((record) => record.source === source).length;

  const countSeverity = (severity: ReturnAuditSeverity): number =>
    records.filter((record) => record.severity === severity).length;

  const countCompliance = (
    complianceStatus: ReturnAuditComplianceStatus
  ): number =>
    records.filter((record) => record.complianceStatus === complianceStatus)
      .length;

  return {
    totalAuditRecords: records.length,

    returnRequestEvents: countSource("RETURN_REQUEST"),
    refundEvents: countSource("REFUND"),
    pickupProofEvents: countSource("PICKUP_PROOF"),
    deliveryProofEvents: countSource("DELIVERY_PROOF"),
    sellerDisputeEvents: countSource("SELLER_DISPUTE"),
    damagedInventoryEvents: countSource("DAMAGED_INVENTORY"),
    automationRuleEvents: countSource("AUTOMATION_RULE"),
    systemEvents: countSource("SYSTEM"),

    lowSeverityEvents: countSeverity("LOW"),
    mediumSeverityEvents: countSeverity("MEDIUM"),
    highSeverityEvents: countSeverity("HIGH"),
    criticalSeverityEvents: countSeverity("CRITICAL"),

    compliantEvents: countCompliance("COMPLIANT"),
    reviewRequiredEvents: countCompliance("REVIEW_REQUIRED"),
    nonCompliantEvents: countCompliance("NON_COMPLIANT"),

    exportableRecords: records.length,
    latestAuditAt: records[0]?.createdAt
  };
};

const escapeCsvValue = (value: unknown): string => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const convertRecordsToCsv = (
  records: ReturnOperationsAuditRecord[]
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
  const blob = new Blob([content], {
    type: mimeType
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const returnOperationsAuditService = {
  getDashboardData: async (): Promise<ReturnOperationsAuditDashboardData> => {
    const [
      returnRequests,
      refunds,
      pickupProofs,
      deliveryProofs,
      sellerDisputes,
      damagedInventory,
      ruleAuditLogs
    ] = await Promise.all([
      safeArray<UnknownRecord>(RETURN_REQUESTS_ENDPOINT),
      safeArray<UnknownRecord>(REFUNDS_ENDPOINT),
      safeArray<UnknownRecord>(PICKUP_PROOFS_ENDPOINT),
      safeArray<UnknownRecord>(DELIVERY_PROOFS_ENDPOINT),
      safeArray<UnknownRecord>(SELLER_RETURN_DISPUTES_ENDPOINT),
      safeArray<UnknownRecord>(DAMAGED_RETURN_INVENTORY_ENDPOINT),
      safeArray<UnknownRecord>(RETURN_AUTOMATION_RULE_AUDIT_LOGS_ENDPOINT)
    ]);

    const records = buildAuditRecords({
      returnRequests,
      refunds,
      pickupProofs,
      deliveryProofs,
      sellerDisputes,
      damagedInventory,
      ruleAuditLogs
    });

    return {
      summary: buildSummary(records),
      records
    };
  },

  exportCsv: async (
    records: ReturnOperationsAuditRecord[]
  ): Promise<void> => {
    const generatedAt = new Date().toISOString();

    try {
      await apiClient.post<ExportPayload, ExportPayload>(
        RETURN_OPERATIONS_AUDIT_EXPORTS_ENDPOINT,
        {
          id: createId("EXPORT"),
          exportId: createId("ROAE"),
          exportType: "CSV",
          recordCount: records.length,
          generatedBy: "Admin",
          generatedAt
        }
      );
    } catch {
      // Allow fallback export even if audit export endpoint fails
    }

    downloadFile({
      content: convertRecordsToCsv(records),
      fileName: `return-operations-audit-${generatedAt.slice(0, 10)}.csv`,
      mimeType: "text/csv;charset=utf-8;"
    });
  },

  exportJson: async (
    records: ReturnOperationsAuditRecord[]
  ): Promise<void> => {
    const generatedAt = new Date().toISOString();

    try {
      await apiClient.post<ExportPayload, ExportPayload>(
        RETURN_OPERATIONS_AUDIT_EXPORTS_ENDPOINT,
        {
          id: createId("EXPORT"),
          exportId: createId("ROAE"),
          exportType: "JSON",
          recordCount: records.length,
          generatedBy: "Admin",
          generatedAt
        }
      );
    } catch {
      // Allow fallback export even if audit export endpoint fails
    }

    downloadFile({
      content: JSON.stringify(records, null, 2),
      fileName: `return-operations-audit-${generatedAt.slice(0, 10)}.json`,
      mimeType: "application/json;charset=utf-8;"
    });
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