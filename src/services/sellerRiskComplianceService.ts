import { apiClient } from "./apiClient";
import type { ReturnRequest } from "../types/returnRequest";
import type {
  SellerComplianceRiskLevel,
  SellerComplianceStatus,
  SellerReturnReasonMetric,
  SellerRiskComplianceDashboardData,
  SellerRiskComplianceRow,
  SellerRiskComplianceSummary
} from "../types/sellerRiskCompliance";

const RETURN_REQUESTS_ENDPOINT = "/returnRequests";
const SELLER_RETURN_DISPUTES_ENDPOINT = "/sellerReturnDisputes";
const DAMAGED_RETURN_INVENTORY_ENDPOINT = "/damagedReturnInventory";
const REFUNDS_ENDPOINT = "/refunds";

type SellerReturnDisputeLike = {
  id: string;
  disputeId?: string;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  status?: string;
  decision?: string;
  returnRequestId?: string;
  returnRequestDbId?: string;
  refundAmount?: number;
  liabilityAmount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type DamagedInventoryLike = {
  id: string;
  productId?: string;
  productName?: string;
  sellerId?: string;
  sellerName?: string;
  estimatedLossAmount?: number;
  lossAmount?: number;
  refundAmount?: number;
  createdAt?: string;
};

type RefundLike = {
  id: string;
  refundId?: string;
  sellerId?: string;
  sellerName?: string;
  orderId?: string;
  returnRequestId?: string;
  amount?: number;
  refundAmount?: number;
  status?: string;
  createdAt?: string;
};

type ReturnItemLike = {
  productId?: string;
  name?: string;
  brand?: string;
  category?: string;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  price?: number;
  subtotal?: number;
  quantity?: number;
};

type ReturnRequestWithOptionalSeller = ReturnRequest & {
  items?: ReturnItemLike[];
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  productId?: string;
  productName?: string;
};

type SellerAccumulator = SellerRiskComplianceRow & {
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

const getNumber = (value?: number | null): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const normalizeText = (value?: string | null): string => {
  return value?.trim() ?? "";
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

const getRefundAmount = (request: ReturnRequest): number => {
  return getNumber(request.refundAmount);
};

const normalizeReason = (request: ReturnRequest): string => {
  return (
    request.returnReason ??
    request.reason ??
    request.customerComment ??
    request.comments ??
    "Unknown"
  )
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const isCompletedReturn = (request: ReturnRequest): boolean => {
  const status = normalizeStatus(request.status);
  const refundStatus = normalizeStatus(request.refundStatus);

  return (
    ["REFUND_COMPLETED", "REFUNDED", "COMPLETED", "CLOSED"].includes(status) ||
    refundStatus === "COMPLETED"
  );
};

const isRejectedReturn = (request: ReturnRequest): boolean => {
  return normalizeStatus(request.status) === "REJECTED";
};

const isCancelledReturn = (request: ReturnRequest): boolean => {
  return normalizeStatus(request.status) === "CANCELLED";
};

const isQcFailed = (request: ReturnRequest): boolean => {
  const requestWithQc = request as ReturnRequest & {
    qcStatus?: string;
    qcDecision?: string;
    qcResult?: string;
    itemConditionGrade?: string;
    qcCondition?: string;
  };

  const statuses = [
    request.qualityCheckStatus,
    requestWithQc.qcStatus,
    requestWithQc.qcDecision,
    requestWithQc.qcResult,
    requestWithQc.itemConditionGrade,
    requestWithQc.qcCondition
  ].map(normalizeStatus);

  return statuses.some((status) =>
    [
      "FAILED",
      "QC_FAILED",
      "REJECTED",
      "DAMAGED",
      "DEFECTIVE",
      "MISSING_PARTS",
      "NON_RESELLABLE",
      "FRAUD_SUSPECTED"
    ].includes(status)
  );
};

const isQcPassed = (request: ReturnRequest): boolean => {
  const requestWithQc = request as ReturnRequest & {
    qcStatus?: string;
    qcDecision?: string;
    qcResult?: string;
    itemConditionGrade?: string;
    qcCondition?: string;
  };

  const statuses = [
    request.qualityCheckStatus,
    requestWithQc.qcStatus,
    requestWithQc.qcDecision,
    requestWithQc.qcResult,
    requestWithQc.itemConditionGrade,
    requestWithQc.qcCondition
  ].map(normalizeStatus);

  return statuses.some((status) =>
    ["PASSED", "APPROVED", "QC_PASSED", "RESELLABLE", "GRADE_A"].includes(
      status
    )
  );
};

const isQcPending = (request: ReturnRequest): boolean => {
  const status = normalizeStatus(request.qualityCheckStatus);

  return ["", "PENDING", "NOT_STARTED", "QUALITY_CHECK_PENDING"].includes(
    status
  );
};

const getItems = (request: ReturnRequest): ReturnItemLike[] => {
  const requestWithItems = request as ReturnRequestWithOptionalSeller;

  if (
    Array.isArray(requestWithItems.items) &&
    requestWithItems.items.length > 0
  ) {
    return requestWithItems.items;
  }

  if (requestWithItems.sellerId || requestWithItems.productId) {
    return [
      {
        productId: requestWithItems.productId,
        name: requestWithItems.productName,
        sellerId: requestWithItems.sellerId,
        sellerName: requestWithItems.sellerName,
        sellerEmail: requestWithItems.sellerEmail,
        sellerPhone: requestWithItems.sellerPhone
      }
    ];
  }

  return [];
};

const getItemRefundAmount = ({
  item,
  request,
  itemCount
}: {
  item: ReturnItemLike;
  request: ReturnRequest;
  itemCount: number;
}): number => {
  const subtotal = getNumber(item.subtotal);

  if (subtotal > 0) {
    return subtotal;
  }

  const price = getNumber(item.price);
  const quantity = getNumber(item.quantity);

  if (price > 0 && quantity > 0) {
    return price * quantity;
  }

  const refundAmount = getRefundAmount(request);

  if (refundAmount > 0 && itemCount > 0) {
    return refundAmount / itemCount;
  }

  return 0;
};

const getRiskLevel = (score: number): SellerComplianceRiskLevel => {
  if (score >= 85) {
    return "CRITICAL";
  }

  if (score >= 65) {
    return "HIGH";
  }

  if (score >= 40) {
    return "MEDIUM";
  }

  return "LOW";
};

const getComplianceStatus = ({
  riskScore,
  disputesApproved,
  qcFailedCount,
  damagedInventoryValue
}: {
  riskScore: number;
  disputesApproved: number;
  qcFailedCount: number;
  damagedInventoryValue: number;
}): SellerComplianceStatus => {
  if (riskScore >= 85 || disputesApproved >= 5 || damagedInventoryValue >= 50000) {
    return "RESTRICTED";
  }

  if (riskScore >= 65 || qcFailedCount >= 5 || disputesApproved >= 3) {
    return "HIGH_RISK";
  }

  if (riskScore >= 40 || qcFailedCount >= 2 || disputesApproved >= 1) {
    return "WATCHLIST";
  }

  return "COMPLIANT";
};

const getRiskScore = ({
  totalReturns,
  totalRefundAmount,
  qcFailedCount,
  damagedInventoryValue,
  disputesApproved,
  disputesRaised,
  repeatedReturnReasons
}: {
  totalReturns: number;
  totalRefundAmount: number;
  qcFailedCount: number;
  damagedInventoryValue: number;
  disputesApproved: number;
  disputesRaised: number;
  repeatedReturnReasons: string[];
}): number => {
  const returnScore = Math.min(totalReturns * 5, 25);
  const refundScore = Math.min(totalRefundAmount / 20000, 20);
  const qcScore = Math.min(qcFailedCount * 8, 25);
  const damageScore = Math.min(damagedInventoryValue / 10000, 15);
  const disputeScore = Math.min(disputesApproved * 8 + disputesRaised * 2, 20);
  const repeatedReasonScore = Math.min(repeatedReturnReasons.length * 4, 10);

  return Math.min(
    Math.round(
      returnScore +
        refundScore +
        qcScore +
        damageScore +
        disputeScore +
        repeatedReasonScore
    ),
    100
  );
};

const getComplianceScore = (riskScore: number): number => {
  return Math.max(100 - riskScore, 0);
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

const createInitialSeller = (
  sellerId: string,
  overrides: Partial<SellerAccumulator> = {}
): SellerAccumulator => {
  return {
    sellerId,
    sellerName: overrides.sellerName ?? "Unknown Seller",
    sellerEmail: overrides.sellerEmail,
    sellerPhone: overrides.sellerPhone,

    totalReturns: 0,
    activeReturns: 0,
    completedReturns: 0,
    rejectedReturns: 0,
    cancelledReturns: 0,

    totalRefundAmount: 0,
    averageRefundAmount: 0,
    refundLiabilityAmount: 0,

    qcFailedCount: 0,
    qcPassedCount: 0,
    qcPendingCount: 0,

    damagedInventoryCount: 0,
    damagedInventoryValue: 0,

    disputesRaised: 0,
    disputesApproved: 0,
    disputesRejected: 0,
    disputesPending: 0,

    disputeApprovalRate: 0,
    qcFailureRate: 0,
    returnCompletionRate: 0,

    topReturnReason: undefined,
    repeatedReturnReasons: [],

    riskScore: 0,
    complianceScore: 100,
    riskLevel: "LOW",
    complianceStatus: "COMPLIANT",

    riskSignals: [],
    lastReturnAt: undefined,

    reasonMap: new Map<string, number>(),
    reasonRefundMap: new Map<string, number>()
  };
};

const buildReasonMetrics = (
  requests: ReturnRequest[]
): SellerReturnReasonMetric[] => {
  const reasonMap = new Map<string, SellerReturnReasonMetric>();

  requests.forEach((request) => {
    const reason = normalizeReason(request);
    const current = reasonMap.get(reason) ?? {
      reason,
      count: 0,
      refundAmount: 0
    };

    current.count += 1;
    current.refundAmount += getRefundAmount(request);

    reasonMap.set(reason, current);
  });

  return Array.from(reasonMap.values()).sort(
    (first, second) => second.count - first.count
  );
};

const buildSellerRows = ({
  requests,
  disputes,
  damagedInventory,
  refunds
}: {
  requests: ReturnRequest[];
  disputes: SellerReturnDisputeLike[];
  damagedInventory: DamagedInventoryLike[];
  refunds: RefundLike[];
}): SellerRiskComplianceRow[] => {
  const sellerMap = new Map<string, SellerAccumulator>();

  requests.forEach((request) => {
    const items = getItems(request);
    const reason = normalizeReason(request);

    items.forEach((item) => {
      const sellerId = normalizeText(item.sellerId);

      if (!sellerId) {
        return;
      }

      const existing =
        sellerMap.get(sellerId) ??
        createInitialSeller(sellerId, {
          sellerName: item.sellerName,
          sellerEmail: item.sellerEmail,
          sellerPhone: item.sellerPhone
        });

      const itemRefundAmount = getItemRefundAmount({
        item,
        request,
        itemCount: items.length
      });

      existing.totalReturns += 1;
      existing.totalRefundAmount += itemRefundAmount;
      existing.refundLiabilityAmount += itemRefundAmount;

      if (isCompletedReturn(request)) {
        existing.completedReturns += 1;
      } else if (isRejectedReturn(request)) {
        existing.rejectedReturns += 1;
      } else if (isCancelledReturn(request)) {
        existing.cancelledReturns += 1;
      } else {
        existing.activeReturns += 1;
      }

      if (isQcFailed(request)) {
        existing.qcFailedCount += 1;
      }

      if (isQcPassed(request)) {
        existing.qcPassedCount += 1;
      }

      if (isQcPending(request)) {
        existing.qcPendingCount += 1;
      }

      existing.reasonMap.set(
        reason,
        (existing.reasonMap.get(reason) ?? 0) + 1
      );
      existing.reasonRefundMap.set(
        reason,
        (existing.reasonRefundMap.get(reason) ?? 0) + itemRefundAmount
      );

      const updatedAt = request.updatedAt ?? request.createdAt;
      if (
        updatedAt &&
        (!existing.lastReturnAt ||
          getSafeTime(updatedAt) > getSafeTime(existing.lastReturnAt))
      ) {
        existing.lastReturnAt = updatedAt;
      }

      sellerMap.set(sellerId, existing);
    });
  });

  disputes.forEach((dispute) => {
    const sellerId = normalizeText(dispute.sellerId);

    if (!sellerId) {
      return;
    }

    const existing =
      sellerMap.get(sellerId) ??
      createInitialSeller(sellerId, {
        sellerName: dispute.sellerName,
        sellerEmail: dispute.sellerEmail,
        sellerPhone: dispute.sellerPhone
      });

    existing.disputesRaised += 1;

    const disputeStatus = normalizeStatus(dispute.status ?? dispute.decision);

    if (["APPROVED", "SELLER_LIABLE", "ADMIN_APPROVED"].includes(disputeStatus)) {
      existing.disputesApproved += 1;
      existing.refundLiabilityAmount +=
        dispute.liabilityAmount ?? dispute.refundAmount ?? 0;
    } else if (
      ["REJECTED", "DENIED", "ADMIN_REJECTED"].includes(disputeStatus)
    ) {
      existing.disputesRejected += 1;
    } else {
      existing.disputesPending += 1;
    }

    sellerMap.set(sellerId, existing);
  });

  damagedInventory.forEach((item) => {
    const sellerId = normalizeText(item.sellerId);

    if (!sellerId) {
      return;
    }

    const existing =
      sellerMap.get(sellerId) ??
      createInitialSeller(sellerId, {
        sellerName: item.sellerName
      });

    const damagedValue =
      item.estimatedLossAmount ?? item.lossAmount ?? item.refundAmount ?? 0;

    existing.damagedInventoryCount += 1;
    existing.damagedInventoryValue += damagedValue;
    existing.refundLiabilityAmount += damagedValue;

    sellerMap.set(sellerId, existing);
  });

  refunds.forEach((refund) => {
    const sellerId = normalizeText(refund.sellerId);

    if (!sellerId) {
      return;
    }

    const existing = sellerMap.get(sellerId);

    if (!existing) {
      return;
    }

    existing.refundLiabilityAmount += refund.refundAmount ?? refund.amount ?? 0;

    sellerMap.set(sellerId, existing);
  });

  return Array.from(sellerMap.values())
    .map((row) => {
      const repeatedReturnReasons = Array.from(row.reasonMap.entries())
        .filter(([, count]) => count > 1)
        .map(([reason]) => reason);

      const topReturnReason = Array.from(row.reasonMap.entries()).sort(
        (first, second) => second[1] - first[1]
      )[0]?.[0];

      const disputeApprovalRate =
        row.disputesRaised > 0
          ? Math.round((row.disputesApproved / row.disputesRaised) * 100)
          : 0;

      const qcFailureRate =
        row.totalReturns > 0
          ? Math.round((row.qcFailedCount / row.totalReturns) * 100)
          : 0;

      const returnCompletionRate =
        row.totalReturns > 0
          ? Math.round((row.completedReturns / row.totalReturns) * 100)
          : 0;

      const averageRefundAmount =
        row.totalReturns > 0
          ? Math.round(row.totalRefundAmount / row.totalReturns)
          : 0;

      const riskScore = getRiskScore({
        totalReturns: row.totalReturns,
        totalRefundAmount: row.totalRefundAmount,
        qcFailedCount: row.qcFailedCount,
        damagedInventoryValue: row.damagedInventoryValue,
        disputesApproved: row.disputesApproved,
        disputesRaised: row.disputesRaised,
        repeatedReturnReasons
      });

      const riskSignals: string[] = [];

      addSignal({
        condition: row.totalReturns >= 5,
        signal: `High return volume: ${row.totalReturns} return-linked case(s).`,
        signals: riskSignals
      });

      addSignal({
        condition: row.totalRefundAmount >= 50000,
        signal: `High refund exposure: ₹${row.totalRefundAmount}.`,
        signals: riskSignals
      });

      addSignal({
        condition: row.qcFailedCount >= 2,
        signal: `${row.qcFailedCount} return(s) failed QC.`,
        signals: riskSignals
      });

      addSignal({
        condition: row.disputesApproved > 0,
        signal: `${row.disputesApproved} approved seller-liability dispute(s).`,
        signals: riskSignals
      });

      addSignal({
        condition: row.damagedInventoryValue > 0,
        signal: `Damaged inventory value: ₹${row.damagedInventoryValue}.`,
        signals: riskSignals
      });

      addSignal({
        condition: repeatedReturnReasons.length > 0,
        signal: `Repeated return reason(s): ${repeatedReturnReasons.join(", ")}.`,
        signals: riskSignals
      });

      const complianceScore = getComplianceScore(riskScore);

      const safeRow = { ...row };
      delete (safeRow as Partial<SellerAccumulator>).reasonMap;
      delete (safeRow as Partial<SellerAccumulator>).reasonRefundMap;

      return {
        ...safeRow,
        averageRefundAmount,
        disputeApprovalRate,
        qcFailureRate,
        returnCompletionRate,
        topReturnReason,
        repeatedReturnReasons,
        riskScore,
        complianceScore,
        riskLevel: getRiskLevel(riskScore),
        complianceStatus: getComplianceStatus({
          riskScore,
          disputesApproved: row.disputesApproved,
          qcFailedCount: row.qcFailedCount,
          damagedInventoryValue: row.damagedInventoryValue
        }),
        riskSignals:
          riskSignals.length > 0
            ? riskSignals
            : ["No major seller compliance issue detected."]
      };
    })
    .sort((first, second) => second.riskScore - first.riskScore);
};

const buildSummary = (
  rows: SellerRiskComplianceRow[]
): SellerRiskComplianceSummary => {
  return {
    totalSellers: rows.length,
    monitoredSellers: rows.filter((row) => row.totalReturns > 0).length,

    totalReturns: rows.reduce((total, row) => total + row.totalReturns, 0),
    totalRefundLiability: rows.reduce(
      (total, row) => total + row.refundLiabilityAmount,
      0
    ),
    totalDamagedInventoryValue: rows.reduce(
      (total, row) => total + row.damagedInventoryValue,
      0
    ),

    totalDisputes: rows.reduce((total, row) => total + row.disputesRaised, 0),
    approvedDisputes: rows.reduce(
      (total, row) => total + row.disputesApproved,
      0
    ),
    rejectedDisputes: rows.reduce(
      (total, row) => total + row.disputesRejected,
      0
    ),

    qcFailedCount: rows.reduce((total, row) => total + row.qcFailedCount, 0),
    qcPassedCount: rows.reduce((total, row) => total + row.qcPassedCount, 0),

    lowRiskSellers: rows.filter((row) => row.riskLevel === "LOW").length,
    mediumRiskSellers: rows.filter((row) => row.riskLevel === "MEDIUM").length,
    highRiskSellers: rows.filter((row) => row.riskLevel === "HIGH").length,
    criticalRiskSellers: rows.filter((row) => row.riskLevel === "CRITICAL")
      .length,

    watchlistSellers: rows.filter((row) => row.complianceStatus === "WATCHLIST")
      .length,
    restrictedSellers: rows.filter(
      (row) => row.complianceStatus === "RESTRICTED"
    ).length
  };
};

export const sellerRiskComplianceService = {
  getDashboardData: async (): Promise<SellerRiskComplianceDashboardData> => {
    const [requests, disputes, damagedInventory, refunds] = await Promise.all([
      safeGetArray<ReturnRequest>(RETURN_REQUESTS_ENDPOINT),
      safeGetArray<SellerReturnDisputeLike>(SELLER_RETURN_DISPUTES_ENDPOINT),
      safeGetArray<DamagedInventoryLike>(DAMAGED_RETURN_INVENTORY_ENDPOINT),
      safeGetArray<RefundLike>(REFUNDS_ENDPOINT)
    ]);

    const rows = buildSellerRows({
      requests,
      disputes,
      damagedInventory,
      refunds
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