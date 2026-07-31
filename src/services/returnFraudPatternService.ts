import { apiClient } from "./apiClient";
import {
  ReturnFraudInvestigationStatus,
  ReturnFraudPatternRecord,
  ReturnFraudPatternResponse,
  ReturnFraudPatternType,
  ReturnFraudRiskLevel
} from "../types/returnFraudPattern";

type AnyObject = Record<string, unknown>;

const safeArray = async <T>(endpoint: string): Promise<T[]> => {
  try {
    const data = await apiClient.get<T[]>(endpoint);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toText = (value: unknown): string => {
  return String(value ?? "").trim();
};

const toLower = (value: unknown): string => {
  return String(value ?? "").trim().toLowerCase();
};

const getCustomerId = (item: AnyObject): string => {
  return toText(
    item.customerId ??
      item.customer_id ??
      item.userId ??
      item.user_id ??
      item.buyerId ??
      item.buyer_id ??
      ""
  );
};

const getSellerId = (item: AnyObject, linkedOrder?: AnyObject): string => {
  return toText(
    item.sellerId ??
      item.seller_id ??
      item.vendorId ??
      item.vendor_id ??
      item.storeId ??
      item.store_id ??
      linkedOrder?.sellerId ??
      linkedOrder?.seller_id ??
      ""
  );
};

const getProductId = (item: AnyObject, linkedOrder?: AnyObject): string => {
  return toText(
    item.productId ??
      item.product_id ??
      item.itemId ??
      item.item_id ??
      item.sku ??
      linkedOrder?.productId ??
      linkedOrder?.product_id ??
      ""
  );
};

const getOrderId = (item: AnyObject): string => {
  return toText(item.orderId ?? item.order_id ?? item.id ?? "");
};

const getReturnId = (item: AnyObject): string => {
  return toText(item.returnId ?? item.return_id ?? item.id ?? "");
};

const getRefundAmount = (item: AnyObject): number => {
  return toNumber(
    item.refundAmount ??
      item.refund_amount ??
      item.totalRefundAmount ??
      item.amount ??
      item.totalAmount ??
      item.itemTotal ??
      item.price ??
      0
  );
};

const getReturnReason = (item: AnyObject): string => {
  return toText(
    item.reason ??
      item.returnReason ??
      item.return_reason ??
      item.issueType ??
      item.issue_type ??
      item.qcReason ??
      item.qc_reason ??
      "Unknown"
  );
};

const getReturnDate = (item: AnyObject): string | undefined => {
  return (
    (
        item.returnDate ??
    item.createdAt ??
    item.requestedAt ??
    item.updatedAt ??
    item.refundProcessedAt ??
    undefined
    ) as string | undefined
  );
};

const getDeliveryDate = (item: AnyObject): string | undefined => {
  return (
    (
        item.deliveredAt ??
    item.deliveryDate ??
    item.deliveredDate ??
    item.completedAt ??
    undefined
    ) as string | undefined
  );
};

const getLocation = (item: AnyObject): string => {
  const city = toText(item.city ?? item.customerCity ?? item.shippingCity);
  const state = toText(item.state ?? item.customerState ?? item.shippingState);
  const pincode = toText(item.pincode ?? item.pinCode ?? item.zipCode);

  return [city, state, pincode].filter(Boolean).join(", ") || "Unknown";
};

const getCustomerName = (customer: AnyObject, fallbackId: string): string => {
  return toText(
    customer.name ??
      customer.fullName ??
      customer.customerName ??
      customer.userName ??
      `Customer ${fallbackId}`
  );
};

const getSellerName = (seller: AnyObject, fallbackId: string): string => {
  return toText(
    seller.sellerName ??
      seller.name ??
      seller.storeName ??
      seller.shopName ??
      seller.vendorName ??
      `Seller ${fallbackId}`
  );
};

const getProductName = (product: AnyObject, fallbackId: string): string => {
  return toText(
    product.productName ??
      product.name ??
      product.title ??
      product.itemName ??
      `Product ${fallbackId}`
  );
};

const countBy = <T>(
  items: T[],
  selector: (item: T) => string
): Map<string, number> => {
  const map = new Map<string, number>();

  items.forEach((item) => {
    const key = selector(item) || "Unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  });

  return map;
};

const getTopKey = (map: Map<string, number>): string => {
  let topKey = "Unknown";
  let topCount = 0;

  map.forEach((count, key) => {
    if (count > topCount) {
      topKey = key;
      topCount = count;
    }
  });

  return topKey;
};

const getTopCount = (map: Map<string, number>): number => {
  let topCount = 0;

  map.forEach((count) => {
    if (count > topCount) {
      topCount = count;
    }
  });

  return topCount;
};

const hasQcFailure = (item: AnyObject): boolean => {
  const status = toLower(item.status ?? item.returnStatus ?? item.qcStatus);
  const result = toLower(item.qcResult ?? item.inspectionResult);
  const reason = toLower(item.reason ?? item.returnReason ?? item.qcReason);

  return (
    status.includes("qc_failed") ||
    status.includes("failed") ||
    status.includes("rejected") ||
    result.includes("failed") ||
    result.includes("rejected") ||
    reason.includes("damaged") ||
    reason.includes("missing") ||
    reason.includes("wrong")
  );
};

const calculateDateDiffInDays = (
  startDate?: string,
  endDate?: string
): number | null => {
  if (!startDate || !endDate) {
    return null;
  }

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }

  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
};

const calculateRiskLevel = (fraudScore: number): ReturnFraudRiskLevel => {
  if (fraudScore >= 85) return "CRITICAL";
  if (fraudScore >= 65) return "HIGH";
  if (fraudScore >= 40) return "MEDIUM";
  return "LOW";
};

const calculateInvestigationStatus = (
  riskLevel: ReturnFraudRiskLevel
): ReturnFraudInvestigationStatus => {
  if (riskLevel === "CRITICAL") return "ESCALATED";
  if (riskLevel === "HIGH") return "ACTION_REQUIRED";
  if (riskLevel === "MEDIUM") return "UNDER_REVIEW";
  return "AUTO_FLAGGED";
};

const buildRiskReasons = (data: {
  totalReturns: number;
  totalRefundAmount: number;
  mostCommonReasonCount: number;
  mostCommonProductCount: number;
  mostCommonSellerCount: number;
  locationClusterCount: number;
  qcFailureCount: number;
  fastReturnCount: number;
}): string[] => {
  const reasons: string[] = [];

  if (data.totalReturns >= 5) {
    reasons.push("Repeated return activity detected");
  }

  if (data.totalRefundAmount >= 30000) {
    reasons.push("High refund exposure detected");
  }

  if (data.mostCommonReasonCount >= 3) {
    reasons.push("Same return reason repeated multiple times");
  }

  if (data.mostCommonProductCount >= 3) {
    reasons.push("Same product returned repeatedly");
  }

  if (data.mostCommonSellerCount >= 3) {
    reasons.push("Returns repeatedly linked to same seller");
  }

  if (data.locationClusterCount >= 3) {
    reasons.push("Returns concentrated in same location cluster");
  }

  if (data.qcFailureCount >= 2) {
    reasons.push("Multiple QC failed returns detected");
  }

  if (data.fastReturnCount >= 2) {
    reasons.push("Fast return after delivery pattern detected");
  }

  if (reasons.length === 0) {
    reasons.push("Low fraud signal, continue monitoring");
  }

  return reasons;
};

const buildRecommendedActions = (
  riskLevel: ReturnFraudRiskLevel,
  patternTypes: ReturnFraudPatternType[]
): string[] => {
  const actions: string[] = [];

  if (riskLevel === "CRITICAL") {
    actions.push("Escalate to fraud operations team immediately");
    actions.push("Hold high-value refunds until manual verification is completed");
  }

  if (riskLevel === "HIGH") {
    actions.push("Trigger manual review before refund approval");
    actions.push("Verify pickup proof and warehouse QC evidence");
  }

  if (riskLevel === "MEDIUM") {
    actions.push("Add customer to return monitoring watchlist");
  }

  if (patternTypes.includes("SELLER_LINKED_PATTERN")) {
    actions.push("Cross-check seller risk compliance score");
  }

  if (patternTypes.includes("SAME_PRODUCT_REPEATED")) {
    actions.push("Review product return quality intelligence");
  }

  if (patternTypes.includes("LOCATION_CLUSTER")) {
    actions.push("Validate pickup address and regional return cluster");
  }

  if (patternTypes.includes("FAST_RETURN_AFTER_DELIVERY")) {
    actions.push("Review delivery proof and return request timing");
  }

  if (actions.length === 0) {
    actions.push("Continue automated monitoring");
  }

  return actions;
};

const createFraudPatternRecord = (
  customerId: string,
  customer: AnyObject,
  customerOrders: AnyObject[],
  customerReturns: AnyObject[],
  sellers: AnyObject[],
  products: AnyObject[]
): ReturnFraudPatternRecord => {
  const totalOrders = customerOrders.length;
  const totalReturns = customerReturns.length;

  const totalRefundAmount = customerReturns.reduce(
    (sum, item) => sum + getRefundAmount(item),
    0
  );

  const orderIds = Array.from(
    new Set(
      customerReturns
        .map(getOrderId)
        .concat(customerOrders.map(getOrderId))
        .filter(Boolean)
    )
  );

  const returnIds = Array.from(
    new Set(customerReturns.map(getReturnId).filter(Boolean))
  );

  // Helper map to quickly find linked order for a return item
  const findLinkedOrder = (returnItem: AnyObject) => {
    const oId = getOrderId(returnItem);
    return customerOrders.find((order) => getOrderId(order) === oId);
  };

  const reasonMap = countBy(customerReturns, getReturnReason);
  const productMap = countBy(customerReturns, (item) =>
    getProductId(item, findLinkedOrder(item))
  );
  const sellerMap = countBy(customerReturns, (item) =>
    getSellerId(item, findLinkedOrder(item))
  );
  const locationMap = countBy(customerReturns, getLocation);

  const mostCommonReturnReason = getTopKey(reasonMap);
  const mostCommonProductId = getTopKey(productMap);
  const mostCommonSellerId = getTopKey(sellerMap);
  const locationCluster = getTopKey(locationMap);

  const mostCommonReasonCount = getTopCount(reasonMap);
  const mostCommonProductCount = getTopCount(productMap);
  const mostCommonSellerCount = getTopCount(sellerMap);
  const locationClusterCount = getTopCount(locationMap);

  const qcFailureCount = customerReturns.filter(hasQcFailure).length;

  const fastReturnCount = customerReturns.filter((returnItem) => {
    const linkedOrder = findLinkedOrder(returnItem);
    const deliveryDate = getDeliveryDate(linkedOrder ?? {});
    const returnDate = getReturnDate(returnItem);
    const diff = calculateDateDiffInDays(deliveryDate, returnDate);

    return diff !== null && diff <= 2;
  }).length;

  const refundModeMap = countBy(customerReturns, (item) =>
    toText(item.refundMode ?? item.paymentMode ?? item.paymentMethod)
  );

  const returnFrequencyScore = Math.min(totalReturns * 8, 25);
  const refundValueScore = Math.min(totalRefundAmount / 2500, 20);
  const reasonPatternScore = Math.min(mostCommonReasonCount * 5, 15);
  const sellerPatternScore = Math.min(mostCommonSellerCount * 4, 12);
  const productPatternScore = Math.min(mostCommonProductCount * 4, 12);
  const locationPatternScore = Math.min(locationClusterCount * 3, 8);
  const qcFailureScore = Math.min(qcFailureCount * 5, 8);
  const fastReturnScore = Math.min(fastReturnCount * 4, 8);

  const rawFraudScore = Math.round(
    returnFrequencyScore +
      refundValueScore +
      reasonPatternScore +
      sellerPatternScore +
      productPatternScore +
      locationPatternScore +
      qcFailureScore +
      fastReturnScore
  );

  const fraudScore = Math.max(0, Math.min(rawFraudScore, 100));

  const patternTypes: ReturnFraudPatternType[] = [];

  if (totalReturns >= 4) {
    patternTypes.push("REPEAT_CUSTOMER_RETURNS");
  }

  if (totalRefundAmount >= 30000) {
    patternTypes.push("HIGH_REFUND_VALUE");
  }

  if (mostCommonProductCount >= 3) {
    patternTypes.push("SAME_PRODUCT_REPEATED");
  }

  if (mostCommonReasonCount >= 3) {
    patternTypes.push("SAME_REASON_REPEATED");
  }

  if (mostCommonSellerCount >= 3) {
    patternTypes.push("SELLER_LINKED_PATTERN");
  }

  if (locationClusterCount >= 3) {
    patternTypes.push("LOCATION_CLUSTER");
  }

  if (fastReturnCount >= 2) {
    patternTypes.push("FAST_RETURN_AFTER_DELIVERY");
  }

  if (qcFailureCount >= 2) {
    patternTypes.push("QC_FAILURE_CLUSTER");
  }

  if (refundModeMap.size >= 3) {
    patternTypes.push("MULTIPLE_REFUND_MODES");
  }

  if (patternTypes.length === 0) {
    patternTypes.push("REPEAT_CUSTOMER_RETURNS");
  }

  const riskLevel = calculateRiskLevel(fraudScore);
  const investigationStatus = calculateInvestigationStatus(riskLevel);

  const seller = sellers.find((item) => {
    const sellerId = toText(
      item.id ?? item.sellerId ?? item.seller_id ?? item.vendorId
    );
    return sellerId === mostCommonSellerId;
  });

  const product = products.find((item) => {
    const productId = toText(
      item.id ?? item.productId ?? item.product_id ?? item.sku
    );
    return productId === mostCommonProductId;
  });

  // ✅ CORRECT (Safe narrowing)
const returnDates = customerReturns
  .map(getReturnDate)
  .filter((date): date is string => typeof date === "string" && date.trim() !== "")
  .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const mostReturnedProduct = product
    ? getProductName(product, mostCommonProductId)
    : mostCommonProductId;

  const mostLinkedSeller = seller
    ? getSellerName(seller, mostCommonSellerId)
    : mostCommonSellerId;

  return {
    id: `FRAUD-${customerId}`,

    customerId,
    customerName: getCustomerName(customer, customerId),
    customerEmail: (customer.email ?? customer.customerEmail) as string | undefined,
    customerPhone: (customer.phone ?? customer.mobile ?? customer.customerPhone) as string | undefined,

    sellerId: mostCommonSellerId !== "Unknown" ? mostCommonSellerId : undefined,
    sellerName: mostLinkedSeller !== "Unknown" ? mostLinkedSeller : undefined,
    storeName: (seller?.storeName ?? seller?.shopName ?? seller?.businessName) as string | undefined,

    productId: mostCommonProductId !== "Unknown" ? mostCommonProductId : undefined,
    productName:
      mostReturnedProduct !== "Unknown" ? mostReturnedProduct : undefined,
    category: (product?.category ?? product?.productCategory) as string | undefined,

    orderIds,
    returnIds,

    totalOrders,
    totalReturns,
    totalRefundAmount,

    returnFrequencyScore: Math.round(returnFrequencyScore),
    refundValueScore: Math.round(refundValueScore),
    reasonPatternScore: Math.round(reasonPatternScore),
    sellerPatternScore: Math.round(sellerPatternScore),
    productPatternScore: Math.round(productPatternScore),
    locationPatternScore: Math.round(locationPatternScore),
    qcFailureScore: Math.round(qcFailureScore),
    fastReturnScore: Math.round(fastReturnScore),

    fraudScore,
    riskLevel,
    investigationStatus,

    patternTypes,

    mostCommonReturnReason,
    mostReturnedProduct:
      mostReturnedProduct !== "Unknown" ? mostReturnedProduct : undefined,
    mostLinkedSeller:
      mostLinkedSeller !== "Unknown" ? mostLinkedSeller : undefined,
    locationCluster:
      locationCluster !== "Unknown" ? locationCluster : undefined,

    firstReturnDate: returnDates[0],
    lastReturnDate: returnDates[returnDates.length - 1],
    lastUpdatedAt: new Date().toISOString(),

    riskReasons: buildRiskReasons({
      totalReturns,
      totalRefundAmount,
      mostCommonReasonCount,
      mostCommonProductCount,
      mostCommonSellerCount,
      locationClusterCount,
      qcFailureCount,
      fastReturnCount
    }),

    recommendedActions: buildRecommendedActions(riskLevel, patternTypes)
  };
};

export const returnFraudPatternService = {
  async getReturnFraudPatterns(): Promise<ReturnFraudPatternResponse> {
    const [customers, orders, returns, sellers, products] = await Promise.all([
      safeArray<AnyObject>("/users"),
      safeArray<AnyObject>("/orders"),
      safeArray<AnyObject>("/returns"),
      safeArray<AnyObject>("/sellers"),
      safeArray<AnyObject>("/products")
    ]);

    const customerMap = new Map<string, AnyObject>();

    customers.forEach((customer) => {
      const customerId = toText(
        customer.id ?? customer.customerId ?? customer.userId ?? ""
      );

      if (customerId) {
        customerMap.set(customerId, customer);
      }
    });

    orders.forEach((order) => {
      const customerId = getCustomerId(order);

      if (customerId && !customerMap.has(customerId)) {
        customerMap.set(customerId, {
          id: customerId,
          name: order.customerName ?? `Customer ${customerId}`,
          email: order.customerEmail,
          phone: order.customerPhone
        });
      }
    });

    returns.forEach((returnItem) => {
      const customerId = getCustomerId(returnItem);

      if (customerId && !customerMap.has(customerId)) {
        customerMap.set(customerId, {
          id: customerId,
          name: returnItem.customerName ?? `Customer ${customerId}`,
          email: returnItem.customerEmail,
          phone: returnItem.customerPhone
        });
      }
    });

    const records = Array.from(customerMap.entries())
      .map(([customerId, customer]) => {
        const customerOrders = orders.filter(
          (order) => getCustomerId(order) === customerId
        );

        const customerReturns = returns.filter(
          (returnItem) => getCustomerId(returnItem) === customerId
        );

        return createFraudPatternRecord(
          customerId,
          customer,
          customerOrders,
          customerReturns,
          sellers,
          products
        );
      })
      .filter((record) => record.totalReturns >= 2 || record.fraudScore >= 25)
      .sort((a, b) => b.fraudScore - a.fraudScore);

    const totalFlaggedPatterns = records.length;

    const uniqueSellerIds = new Set(
      records.map((item) => item.sellerId).filter(Boolean)
    );

    const uniqueProductIds = new Set(
      records.map((item) => item.productId).filter(Boolean)
    );

    const summary: ReturnFraudPatternResponse["summary"] = {
      totalFlaggedPatterns,
      lowRiskPatterns: records.filter((item) => item.riskLevel === "LOW").length,
      mediumRiskPatterns: records.filter((item) => item.riskLevel === "MEDIUM")
        .length,
      highRiskPatterns: records.filter((item) => item.riskLevel === "HIGH")
        .length,
      criticalRiskPatterns: records.filter(
        (item) => item.riskLevel === "CRITICAL"
      ).length,
      totalRefundExposure: records.reduce(
        (sum, item) => sum + item.totalRefundAmount,
        0
      ),
      customersUnderReview: records.filter((item) =>
        ["UNDER_REVIEW", "ACTION_REQUIRED", "ESCALATED"].includes(
          item.investigationStatus
        )
      ).length,
      sellersLinkedToPatterns: uniqueSellerIds.size,
      productsLinkedToPatterns: uniqueProductIds.size,
      averageFraudScore:
        totalFlaggedPatterns > 0
          ? Number(
              (
                records.reduce((sum, item) => sum + item.fraudScore, 0) /
                totalFlaggedPatterns
              ).toFixed(2)
            )
          : 0
    };

    return {
      records,
      summary
    };
  },

  formatCurrency(amount: number, locale = "en-IN", currency = "INR"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(amount || 0);
  },

  formatDateTime(dateStr?: string): string {
    if (!dateStr) {
      return "N/A";
    }

    const date = new Date(dateStr);

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