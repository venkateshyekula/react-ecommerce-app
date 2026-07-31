import { apiClient } from "./apiClient";
import type { ReturnRequest } from "../types/returnRequest";
import type {
  ProductQualityRiskLevel,
  ProductReturnQualityDashboardData,
  ProductReturnQualityRow,
  ProductReturnQualitySummary,
  ProductReturnReasonMetric
} from "../types/productReturnQuality";

const RETURN_REQUESTS_ENDPOINT = "/returnRequests";
const DAMAGED_RETURN_INVENTORY_ENDPOINT = "/damagedReturnInventory";

type ReturnItemLike = {
  productId?: string;
  name?: string;
  productName?: string;
  brand?: string;
  category?: string;
  sellerId?: string;
  sellerName?: string;
  price?: number;
  subtotal?: number;
  quantity?: number;
};

type ReturnRequestWithProductFallback = ReturnRequest & {
  items?: ReturnItemLike[];

  productId?: string;
  productName?: string;
  brand?: string;
  category?: string;

  sellerId?: string;
  sellerName?: string;

  qcStatus?: string;
  qcDecision?: string;
  qcResult?: string;
  itemConditionGrade?: string;
  qcCondition?: string;
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

type ProductAccumulator = ProductReturnQualityRow & {
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

const getReturnReason = (request: ReturnRequest): string => {
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

const isCompletedReturn = (request: ReturnRequest): boolean => {
  const status = normalizeStatus(request.status);
  const refundStatus = normalizeStatus(request.refundStatus);

  return (
    status === "REFUND_COMPLETED" ||
    status === "REFUNDED" ||
    status === "COMPLETED" ||
    status === "CLOSED" ||
    refundStatus === "COMPLETED"
  );
};

const isRejectedReturn = (request: ReturnRequest): boolean => {
  const status = normalizeStatus(request.status);

  return status === "REJECTED";
};

const isCancelledReturn = (request: ReturnRequest): boolean => {
  const status = normalizeStatus(request.status);

  return status === "CANCELLED";
};

const getQcStatusValues = (request: ReturnRequest): string[] => {
  const requestWithFallback = request as ReturnRequestWithProductFallback;

  return [
    request.qualityCheckStatus,
    requestWithFallback.qcStatus,
    requestWithFallback.qcDecision,
    requestWithFallback.qcResult,
    requestWithFallback.itemConditionGrade,
    requestWithFallback.qcCondition
  ].map(normalizeStatus);
};

const isQcFailed = (request: ReturnRequest): boolean => {
  return getQcStatusValues(request).some((status) =>
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
  return getQcStatusValues(request).some((status) =>
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
  const requestWithItems = request as ReturnRequestWithProductFallback;

  if (
    Array.isArray(requestWithItems.items) &&
    requestWithItems.items.length > 0
  ) {
    return requestWithItems.items;
  }

  if (requestWithItems.productId || requestWithItems.productName) {
    return [
      {
        productId: requestWithItems.productId,
        name: requestWithItems.productName,
        productName: requestWithItems.productName,
        brand: requestWithItems.brand,
        category: requestWithItems.category,
        sellerId: requestWithItems.sellerId,
        sellerName: requestWithItems.sellerName
      }
    ];
  }

  return [];
};

const getItemProductName = (item: ReturnItemLike): string => {
  return item.productName ?? item.name ?? "Unknown Product";
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

const getRiskLevel = (score: number): ProductQualityRiskLevel => {
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
  qcFailedCount,
  damagedInventoryCount,
  damagedInventoryValue,
  repeatedReasons,
  rejectedReturns,
  cancelledReturns
}: {
  totalReturns: number;
  totalRefundAmount: number;
  highValueReturnCount: number;
  qcFailedCount: number;
  damagedInventoryCount: number;
  damagedInventoryValue: number;
  repeatedReasons: string[];
  rejectedReturns: number;
  cancelledReturns: number;
}): {
  riskScore: number;
  qualitySignals: string[];
} => {
  const qualitySignals: string[] = [];
  let score = 0;

  if (totalReturns >= 15) {
    score += 30;
  } else if (totalReturns >= 8) {
    score += 22;
  } else if (totalReturns >= 4) {
    score += 12;
  }

  addSignal({
    condition: totalReturns >= 4,
    signal: `Product has ${totalReturns} return cases.`,
    signals: qualitySignals
  });

  if (totalRefundAmount >= 150000) {
    score += 22;
  } else if (totalRefundAmount >= 75000) {
    score += 16;
  } else if (totalRefundAmount >= 25000) {
    score += 8;
  }

  addSignal({
    condition: totalRefundAmount >= 25000,
    signal: `High refund exposure: ₹${Math.round(totalRefundAmount)}.`,
    signals: qualitySignals
  });

  if (highValueReturnCount >= 5) {
    score += 14;
  } else if (highValueReturnCount >= 2) {
    score += 8;
  }

  addSignal({
    condition: highValueReturnCount > 0,
    signal: `${highValueReturnCount} high-value return case(s).`,
    signals: qualitySignals
  });

  if (qcFailedCount >= 6) {
    score += 25;
  } else if (qcFailedCount >= 3) {
    score += 16;
  } else if (qcFailedCount >= 1) {
    score += 8;
  }

  addSignal({
    condition: qcFailedCount > 0,
    signal: `${qcFailedCount} QC failure(s) linked to this product.`,
    signals: qualitySignals
  });

  if (damagedInventoryCount >= 5) {
    score += 18;
  } else if (damagedInventoryCount >= 2) {
    score += 10;
  } else if (damagedInventoryCount === 1) {
    score += 6;
  }

  addSignal({
    condition: damagedInventoryCount > 0,
    signal: `${damagedInventoryCount} damaged inventory record(s).`,
    signals: qualitySignals
  });

  if (damagedInventoryValue >= 50000) {
    score += 12;
  } else if (damagedInventoryValue >= 15000) {
    score += 7;
  }

  addSignal({
    condition: damagedInventoryValue >= 15000,
    signal: `Damaged inventory value: ₹${Math.round(damagedInventoryValue)}.`,
    signals: qualitySignals
  });

  if (repeatedReasons.length >= 3) {
    score += 10;
  } else if (repeatedReasons.length >= 1) {
    score += 6;
  }

  addSignal({
    condition: repeatedReasons.length > 0,
    signal: `Repeated quality complaint pattern: ${repeatedReasons.join(", ")}.`,
    signals: qualitySignals
  });

  if (rejectedReturns + cancelledReturns >= 3) {
    score += 6;
  }

  addSignal({
    condition: rejectedReturns + cancelledReturns >= 3,
    signal: `${rejectedReturns + cancelledReturns} rejected/cancelled return(s).`,
    signals: qualitySignals
  });

  return {
    riskScore: Math.min(Math.round(score), 100),
    qualitySignals:
      qualitySignals.length > 0
        ? qualitySignals
        : ["No major product quality signal detected."]
  };
};

const buildReasonMetrics = (
  requests: ReturnRequest[]
): ProductReturnReasonMetric[] => {
  const reasonMap = new Map<string, ProductReturnReasonMetric>();

  requests.forEach((request) => {
    const reason = getReturnReason(request);
    const existing = reasonMap.get(reason) ?? {
      reason,
      count: 0,
      refundAmount: 0
    };

    existing.count += 1;
    existing.refundAmount += getRefundAmount(request);

    reasonMap.set(reason, existing);
  });

  return Array.from(reasonMap.values()).sort(
    (first, second) => second.count - first.count
  );
};

const buildRows = ({
  requests,
  damagedInventory
}: {
  requests: ReturnRequest[];
  damagedInventory: DamagedInventoryLike[];
}): ProductReturnQualityRow[] => {
  const productMap = new Map<string, ProductAccumulator>();

  requests.forEach((request) => {
    const reason = getReturnReason(request);
    const items = getItems(request);

    items.forEach((item) => {
      const productId = normalizeText(item.productId);

      if (!productId) {
        return;
      }

      const itemRefundAmount = getItemRefundAmount({
        item,
        request,
        itemCount: items.length
      });

      const existing =
        productMap.get(productId) ??
        ({
          productId,
          productName: getItemProductName(item),
          brand: item.brand,
          category: item.category,

          sellerId: item.sellerId,
          sellerName: item.sellerName,

          totalReturns: 0,
          activeReturns: 0,
          completedReturns: 0,
          rejectedReturns: 0,
          cancelledReturns: 0,

          totalRefundAmount: 0,
          averageRefundAmount: 0,
          highValueReturnCount: 0,

          qcPassedCount: 0,
          qcFailedCount: 0,
          qcPendingCount: 0,

          damagedInventoryCount: 0,
          damagedInventoryValue: 0,

          repeatedReasons: [],
          topReturnReason: undefined,
          lastReturnAt: undefined,

          riskScore: 0,
          riskLevel: "LOW",
          qualitySignals: [],

          reasonMap: new Map<string, number>(),
          reasonRefundMap: new Map<string, number>()
        } satisfies ProductAccumulator);

      existing.totalReturns += 1;
      existing.totalRefundAmount += itemRefundAmount;

      if (itemRefundAmount >= 10000) {
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

      if (isQcPassed(request)) {
        existing.qcPassedCount += 1;
      }

      if (isQcFailed(request)) {
        existing.qcFailedCount += 1;
      }

      if (isQcPending(request)) {
        existing.qcPendingCount += 1;
      }

      existing.reasonMap.set(reason, (existing.reasonMap.get(reason) ?? 0) + 1);
      existing.reasonRefundMap.set(
        reason,
        (existing.reasonRefundMap.get(reason) ?? 0) + itemRefundAmount
      );

      const lastActivityAt = request.updatedAt ?? request.createdAt;
      if (
        lastActivityAt &&
        (!existing.lastReturnAt ||
          getSafeTime(lastActivityAt) > getSafeTime(existing.lastReturnAt))
      ) {
        existing.lastReturnAt = lastActivityAt;
      }

      productMap.set(productId, existing);
    });
  });

  damagedInventory.forEach((item) => {
    const productId = normalizeText(item.productId);

    if (!productId) {
      return;
    }

    const existing =
      productMap.get(productId) ??
      ({
        productId,
        productName: item.productName ?? "Unknown Product",
        sellerId: item.sellerId,
        sellerName: item.sellerName,

        totalReturns: 0,
        activeReturns: 0,
        completedReturns: 0,
        rejectedReturns: 0,
        cancelledReturns: 0,

        totalRefundAmount: 0,
        averageRefundAmount: 0,
        highValueReturnCount: 0,

        qcPassedCount: 0,
        qcFailedCount: 0,
        qcPendingCount: 0,

        damagedInventoryCount: 0,
        damagedInventoryValue: 0,

        repeatedReasons: [],
        topReturnReason: undefined,
        lastReturnAt: undefined,

        riskScore: 0,
        riskLevel: "LOW",
        qualitySignals: [],

        reasonMap: new Map<string, number>(),
        reasonRefundMap: new Map<string, number>()
      } satisfies ProductAccumulator);

    existing.damagedInventoryCount += 1;
    existing.damagedInventoryValue +=
      item.estimatedLossAmount ?? item.lossAmount ?? item.refundAmount ?? 0;

    if (
      item.createdAt &&
      (!existing.lastReturnAt ||
        getSafeTime(item.createdAt) > getSafeTime(existing.lastReturnAt))
    ) {
      existing.lastReturnAt = item.createdAt;
    }

    productMap.set(productId, existing);
  });

  return Array.from(productMap.values())
    .map((row) => {
      const repeatedReasons = Array.from(row.reasonMap.entries())
        .filter(([, count]) => count > 1)
        .map(([reason]) => reason);

      const topReturnReason = Array.from(row.reasonMap.entries()).sort(
        (first, second) => second[1] - first[1]
      )[0]?.[0];

      const { riskScore, qualitySignals } = calculateRiskScore({
        totalReturns: row.totalReturns,
        totalRefundAmount: row.totalRefundAmount,
        highValueReturnCount: row.highValueReturnCount,
        qcFailedCount: row.qcFailedCount,
        damagedInventoryCount: row.damagedInventoryCount,
        damagedInventoryValue: row.damagedInventoryValue,
        repeatedReasons,
        rejectedReturns: row.rejectedReturns,
        cancelledReturns: row.cancelledReturns
      });

      const safeRow = { ...row };
      delete (safeRow as Partial<ProductAccumulator>).reasonMap;
      delete (safeRow as Partial<ProductAccumulator>).reasonRefundMap;

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
        qualitySignals
      };
    })
    .sort((first, second) => second.riskScore - first.riskScore);
};

const buildSummary = (
  rows: ProductReturnQualityRow[]
): ProductReturnQualitySummary => {
  return {
    totalProducts: rows.length,
    monitoredProducts: rows.filter((row) => row.totalReturns > 0).length,

    totalReturns: rows.reduce((total, row) => total + row.totalReturns, 0),
    totalRefundAmount: rows.reduce(
      (total, row) => total + row.totalRefundAmount,
      0
    ),

    qcPassedCount: rows.reduce((total, row) => total + row.qcPassedCount, 0),
    qcFailedCount: rows.reduce((total, row) => total + row.qcFailedCount, 0),
    qcPendingCount: rows.reduce((total, row) => total + row.qcPendingCount, 0),

    damagedInventoryCount: rows.reduce(
      (total, row) => total + row.damagedInventoryCount,
      0
    ),
    damagedInventoryValue: rows.reduce(
      (total, row) => total + row.damagedInventoryValue,
      0
    ),

    lowRiskProducts: rows.filter((row) => row.riskLevel === "LOW").length,
    mediumRiskProducts: rows.filter((row) => row.riskLevel === "MEDIUM").length,
    highRiskProducts: rows.filter((row) => row.riskLevel === "HIGH").length,
    criticalRiskProducts: rows.filter((row) => row.riskLevel === "CRITICAL")
      .length,

    productsWithRepeatedReasons: rows.filter(
      (row) => row.repeatedReasons.length > 0
    ).length,
    productsWithHighRefundValue: rows.filter(
      (row) => row.totalRefundAmount >= 25000
    ).length,
    productsWithQcFailures: rows.filter((row) => row.qcFailedCount > 0).length,
    productsWithDamagedInventory: rows.filter(
      (row) => row.damagedInventoryCount > 0
    ).length
  };
};

export const productReturnQualityService = {
  getDashboardData: async (): Promise<ProductReturnQualityDashboardData> => {
    const [requests, damagedInventory] = await Promise.all([
      safeGetArray<ReturnRequest>(RETURN_REQUESTS_ENDPOINT),
      safeGetArray<DamagedInventoryLike>(DAMAGED_RETURN_INVENTORY_ENDPOINT)
    ]);

    const rows = buildRows({
      requests,
      damagedInventory
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