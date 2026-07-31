import { apiClient } from "./apiClient";
import type { ReturnRequest } from "../types/returnRequest";
import type {
  DamagedReturnInventoryItem,
  InventoryRestockLog,
  OpenBoxInventoryItem
} from "../types/inventoryRestock";
import type { SellerReturnDispute } from "../types/sellerReturnDispute";
import type {
  ReturnLossBreakdownItem,
  ReturnLossDashboardData,
  ReturnLossDashboardSummary,
  ReturnLossSeverity,
  SellerLiabilitySummary
} from "../types/returnLossDashboard";

const RETURN_REQUESTS_ENDPOINT = "/returnRequests";
const SELLER_RETURN_DISPUTES_ENDPOINT = "/sellerReturnDisputes";
const INVENTORY_RESTOCK_LOGS_ENDPOINT = "/inventoryRestockLogs";
const OPEN_BOX_INVENTORY_ENDPOINT = "/openBoxInventory";
const DAMAGED_RETURN_INVENTORY_ENDPOINT = "/damagedReturnInventory";

type SellerAggregation = {
  sellerId: string;
  sellerName: string;
  returnIds: Set<string>;
  totalReturnedItems: number;
  totalReturnedValue: number;
  totalDisputes: number;
  pendingDisputes: number;
  approvedDisputes: number;
  rejectedDisputes: number;
  restockedValue: number;
  openBoxValue: number;
  damagedLoss: number;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

const getReturnDisplayId = (request: ReturnRequest): string => {
  return request.returnRequestId ?? request.requestId ?? request.id;
};

const getSafeNumber = (value?: number | null): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const getLossSeverity = ({
  estimatedNetLoss,
  totalReturnedValue
}: {
  estimatedNetLoss: number;
  totalReturnedValue: number;
}): ReturnLossSeverity => {
  if (totalReturnedValue <= 0) return "LOW";

  const lossRatio = estimatedNetLoss / totalReturnedValue;

  if (lossRatio >= 0.5) return "CRITICAL";
  if (lossRatio >= 0.3) return "HIGH";
  if (lossRatio >= 0.1) return "MEDIUM";
  return "LOW";
};

const getSellerRiskLevel = (riskScore: number): ReturnLossSeverity => {
  if (riskScore >= 80) return "CRITICAL";
  if (riskScore >= 60) return "HIGH";
  if (riskScore >= 35) return "MEDIUM";
  return "LOW";
};

const getDisputeProductValue = (
  dispute: SellerReturnDispute,
  returnRequests: ReturnRequest[]
): number => {
  const matchedReturn = returnRequests.find(
    (request) => request.id === dispute.returnRequestDbId
  );

  const matchedItem = matchedReturn?.items.find(
    (item) => item.productId === dispute.productId
  );

  if (!matchedItem) return 0;

  return getSafeNumber(matchedItem.price) * getSafeNumber(matchedItem.quantity);
};

const buildBreakdown = (
  summary: ReturnLossDashboardSummary
): ReturnLossBreakdownItem[] => [
  {
    label: "Returned Value",
    value: summary.totalReturnedValue,
    formattedValue: formatCurrency(summary.totalReturnedValue),
    description: "Total value of all returned products.",
    type: "VALUE"
  },
  {
    label: "Refunded Amount",
    value: summary.totalRefundedAmount,
    formattedValue: formatCurrency(summary.totalRefundedAmount),
    description: "Total refund amount processed or expected.",
    type: "VALUE"
  },
  {
    label: "Recovered Value",
    value: summary.recoveryValue,
    formattedValue: formatCurrency(summary.recoveryValue),
    description: "Value recovered through sellable restock and open-box inventory.",
    type: "VALUE"
  },
  {
    label: "Damaged Loss",
    value: summary.totalDamagedLoss,
    formattedValue: formatCurrency(summary.totalDamagedLoss),
    description: "Estimated loss from damaged or held return inventory.",
    type: "VALUE"
  },
  {
    label: "Disputed Value",
    value: summary.totalDisputedValue,
    formattedValue: formatCurrency(summary.totalDisputedValue),
    description: "Total value currently involved in seller disputes.",
    type: "VALUE"
  },
  {
    label: "Estimated Net Loss",
    value: summary.estimatedNetLoss,
    formattedValue: formatCurrency(summary.estimatedNetLoss),
    description: "Refunds and damaged losses minus recovered value.",
    type: "VALUE"
  }
];

export const returnLossDashboardService = {
  getDashboardData: async (): Promise<ReturnLossDashboardData> => {
    const [
      returnRequests,
      sellerDisputes,
      restockLogs,
      openBoxInventory,
      damagedInventory
    ] = await Promise.all([
      apiClient.get<ReturnRequest[]>(RETURN_REQUESTS_ENDPOINT),
      apiClient.get<SellerReturnDispute[]>(SELLER_RETURN_DISPUTES_ENDPOINT),
      apiClient.get<InventoryRestockLog[]>(INVENTORY_RESTOCK_LOGS_ENDPOINT),
      apiClient.get<OpenBoxInventoryItem[]>(OPEN_BOX_INVENTORY_ENDPOINT),
      apiClient.get<DamagedReturnInventoryItem[]>(DAMAGED_RETURN_INVENTORY_ENDPOINT)
    ]);

    const safeReturns = Array.isArray(returnRequests) ? returnRequests : [];
    const safeDisputes = Array.isArray(sellerDisputes) ? sellerDisputes : [];
    const safeRestockLogs = Array.isArray(restockLogs) ? restockLogs : [];
    const safeOpenBoxInventory = Array.isArray(openBoxInventory) ? openBoxInventory : [];
    const safeDamagedInventory = Array.isArray(damagedInventory) ? damagedInventory : [];

    const sellerMap = new Map<string, SellerAggregation>();

    // 1. Process Return Requests
    safeReturns.forEach((request) => {
      const returnDisplayId = getReturnDisplayId(request);

      request.items.forEach((item) => {
        const sellerId = item.sellerId ?? "unknown-seller";
        const sellerName = item.sellerName ?? "Unknown Seller";
        const itemValue = getSafeNumber(item.price) * getSafeNumber(item.quantity);

        const existingSeller = sellerMap.get(sellerId) ?? {
          sellerId,
          sellerName,
          returnIds: new Set<string>(),
          totalReturnedItems: 0,
          totalReturnedValue: 0,
          totalDisputes: 0,
          pendingDisputes: 0,
          approvedDisputes: 0,
          rejectedDisputes: 0,
          restockedValue: 0,
          openBoxValue: 0,
          damagedLoss: 0
        };

        existingSeller.returnIds.add(returnDisplayId);
        existingSeller.totalReturnedItems += getSafeNumber(item.quantity);
        existingSeller.totalReturnedValue += itemValue;

        sellerMap.set(sellerId, existingSeller);
      });
    });

    // 2. Process Restock Logs
    safeRestockLogs.forEach((log) => {
      const sellerSummary = sellerMap.get(log.sellerId);
      if (!sellerSummary) return;

      const matchingReturn = safeReturns.find(
        (request) => request.id === log.returnRequestDbId
      );

      const matchingItem = matchingReturn?.items.find(
        (item) => item.productId === log.productId
      );

      const itemValue = getSafeNumber(matchingItem?.price) * getSafeNumber(log.quantity);

      if (log.restockStatus === "RESTOCKED") {
        sellerSummary.restockedValue += itemValue;
      }
    });

    // 3. Process Open Box Inventory
    safeOpenBoxInventory.forEach((item) => {
      const sellerSummary = sellerMap.get(item.sellerId);
      if (!sellerSummary) return;

      sellerSummary.openBoxValue += getSafeNumber(item.openBoxPrice) * getSafeNumber(item.quantity);
    });

    // 4. Process Damaged Inventory
    safeDamagedInventory.forEach((item) => {
      const sellerSummary = sellerMap.get(item.sellerId);
      if (!sellerSummary) return;

      sellerSummary.damagedLoss += getSafeNumber(item.estimatedLoss);
    });

    // 5. Process Seller Disputes
    safeDisputes.forEach((dispute) => {
      const sellerSummary = sellerMap.get(dispute.sellerId);
      if (!sellerSummary) return;

      sellerSummary.totalDisputes += 1;

      if (dispute.status === "APPROVED") {
        sellerSummary.approvedDisputes += 1;
      } else if (dispute.status === "REJECTED") {
        sellerSummary.rejectedDisputes += 1;
      } else {
        sellerSummary.pendingDisputes += 1;
      }
    });

    // Aggregations
    const sellerSummariesList = Array.from(sellerMap.values());

    const totalReturnedValue = sellerSummariesList.reduce(
      (total, seller) => total + seller.totalReturnedValue,
      0
    );

    const totalRefundedAmount = safeReturns.reduce(
      (total, request) => total + getSafeNumber(request.refundAmount),
      0
    );

    const totalRestockedValue = sellerSummariesList.reduce(
      (total, seller) => total + seller.restockedValue,
      0
    );

    const totalOpenBoxValue = sellerSummariesList.reduce(
      (total, seller) => total + seller.openBoxValue,
      0
    );

    const totalDamagedLoss = sellerSummariesList.reduce(
      (total, seller) => total + seller.damagedLoss,
      0
    );

    const totalDisputedValue = safeDisputes.reduce(
      (total, dispute) => total + getDisputeProductValue(dispute, safeReturns),
      0
    );

    const approvedSellerDisputeValue = safeDisputes
      .filter((dispute) => dispute.status === "APPROVED")
      .reduce(
        (total, dispute) => total + getDisputeProductValue(dispute, safeReturns),
        0
      );

    const rejectedSellerDisputeValue = safeDisputes
      .filter((dispute) => dispute.status === "REJECTED")
      .reduce(
        (total, dispute) => total + getDisputeProductValue(dispute, safeReturns),
        0
      );

    const pendingSellerDisputeValue = safeDisputes
      .filter(
        (dispute) => !["APPROVED", "REJECTED", "CANCELLED"].includes(dispute.status)
      )
      .reduce(
        (total, dispute) => total + getDisputeProductValue(dispute, safeReturns),
        0
      );

    const recoveryValue = totalRestockedValue + totalOpenBoxValue;

    const estimatedNetLoss = Math.max(
      totalRefundedAmount + totalDamagedLoss - recoveryValue,
      0
    );

    const summary: ReturnLossDashboardSummary = {
      totalReturns: safeReturns.length,
      totalReturnedValue,
      totalRefundedAmount,
      totalRestockedValue,
      totalOpenBoxValue,
      totalDamagedLoss,
      totalDisputedValue,
      approvedSellerDisputeValue,
      rejectedSellerDisputeValue,
      pendingSellerDisputeValue,
      estimatedNetLoss,
      recoveryValue,
      lossSeverity: getLossSeverity({
        estimatedNetLoss,
        totalReturnedValue
      })
    };

    const sellerSummaries: SellerLiabilitySummary[] = sellerSummariesList
      .map((sellerSummary) => {
        // Adjusted liability logic
        const estimatedSellerLiability = Math.max(
          sellerSummary.damagedLoss,
          0
        );

        const disputeRatio =
          sellerSummary.totalReturnedItems > 0
            ? Math.min(sellerSummary.totalDisputes / sellerSummary.totalReturnedItems, 1)
            : 0;

        const damageRatio =
          sellerSummary.totalReturnedValue > 0
            ? Math.min(sellerSummary.damagedLoss / sellerSummary.totalReturnedValue, 1)
            : 0;

        const riskScore = Math.min(
          Math.round(disputeRatio * 40 + damageRatio * 60 + sellerSummary.pendingDisputes * 5),
          100
        );

        return {
          sellerId: sellerSummary.sellerId,
          sellerName: sellerSummary.sellerName,
          totalReturns: sellerSummary.returnIds.size,
          totalReturnedItems: sellerSummary.totalReturnedItems,
          totalReturnedValue: sellerSummary.totalReturnedValue,
          totalDisputes: sellerSummary.totalDisputes,
          pendingDisputes: sellerSummary.pendingDisputes,
          approvedDisputes: sellerSummary.approvedDisputes,
          rejectedDisputes: sellerSummary.rejectedDisputes,
          restockedValue: sellerSummary.restockedValue,
          openBoxValue: sellerSummary.openBoxValue,
          damagedLoss: sellerSummary.damagedLoss,
          estimatedSellerLiability,
          riskScore,
          riskLevel: getSellerRiskLevel(riskScore)
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);

    return {
      summary,
      sellerSummaries,
      breakdown: buildBreakdown(summary)
    };
  },

  formatCurrency
};