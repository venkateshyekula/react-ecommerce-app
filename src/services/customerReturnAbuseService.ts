import { apiClient } from "./apiClient";
import type {
  CustomerAbuseRiskLevel,
  CustomerReturnAbuseDashboardData,
  CustomerReturnAbuseReasonMetric,
  CustomerReturnAbuseRow,
  CustomerReturnAbuseSummary
} from "../types/customerReturnAbuse";

const RETURN_REQUESTS_ENDPOINT = "/returnRequests";
const PICKUP_PROOFS_ENDPOINT = "/pickupProofs";
const DELIVERY_PROOFS_ENDPOINT = "/deliveryProofs";

type ReturnRequestLike = {
  id: string;
  returnRequestId?: string;
  requestId?: string;

  orderId?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  status?: string;
  returnStatus?: string;

  reason?: string;
  returnReason?: string;
  customerComment?: string;
  comments?: string;

  refundAmount?: number;
  refundStatus?: string;

  pickupStatus?: string;
  pickupAttemptCount?: number;

  qcStatus?: string;
  qualityCheckStatus?: string;
  qcDecision?: string;
  qcResult?: string;
  itemConditionGrade?: string;
  qcCondition?: string;

  createdAt?: string;
  updatedAt?: string;
};

type ProofLike = {
  id: string;
  returnRequestId?: string;
  returnRequestDbId?: string;
  orderId?: string;
  agentId?: string;
  verificationStatus?: string;
};

type CustomerAccumulator = CustomerReturnAbuseRow & {
  reasonMap: Map<string, number>;
  reasonRefundMap: Map<string, number>;
};

const safeGetArray = async <T>(endpoint: string): Promise<T[]> => {
  try {
    const response = await apiClient.get<T[]>(endpoint);
    return Array.isArray(response) ? response : [];
  } catch {
    return [];
  }
};

const getSafeNumber = (value?: number | null): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const normalizeStatus = (value?: string | null): string => {
  return value?.trim().toUpperCase() ?? "";
};

const getSafeTime = (value?: string | null): number => {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
};

const getCustomerId = (request: ReturnRequestLike): string => {
  return (
    request.userId ??
    request.customerEmail ??
    request.userEmail ??
    request.customerPhone ??
    request.userPhone ??
    "UNKNOWN_CUSTOMER"
  );
};

const getCustomerName = (request: ReturnRequestLike): string => {
  return (
    request.customerName ??
    request.userName ??
    request.customerEmail ??
    request.userEmail ??
    "Unknown Customer"
  );
};

const getCustomerEmail = (request: ReturnRequestLike): string | undefined => {
  return request.customerEmail ?? request.userEmail;
};

const getCustomerPhone = (request: ReturnRequestLike): string | undefined => {
  return request.customerPhone ?? request.userPhone;
};

const getReturnReason = (request: ReturnRequestLike): string => {
  return (
    request.returnReason ??
    request.reason ??
    request.customerComment ??
    request.comments ??
    "Reason not specified"
  )
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const isCompletedReturn = (request: ReturnRequestLike): boolean => {
  const status = normalizeStatus(request.status ?? request.returnStatus);
  const refundStatus = normalizeStatus(request.refundStatus);

  return (
    ["REFUND_COMPLETED", "REFUNDED", "COMPLETED", "CLOSED"].includes(status) ||
    refundStatus === "COMPLETED"
  );
};

const isRejectedReturn = (request: ReturnRequestLike): boolean => {
  const status = normalizeStatus(request.status ?? request.returnStatus);

  return status === "REJECTED";
};

const isCancelledReturn = (request: ReturnRequestLike): boolean => {
  const status = normalizeStatus(request.status ?? request.returnStatus);

  return status === "CANCELLED";
};

const isQcFailed = (request: ReturnRequestLike): boolean => {
  const values = [
    request.qcStatus,
    request.qualityCheckStatus,
    request.qcDecision,
    request.qcResult,
    request.itemConditionGrade,
    request.qcCondition
  ]
    .filter(Boolean)
    .map((value) => normalizeStatus(String(value)));

  return values.some((value) =>
    [
      "FAILED",
      "QC_FAILED",
      "REJECTED",
      "DAMAGED",
      "DEFECTIVE",
      "MISSING_PARTS",
      "NON_RESELLABLE",
      "FRAUD_SUSPECTED"
    ].includes(value)
  );
};

const isPickupFailed = (request: ReturnRequestLike): boolean => {
  const pickupStatus = normalizeStatus(request.pickupStatus);

  return ["FAILED", "PICKUP_ATTEMPTED"].includes(pickupStatus);
};

const getRiskLevel = (score: number): CustomerAbuseRiskLevel => {
  if (score >= 85) return "CRITICAL";
  if (score >= 65) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
};

const buildRejectedProofMap = (proofs: ProofLike[]): Map<string, number> => {
  const map = new Map<string, number>();

  proofs.forEach((proof) => {
    if (normalizeStatus(proof.verificationStatus) !== "REJECTED") {
      return;
    }

    const key =
      proof.returnRequestDbId ?? proof.returnRequestId ?? proof.orderId;

    if (key) {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  });

  return map;
};

const getRejectedProofCountForRequest = ({
  request,
  rejectedProofMap
}: {
  request: ReturnRequestLike;
  rejectedProofMap: Map<string, number>;
}): number => {
  const key =
    request.id ??
    request.returnRequestId ??
    request.requestId ??
    request.orderId;

  return key ? rejectedProofMap.get(key) ?? 0 : 0;
};

const addSignal = ({
  condition,
  signal,
  signals
}: {
  condition: boolean;
  signal: string;
  signals: string[];
}): void => {
  if (condition) {
    signals.push(signal);
  }
};

const calculateRiskScore = ({
  totalReturns,
  totalRefundAmount,
  highValueReturnCount,
  failedPickupAttempts,
  qcFailedCount,
  rejectedProofCount,
  repeatedReasons,
  rejectedReturns,
  cancelledReturns
}: {
  totalReturns: number;
  totalRefundAmount: number;
  highValueReturnCount: number;
  failedPickupAttempts: number;
  qcFailedCount: number;
  rejectedProofCount: number;
  repeatedReasons: string[];
  rejectedReturns: number;
  cancelledReturns: number;
}): {
  riskScore: number;
  riskSignals: string[];
} => {
  const riskSignals: string[] = [];
  let score = 0;

  if (totalReturns >= 10) {
    score += 30;
  } else if (totalReturns >= 6) {
    score += 22;
  } else if (totalReturns >= 3) {
    score += 12;
  }

  addSignal({
    condition: totalReturns >= 3,
    signal: `Customer has ${totalReturns} return requests.`,
    signals: riskSignals
  });

  if (totalRefundAmount >= 100000) {
    score += 25;
  } else if (totalRefundAmount >= 50000) {
    score += 18;
  } else if (totalRefundAmount >= 15000) {
    score += 10;
  }

  addSignal({
    condition: totalRefundAmount >= 15000,
    signal: `High cumulative refund value: ₹${totalRefundAmount}.`,
    signals: riskSignals
  });

  if (highValueReturnCount >= 3) {
    score += 15;
  } else if (highValueReturnCount >= 1) {
    score += 8;
  }

  addSignal({
    condition: highValueReturnCount > 0,
    signal: `${highValueReturnCount} high-value return request(s).`,
    signals: riskSignals
  });

  if (failedPickupAttempts >= 5) {
    score += 18;
  } else if (failedPickupAttempts >= 2) {
    score += 10;
  }

  addSignal({
    condition: failedPickupAttempts >= 2,
    signal: `${failedPickupAttempts} failed or attempted pickup event(s).`,
    signals: riskSignals
  });

  if (qcFailedCount >= 3) {
    score += 20;
  } else if (qcFailedCount >= 1) {
    score += 10;
  }

  addSignal({
    condition: qcFailedCount > 0,
    signal: `${qcFailedCount} return(s) failed warehouse QC.`,
    signals: riskSignals
  });

  if (rejectedProofCount >= 2) {
    score += 14;
  } else if (rejectedProofCount === 1) {
    score += 8;
  }

  addSignal({
    condition: rejectedProofCount > 0,
    signal: `${rejectedProofCount} rejected pickup/delivery proof record(s).`,
    signals: riskSignals
  });

  if (repeatedReasons.length >= 3) {
    score += 13;
  } else if (repeatedReasons.length >= 1) {
    score += 8;
  }

  addSignal({
    condition: repeatedReasons.length > 0,
    signal: `Repeated return reason pattern: ${repeatedReasons.join(", ")}.`,
    signals: riskSignals
  });

  if (rejectedReturns + cancelledReturns >= 3) {
    score += 8;
  }

  addSignal({
    condition: rejectedReturns + cancelledReturns >= 3,
    signal: `${rejectedReturns + cancelledReturns} rejected/cancelled return(s).`,
    signals: riskSignals
  });

  return {
    riskScore: Math.min(Math.round(score), 100),
    riskSignals:
      riskSignals.length > 0 ? riskSignals : ["No major abuse signal detected."]
  };
};

const buildReasonMetrics = (
  requests: ReturnRequestLike[]
): CustomerReturnAbuseReasonMetric[] => {
  const reasonMap = new Map<string, CustomerReturnAbuseReasonMetric>();

  requests.forEach((request) => {
    const reason = getReturnReason(request);

    const existing = reasonMap.get(reason) ?? {
      reason,
      count: 0,
      refundAmount: 0
    };

    existing.count += 1;
    existing.refundAmount += getSafeNumber(request.refundAmount);

    reasonMap.set(reason, existing);
  });

  return Array.from(reasonMap.values()).sort(
    (first, second) => second.count - first.count
  );
};

const buildRows = ({
  requests,
  pickupProofs,
  deliveryProofs
}: {
  requests: ReturnRequestLike[];
  pickupProofs: ProofLike[];
  deliveryProofs: ProofLike[];
}): CustomerReturnAbuseRow[] => {
  const rejectedProofMap = buildRejectedProofMap([
    ...pickupProofs,
    ...deliveryProofs
  ]);

  const customerMap = new Map<string, CustomerAccumulator>();

  requests.forEach((request) => {
    const customerId = getCustomerId(request);
    const reason = getReturnReason(request);
    const refundAmount = getSafeNumber(request.refundAmount);
    const rejectedProofCount = getRejectedProofCountForRequest({
      request,
      rejectedProofMap
    });

    const existing =
      customerMap.get(customerId) ??
      ({
        customerId,
        customerName: getCustomerName(request),
        customerEmail: getCustomerEmail(request),
        customerPhone: getCustomerPhone(request),

        totalReturns: 0,
        activeReturns: 0,
        completedReturns: 0,
        rejectedReturns: 0,
        cancelledReturns: 0,

        totalRefundAmount: 0,
        averageRefundAmount: 0,
        highValueReturnCount: 0,

        failedPickupAttempts: 0,
        qcFailedCount: 0,
        rejectedProofCount: 0,

        repeatedReasons: [],
        topReturnReason: undefined,
        lastReturnAt: undefined,

        riskScore: 0,
        riskLevel: "LOW",
        riskSignals: [],

        reasonMap: new Map<string, number>(),
        reasonRefundMap: new Map<string, number>()
      } satisfies CustomerAccumulator);

    existing.totalReturns += 1;
    existing.totalRefundAmount += refundAmount;

    if (refundAmount >= 10000) {
      existing.highValueReturnCount += 1;
    }

    if (isCompletedReturn(request)) {
      existing.completedReturns += 1;
    } else if (isRejectedReturn(request)) {
      existing.rejectedReturns += 1;
    } else if (isCancelledReturn(request)) {
      existing.cancelledReturns += 1;
    } else {
      existing.activeReturns += 1;
    }

    if (isPickupFailed(request)) {
      existing.failedPickupAttempts += Math.max(
        request.pickupAttemptCount ?? 1,
        1
      );
    } else {
      existing.failedPickupAttempts += request.pickupAttemptCount ?? 0;
    }

    if (isQcFailed(request)) {
      existing.qcFailedCount += 1;
    }

    existing.rejectedProofCount += rejectedProofCount;

    existing.reasonMap.set(reason, (existing.reasonMap.get(reason) ?? 0) + 1);
    existing.reasonRefundMap.set(
      reason,
      (existing.reasonRefundMap.get(reason) ?? 0) + refundAmount
    );

    const requestUpdatedAt = request.updatedAt ?? request.createdAt;
    if (
      requestUpdatedAt &&
      (!existing.lastReturnAt ||
        getSafeTime(requestUpdatedAt) > getSafeTime(existing.lastReturnAt))
    ) {
      existing.lastReturnAt = requestUpdatedAt;
    }

    customerMap.set(customerId, existing);
  });

  return Array.from(customerMap.values())
    .map((row) => {
      const repeatedReasons = Array.from(row.reasonMap.entries())
        .filter(([, count]) => count > 1)
        .map(([reason]) => reason);

      const topReturnReason = Array.from(row.reasonMap.entries()).sort(
        (first, second) => second[1] - first[1]
      )[0]?.[0];

      const { riskScore, riskSignals } = calculateRiskScore({
        totalReturns: row.totalReturns,
        totalRefundAmount: row.totalRefundAmount,
        highValueReturnCount: row.highValueReturnCount,
        failedPickupAttempts: row.failedPickupAttempts,
        qcFailedCount: row.qcFailedCount,
        rejectedProofCount: row.rejectedProofCount,
        repeatedReasons,
        rejectedReturns: row.rejectedReturns,
        cancelledReturns: row.cancelledReturns
      });

      const safeRow = { ...row };
      delete (safeRow as Partial<CustomerAccumulator>).reasonMap;
      delete (safeRow as Partial<CustomerAccumulator>).reasonRefundMap;

      return {
        ...safeRow,
        averageRefundAmount:
          row.totalReturns > 0
            ? Math.round(row.totalRefundAmount / row.totalReturns)
            : 0,
        repeatedReasons,
        topReturnReason,
        riskScore,
        riskLevel: getRiskLevel(riskScore),
        riskSignals
      };
    })
    .sort((first, second) => second.riskScore - first.riskScore);
};

const buildSummary = (
  rows: CustomerReturnAbuseRow[]
): CustomerReturnAbuseSummary => {
  return {
    totalCustomers: rows.length,
    monitoredCustomers: rows.filter((row) => row.totalReturns > 0).length,

    totalReturns: rows.reduce((total, row) => total + row.totalReturns, 0),
    totalRefundAmount: rows.reduce(
      (total, row) => total + row.totalRefundAmount,
      0
    ),

    lowRiskCustomers: rows.filter((row) => row.riskLevel === "LOW").length,
    mediumRiskCustomers: rows.filter((row) => row.riskLevel === "MEDIUM").length,
    highRiskCustomers: rows.filter((row) => row.riskLevel === "HIGH").length,
    criticalRiskCustomers: rows.filter((row) => row.riskLevel === "CRITICAL")
      .length,

    customersWithRepeatedReasons: rows.filter(
      (row) => row.repeatedReasons.length > 0
    ).length,
    customersWithHighRefundValue: rows.filter(
      (row) => row.totalRefundAmount >= 15000
    ).length,
    customersWithFailedPickupPattern: rows.filter(
      (row) => row.failedPickupAttempts >= 2
    ).length,
    customersWithRejectedProofs: rows.filter((row) => row.rejectedProofCount > 0)
      .length,
    customersWithQcFailures: rows.filter((row) => row.qcFailedCount > 0).length
  };
};

export const customerReturnAbuseService = {
  getDashboardData: async (): Promise<CustomerReturnAbuseDashboardData> => {
    const [requests, pickupProofs, deliveryProofs] = await Promise.all([
      safeGetArray<ReturnRequestLike>(RETURN_REQUESTS_ENDPOINT),
      safeGetArray<ProofLike>(PICKUP_PROOFS_ENDPOINT),
      safeGetArray<ProofLike>(DELIVERY_PROOFS_ENDPOINT)
    ]);

    const rows = buildRows({
      requests,
      pickupProofs,
      deliveryProofs
    });

    return {
      summary: buildSummary(rows),
      rows,
      reasonMetrics: buildReasonMetrics(requests)
    };
  },

  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
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