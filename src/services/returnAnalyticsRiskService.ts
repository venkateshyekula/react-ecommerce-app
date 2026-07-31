import { apiClient } from "./apiClient";
import type { ReturnRequest } from "../types/returnRequest";
import type {
  CustomerReturnRiskRow,
  ProductReturnRiskRow,
  ReturnAnalyticsDashboardData,
  ReturnAnalyticsRiskLevel,
  ReturnReasonTrendRow,
  SellerReturnRiskRow
} from "../types/returnAnalyticsRisk";

const RETURN_REQUESTS_ENDPOINT = "/returnRequests";
const SELLER_RETURN_DISPUTES_ENDPOINT = "/sellerReturnDisputes";
const DAMAGED_RETURN_INVENTORY_ENDPOINT = "/damagedReturnInventory";

type SellerReturnDisputeLike = {
  id: string;
  disputeId?: string;
  sellerId?: string;
  sellerName?: string;
  status?: string;
  decision?: string;
  returnRequestId?: string;
  refundAmount?: number;
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

type ReturnItemLike = {
  productId?: string;
  name?: string;
  brand?: string;
  category?: string;
  sellerId?: string;
  sellerName?: string;
  price?: number;
  subtotal?: number;
  quantity?: number;
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

const normalizeStatus = (status?: string | null): string => {
  return status?.trim().toUpperCase() ?? "";
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

const getRefundAmount = (request: ReturnRequest): number => {
  return getNumber(request.refundAmount);
};

const getRiskLevel = (score: number): ReturnAnalyticsRiskLevel => {
  if (score >= 85) return "CRITICAL";
  if (score >= 65) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
};

const getCustomerRiskScore = ({
  totalReturns,
  totalRefundValue,
  failedQcCount,
  repeatedReasonCount,
  rejectedReturns
}: {
  totalReturns: number;
  totalRefundValue: number;
  failedQcCount: number;
  repeatedReasonCount: number;
  rejectedReturns: number;
}): number => {
  const returnScore = Math.min(totalReturns * 10, 35);
  const refundScore = Math.min(totalRefundValue / 10000, 25);
  const qcScore = Math.min(failedQcCount * 12, 25);
  const repeatedReasonScore = Math.min(repeatedReasonCount * 5, 10);
  const rejectedScore = Math.min(rejectedReturns * 5, 10);

  return Math.min(
    Math.round(
      returnScore + refundScore + qcScore + repeatedReasonScore + rejectedScore
    ),
    100
  );
};

const getProductRiskScore = ({
  totalReturns,
  totalRefundValue,
  qcFailedCount,
  damagedCount
}: {
  totalReturns: number;
  totalRefundValue: number;
  qcFailedCount: number;
  damagedCount: number;
}): number => {
  const returnScore = Math.min(totalReturns * 8, 35);
  const refundScore = Math.min(totalRefundValue / 15000, 25);
  const qcScore = Math.min(qcFailedCount * 12, 25);
  const damagedScore = Math.min(damagedCount * 10, 15);

  return Math.min(
    Math.round(returnScore + refundScore + qcScore + damagedScore),
    100
  );
};

const getSellerRiskScore = ({
  totalReturns,
  totalRefundValue,
  qcFailedCount,
  disputesApproved,
  damagedInventoryValue
}: {
  totalReturns: number;
  totalRefundValue: number;
  qcFailedCount: number;
  disputesApproved: number;
  damagedInventoryValue: number;
}): number => {
  const returnScore = Math.min(totalReturns * 6, 30);
  const refundScore = Math.min(totalRefundValue / 20000, 20);
  const qcScore = Math.min(qcFailedCount * 10, 25);
  const disputeScore = Math.min(disputesApproved * 10, 15);
  const damageScore = Math.min(damagedInventoryValue / 10000, 10);

  return Math.min(
    Math.round(returnScore + refundScore + qcScore + disputeScore + damageScore),
    100
  );
};

const isCompletedReturn = (request: ReturnRequest): boolean => {
  const status = normalizeStatus(request.status);
  const refundStatus = normalizeStatus(request.refundStatus);

  return status === "REFUND_COMPLETED" || refundStatus === "COMPLETED";
};

const isRejectedReturn = (request: ReturnRequest): boolean => {
  return normalizeStatus(request.status) === "REJECTED";
};

const isQcFailed = (request: ReturnRequest): boolean => {
  const qcStatus = normalizeStatus(request.qualityCheckStatus);
  return ["FAILED", "REJECTED", "QC_FAILED"].includes(qcStatus);
};

const isQcPassed = (request: ReturnRequest): boolean => {
  const qcStatus = normalizeStatus(request.qualityCheckStatus);
  return ["PASSED", "APPROVED", "QC_PASSED"].includes(qcStatus);
};

const isPickupCompleted = (request: ReturnRequest): boolean => {
  const pickupStatus = normalizeStatus(request.pickupStatus);
  return ["PICKED_UP", "PICKUP_COMPLETED"].includes(pickupStatus);
};

const isPickupFailed = (request: ReturnRequest): boolean => {
  const pickupStatus = normalizeStatus(request.pickupStatus);
  return ["FAILED", "PICKUP_ATTEMPTED"].includes(pickupStatus);
};

const getItems = (request: ReturnRequest): ReturnItemLike[] => {
  const requestWithItems = request as ReturnRequest & {
    items?: ReturnItemLike[];
    productId?: string;
    productName?: string;
    sellerId?: string;
    sellerName?: string;
  };

  if (Array.isArray(requestWithItems.items) && requestWithItems.items.length > 0) {
    return requestWithItems.items;
  }

  // Fallback if request contains single product details at root
  if (requestWithItems.productId || requestWithItems.sellerId) {
    return [
      {
        productId: requestWithItems.productId,
        name: requestWithItems.productName,
        sellerId: requestWithItems.sellerId,
        sellerName: requestWithItems.sellerName
      }
    ];
  }

  return [];
};

const buildReasonTrends = (
  requests: ReturnRequest[]
): ReturnReasonTrendRow[] => {
  const reasonMap = new Map<string, ReturnReasonTrendRow>();

  requests.forEach((request) => {
    const reason = normalizeReason(request);
    const existing = reasonMap.get(reason) ?? {
      reason,
      count: 0,
      refundValue: 0
    };

    existing.count += 1;
    existing.refundValue += getRefundAmount(request);

    reasonMap.set(reason, existing);
  });

  return Array.from(reasonMap.values()).sort(
    (first, second) => second.count - first.count
  );
};

const buildCustomerRows = (
  requests: ReturnRequest[]
): CustomerReturnRiskRow[] => {
  const customerMap = new Map<
    string,
    CustomerReturnRiskRow & {
      reasonCountMap: Map<string, number>;
    }
  >();

  requests.forEach((request) => {
    const userId = request.userId;
    if (!userId) return; // Skip entries without valid user ID to avoid polluting unknown group

    const reason = normalizeReason(request);

    const existing =
      customerMap.get(userId) ??
      ({
        userId,
        customerName: request.userName ?? "Unknown Customer",
        customerEmail: request.userEmail,
        totalReturns: 0,
        activeReturns: 0,
        completedReturns: 0,
        rejectedReturns: 0,
        totalRefundValue: 0,
        failedQcCount: 0,
        repeatedReasons: [],
        riskScore: 0,
        riskLevel: "LOW",
        reasonCountMap: new Map<string, number>()
      } satisfies CustomerReturnRiskRow & {
        reasonCountMap: Map<string, number>;
      });

    existing.totalReturns += 1;
    existing.totalRefundValue += getRefundAmount(request);

    if (isCompletedReturn(request)) {
      existing.completedReturns += 1;
    } else if (isRejectedReturn(request)) {
      existing.rejectedReturns += 1;
    } else {
      existing.activeReturns += 1;
    }

    if (isQcFailed(request)) {
      existing.failedQcCount += 1;
    }

    existing.reasonCountMap.set(
      reason,
      (existing.reasonCountMap.get(reason) ?? 0) + 1
    );

    customerMap.set(userId, existing);
  });

  return Array.from(customerMap.values())
  .map((row) => {
    const repeatedReasons = Array.from(row.reasonCountMap.entries())
      .filter(([, count]) => count > 1)
      .map(([reason]) => reason);

    const riskScore = getCustomerRiskScore({
      totalReturns: row.totalReturns,
      totalRefundValue: row.totalRefundValue,
      failedQcCount: row.failedQcCount,
      repeatedReasonCount: repeatedReasons.length,
      rejectedReturns: row.rejectedReturns
    });

    // Clean up temporary property without declaring a new variable
    delete (row as { reasonCountMap?: Map<string, number> }).reasonCountMap;

    return {
      ...row,
      repeatedReasons,
      riskScore,
      riskLevel: getRiskLevel(riskScore)
    };
  })
  .sort((first, second) => second.riskScore - first.riskScore);
};

const buildProductRows = (
  requests: ReturnRequest[],
  damagedInventory: DamagedInventoryLike[]
): ProductReturnRiskRow[] => {
  const productMap = new Map<
    string,
    ProductReturnRiskRow & {
      reasonCountMap: Map<string, number>;
    }
  >();

  requests.forEach((request) => {
    const reason = normalizeReason(request);
    const items = getItems(request);

    items.forEach((item) => {
      const productId = item.productId;
      if (!productId) return;

      const existing =
        productMap.get(productId) ??
        ({
          productId,
          productName: item.name ?? "Unknown Product",
          brand: item.brand,
          category: item.category,
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          totalReturns: 0,
          totalRefundValue: 0,
          qcFailedCount: 0,
          qcPassedCount: 0,
          damagedCount: 0,
          riskScore: 0,
          riskLevel: "LOW",
          reasonCountMap: new Map<string, number>()
        } satisfies ProductReturnRiskRow & {
          reasonCountMap: Map<string, number>;
        });

      existing.totalReturns += 1;
      
      // Calculate item specific refund or proportional request refund
      const itemRefund = getNumber(item.subtotal) || 
        (items.length > 0 ? getRefundAmount(request) / items.length : getRefundAmount(request));
      
      existing.totalRefundValue += itemRefund;

      if (isQcFailed(request)) {
        existing.qcFailedCount += 1;
      }

      if (isQcPassed(request)) {
        existing.qcPassedCount += 1;
      }

      existing.reasonCountMap.set(
        reason,
        (existing.reasonCountMap.get(reason) ?? 0) + 1
      );

      productMap.set(productId, existing);
    });
  });

  damagedInventory.forEach((item) => {
    if (!item.productId) return;

    const existing =
      productMap.get(item.productId) ??
      ({
        productId: item.productId,
        productName: item.productName ?? "Unknown Product",
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        totalReturns: 0,
        totalRefundValue: 0,
        qcFailedCount: 0,
        qcPassedCount: 0,
        damagedCount: 0,
        riskScore: 0,
        riskLevel: "LOW",
        reasonCountMap: new Map<string, number>()
      } satisfies ProductReturnRiskRow & {
        reasonCountMap: Map<string, number>;
      });

    existing.damagedCount += 1;
    productMap.set(item.productId, existing);
  });

  return Array.from(productMap.values())
    .map((row) => {
      const mostCommonReason = Array.from(row.reasonCountMap.entries()).sort(
        (first, second) => second[1] - first[1]
      )[0]?.[0];

      const riskScore = getProductRiskScore({
        totalReturns: row.totalReturns,
        totalRefundValue: row.totalRefundValue,
        qcFailedCount: row.qcFailedCount,
        damagedCount: row.damagedCount
      });

      // Delete the temporary Map property directly to avoid creating an unused variable
      delete (row as { reasonCountMap?: Map<string, number> }).reasonCountMap;

      return {
        ...row,
        mostCommonReason,
        riskScore,
        riskLevel: getRiskLevel(riskScore)
      };
    })
    .sort((first, second) => second.riskScore - first.riskScore);
};

const buildSellerRows = ({
  requests,
  disputes,
  damagedInventory
}: {
  requests: ReturnRequest[];
  disputes: SellerReturnDisputeLike[];
  damagedInventory: DamagedInventoryLike[];
}): SellerReturnRiskRow[] => {
  const sellerMap = new Map<string, SellerReturnRiskRow>();

  requests.forEach((request) => {
    const items = getItems(request);

    items.forEach((item) => {
      const sellerId = item.sellerId;
      if (!sellerId) return;

      const existing =
        sellerMap.get(sellerId) ??
        ({
          sellerId,
          sellerName: item.sellerName ?? "Unknown Seller",
          totalReturns: 0,
          totalRefundValue: 0,
          qcFailedCount: 0,
          qcPassedCount: 0,
          disputesRaised: 0,
          disputesApproved: 0,
          disputesRejected: 0,
          damagedInventoryValue: 0,
          riskScore: 0,
          riskLevel: "LOW"
        } satisfies SellerReturnRiskRow);

      existing.totalReturns += 1;

      const itemRefund = getNumber(item.subtotal) || 
        (items.length > 0 ? getRefundAmount(request) / items.length : getRefundAmount(request));

      existing.totalRefundValue += itemRefund;

      if (isQcFailed(request)) {
        existing.qcFailedCount += 1;
      }

      if (isQcPassed(request)) {
        existing.qcPassedCount += 1;
      }

      sellerMap.set(sellerId, existing);
    });
  });

  disputes.forEach((dispute) => {
    const sellerId = dispute.sellerId;
    if (!sellerId) return;

    const existing =
      sellerMap.get(sellerId) ??
      ({
        sellerId,
        sellerName: dispute.sellerName ?? "Unknown Seller",
        totalReturns: 0,
        totalRefundValue: 0,
        qcFailedCount: 0,
        qcPassedCount: 0,
        disputesRaised: 0,
        disputesApproved: 0,
        disputesRejected: 0,
        damagedInventoryValue: 0,
        riskScore: 0,
        riskLevel: "LOW"
      } satisfies SellerReturnRiskRow);

    existing.disputesRaised += 1;

    const status = normalizeStatus(dispute.status ?? dispute.decision);

    if (["APPROVED", "SELLER_LIABLE", "ADMIN_APPROVED"].includes(status)) {
      existing.disputesApproved += 1;
    }

    if (["REJECTED", "DENIED", "ADMIN_REJECTED"].includes(status)) {
      existing.disputesRejected += 1;
    }

    sellerMap.set(sellerId, existing);
  });

  damagedInventory.forEach((item) => {
    const sellerId = item.sellerId;
    if (!sellerId) return;

    const existing =
      sellerMap.get(sellerId) ??
      ({
        sellerId,
        sellerName: item.sellerName ?? "Unknown Seller",
        totalReturns: 0,
        totalRefundValue: 0,
        qcFailedCount: 0,
        qcPassedCount: 0,
        disputesRaised: 0,
        disputesApproved: 0,
        disputesRejected: 0,
        damagedInventoryValue: 0,
        riskScore: 0,
        riskLevel: "LOW"
      } satisfies SellerReturnRiskRow);

    existing.damagedInventoryValue +=
      getNumber(item.estimatedLossAmount) ||
      getNumber(item.lossAmount) ||
      getNumber(item.refundAmount);

    sellerMap.set(sellerId, existing);
  });

  return Array.from(sellerMap.values())
    .map((row) => {
      const riskScore = getSellerRiskScore({
        totalReturns: row.totalReturns,
        totalRefundValue: row.totalRefundValue,
        qcFailedCount: row.qcFailedCount,
        disputesApproved: row.disputesApproved,
        damagedInventoryValue: row.damagedInventoryValue
      });

      return {
        ...row,
        riskScore,
        riskLevel: getRiskLevel(riskScore)
      };
    })
    .sort((first, second) => second.riskScore - first.riskScore);
};

export const returnAnalyticsService = {
  getDashboardData: async (): Promise<ReturnAnalyticsDashboardData> => {
    const [requests, disputes, damagedInventory] = await Promise.all([
      safeGetArray<ReturnRequest>(RETURN_REQUESTS_ENDPOINT),
      safeGetArray<SellerReturnDisputeLike>(SELLER_RETURN_DISPUTES_ENDPOINT),
      safeGetArray<DamagedInventoryLike>(DAMAGED_RETURN_INVENTORY_ENDPOINT)
    ]);

    const customerRiskRows = buildCustomerRows(requests);
    const productRiskRows = buildProductRows(requests, damagedInventory);
    const sellerRiskRows = buildSellerRows({
      requests,
      disputes,
      damagedInventory
    });
    const reasonTrends = buildReasonTrends(requests);

    const summary = {
      totalReturns: requests.length,
      activeReturns: requests.filter(
        (request) => !isCompletedReturn(request) && !isRejectedReturn(request)
      ).length,
      completedReturns: requests.filter(isCompletedReturn).length,
      rejectedReturns: requests.filter(isRejectedReturn).length,

      totalRefundValue: requests.reduce(
        (total, request) => total + getRefundAmount(request),
        0
      ),
      pendingRefundValue: requests
        .filter((request) => normalizeStatus(request.refundStatus) !== "COMPLETED")
        .reduce((total, request) => total + getRefundAmount(request), 0),
      completedRefundValue: requests
        .filter((request) => normalizeStatus(request.refundStatus) === "COMPLETED")
        .reduce((total, request) => total + getRefundAmount(request), 0),

      qcPassedCount: requests.filter(isQcPassed).length,
      qcFailedCount: requests.filter(isQcFailed).length,
      qcPendingCount: requests.filter((request) =>
        ["PENDING", "NOT_STARTED", ""].includes(
          normalizeStatus(request.qualityCheckStatus)
        )
      ).length,

      pickupPendingCount: requests.filter((request) =>
        ["NOT_SCHEDULED", "SCHEDULED", "OUT_FOR_PICKUP", "PENDING", ""].includes(
          normalizeStatus(request.pickupStatus)
        )
      ).length,
      pickupCompletedCount: requests.filter(isPickupCompleted).length,
      pickupFailedCount: requests.filter(isPickupFailed).length,

      sellerDisputesCount: disputes.length,
      approvedSellerDisputesCount: disputes.filter((dispute) =>
        ["APPROVED", "SELLER_LIABLE", "ADMIN_APPROVED"].includes(
          normalizeStatus(dispute.status ?? dispute.decision)
        )
      ).length,
      rejectedSellerDisputesCount: disputes.filter((dispute) =>
        ["REJECTED", "DENIED", "ADMIN_REJECTED"].includes(
          normalizeStatus(dispute.status ?? dispute.decision)
        )
      ).length,

      highRiskCustomers: customerRiskRows.filter((row) =>
        ["HIGH", "CRITICAL"].includes(row.riskLevel)
      ).length,
      highRiskProducts: productRiskRows.filter((row) =>
        ["HIGH", "CRITICAL"].includes(row.riskLevel)
      ).length,
      highRiskSellers: sellerRiskRows.filter((row) =>
        ["HIGH", "CRITICAL"].includes(row.riskLevel)
      ).length
    };

    return {
      summary,
      customerRiskRows,
      productRiskRows,
      sellerRiskRows,
      reasonTrends
    };
  },

  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  }
};