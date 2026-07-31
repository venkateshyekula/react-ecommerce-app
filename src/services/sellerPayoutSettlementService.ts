import { apiClient } from "./apiClient";
import type { ReturnRequest } from "../types/returnRequest";
import type {
  SellerPayoutAdjustmentRecord,
  SellerPayoutAdjustmentType,
  SellerPayoutRiskLevel,
  SellerPayoutSettlementActionPayload,
  SellerPayoutSettlementDashboardData,
  SellerPayoutSettlementRow,
  SellerPayoutSettlementStatus,
  SellerPayoutSettlementSummary
} from "../types/sellerPayoutSettlement";

const RETURN_REQUESTS_ENDPOINT = "/returnRequests";
const SELLER_RETURN_DISPUTES_ENDPOINT = "/sellerReturnDisputes";
const DAMAGED_RETURN_INVENTORY_ENDPOINT = "/damagedReturnInventory";
const SELLERS_ENDPOINT = "/sellers";
const SELLER_PAYOUT_ADJUSTMENTS_ENDPOINT = "/sellerPayoutAdjustments";

type SellerLike = {
  id?: string;
  sellerId?: string;
  sellerName?: string;
  name?: string;
  storeName?: string;
  shopName?: string;
  businessName?: string;
  email?: string;
  sellerEmail?: string;
  phone?: string;
  sellerPhone?: string;
};

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

type ReturnItemLike = {
  productId?: string;
  name?: string;
  productName?: string;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  price?: number;
  subtotal?: number;
  quantity?: number;
};

type ReturnRequestWithSellerFallback = ReturnRequest & {
  items?: ReturnItemLike[];
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  productId?: string;
  productName?: string;
};

type SellerAccumulator = SellerPayoutSettlementRow & {
  returnReasonMap: Map<string, number>;
};

const safeGetArray = async <T>(endpoint: string): Promise<T[]> => {
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

const getNumber = (value?: number | null): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const normalizeText = (value?: string | null): string => {
  return value?.trim() ?? "";
};

const normalizeStatus = (value?: string | null): string => {
  return value?.trim().toUpperCase() ?? "";
};

const getSafeDateTime = (value?: string): number => {
  if (!value) {
    return 0;
  }

  const dateTime = new Date(value).getTime();
  return Number.isNaN(dateTime) ? 0 : dateTime;
};

const getReturnReason = (request: ReturnRequest): string => {
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

const isCompletedReturn = (request: ReturnRequest): boolean => {
  const status = normalizeStatus(request.status);
  const refundStatus = normalizeStatus(request.refundStatus);

  return (
    ["REFUND_COMPLETED", "REFUNDED", "COMPLETED", "CLOSED"].includes(status) ||
    refundStatus === "COMPLETED"
  );
};

const isRejectedReturn = (request: ReturnRequest): boolean => {
  const status = normalizeStatus(request.status);

  return status === "REJECTED" || status === "CANCELLED";
};

const getItems = (request: ReturnRequest): ReturnItemLike[] => {
  const requestWithFallback = request as ReturnRequestWithSellerFallback;

  if (
    Array.isArray(requestWithFallback.items) &&
    requestWithFallback.items.length > 0
  ) {
    return requestWithFallback.items;
  }

  if (requestWithFallback.sellerId || requestWithFallback.productId) {
    return [
      {
        productId: requestWithFallback.productId,
        productName: requestWithFallback.productName,
        sellerId: requestWithFallback.sellerId,
        sellerName: requestWithFallback.sellerName,
        sellerEmail: requestWithFallback.sellerEmail,
        sellerPhone: requestWithFallback.sellerPhone
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

const getSellerIdFromSeller = (seller: SellerLike): string => {
  return normalizeText(seller.sellerId ?? seller.id);
};

const getSellerNameFromSeller = (seller: SellerLike, fallbackId: string): string => {
  return (
    seller.sellerName ??
    seller.name ??
    seller.storeName ??
    seller.shopName ??
    seller.businessName ??
    `Seller ${fallbackId}`
  );
};

const getRiskLevel = (riskScore: number): SellerPayoutRiskLevel => {
  if (riskScore >= 85) {
    return "CRITICAL";
  }

  if (riskScore >= 65) {
    return "HIGH";
  }

  if (riskScore >= 40) {
    return "MEDIUM";
  }

  return "LOW";
};

const getAdjustmentType = ({
  riskScore,
  sellerLiabilityAmount,
  damagedInventoryValue,
  disputesApproved
}: {
  riskScore: number;
  sellerLiabilityAmount: number;
  damagedInventoryValue: number;
  disputesApproved: number;
}): SellerPayoutAdjustmentType => {
  if (riskScore >= 85 || sellerLiabilityAmount >= 50000) {
    return "PAYOUT_HOLD";
  }

  if (damagedInventoryValue >= 25000 || disputesApproved >= 3) {
    return "PAYOUT_DEDUCTION";
  }

  if (sellerLiabilityAmount > 0 || disputesApproved > 0) {
    return "PARTIAL_DEDUCTION";
  }

  return "NO_ACTION";
};

const getSettlementStatus = (
  adjustmentType: SellerPayoutAdjustmentType
): SellerPayoutSettlementStatus => {
  if (adjustmentType === "PAYOUT_HOLD") {
    return "ON_HOLD";
  }

  if (
    adjustmentType === "PAYOUT_DEDUCTION" ||
    adjustmentType === "PARTIAL_DEDUCTION"
  ) {
    return "PENDING";
  }

  if (adjustmentType === "MANUAL_REVIEW") {
    return "UNDER_REVIEW";
  }

  return "APPROVED";
};

const getRiskScore = ({
  totalReturns,
  sellerLiabilityAmount,
  damagedInventoryValue,
  disputesApproved,
  disputesRaised
}: {
  totalReturns: number;
  sellerLiabilityAmount: number;
  damagedInventoryValue: number;
  disputesApproved: number;
  disputesRaised: number;
}): number => {
  const returnScore = Math.min(totalReturns * 4, 20);
  const liabilityScore = Math.min(sellerLiabilityAmount / 2000, 30);
  const damageScore = Math.min(damagedInventoryValue / 2500, 20);
  const disputeScore = Math.min(disputesApproved * 8 + disputesRaised * 2, 30);

  return Math.min(
    Math.round(returnScore + liabilityScore + damageScore + disputeScore),
    100
  );
};

const buildSettlementReasons = ({
  totalReturns,
  sellerLiabilityAmount,
  damagedInventoryValue,
  disputesApproved,
  disputesRejected
}: {
  totalReturns: number;
  sellerLiabilityAmount: number;
  damagedInventoryValue: number;
  disputesApproved: number;
  disputesRejected: number;
}): string[] => {
  const reasons: string[] = [];

  if (totalReturns >= 5) {
    reasons.push(`Seller has ${totalReturns} return-linked cases.`);
  }

  if (sellerLiabilityAmount > 0) {
    reasons.push(`Seller liability amount is ₹${Math.round(sellerLiabilityAmount)}.`);
  }

  if (damagedInventoryValue > 0) {
    reasons.push(`Damaged inventory value is ₹${Math.round(damagedInventoryValue)}.`);
  }

  if (disputesApproved > 0) {
    reasons.push(`${disputesApproved} seller-liability dispute(s) approved.`);
  }

  if (disputesRejected > 0) {
    reasons.push(`${disputesRejected} dispute(s) rejected after review.`);
  }

  if (reasons.length === 0) {
    reasons.push("No seller payout adjustment required.");
  }

  return reasons;
};

const buildRecommendedActions = ({
  adjustmentType,
  settlementStatus
}: {
  adjustmentType: SellerPayoutAdjustmentType;
  settlementStatus: SellerPayoutSettlementStatus;
}): string[] => {
  const actions: string[] = [];

  if (adjustmentType === "PAYOUT_HOLD") {
    actions.push("Hold seller payout until admin review is completed.");
    actions.push("Verify dispute evidence, QC proof, and damaged inventory loss.");
  }

  if (adjustmentType === "PAYOUT_DEDUCTION") {
    actions.push("Apply payout deduction for seller liability.");
    actions.push("Notify seller about liability settlement details.");
  }

  if (adjustmentType === "PARTIAL_DEDUCTION") {
    actions.push("Apply partial deduction and keep settlement in pending state.");
  }

  if (settlementStatus === "APPROVED") {
    actions.push("No payout hold required. Continue normal payout cycle.");
  }

  if (actions.length === 0) {
    actions.push("Continue monitoring seller payout liability.");
  }

  return actions;
};

const buildSellerRows = ({
  sellers,
  requests,
  disputes,
  damagedInventory,
  adjustmentRecords
}: {
  sellers: SellerLike[];
  requests: ReturnRequest[];
  disputes: SellerReturnDisputeLike[];
  damagedInventory: DamagedInventoryLike[];
  adjustmentRecords: SellerPayoutAdjustmentRecord[];
}): SellerPayoutSettlementRow[] => {
  const sellerMap = new Map<string, SellerAccumulator>();

  sellers.forEach((seller) => {
    const sellerId = getSellerIdFromSeller(seller);

    if (!sellerId) {
      return;
    }

    sellerMap.set(sellerId, {
      sellerId,
      sellerName: getSellerNameFromSeller(seller, sellerId),
      sellerEmail: seller.sellerEmail ?? seller.email,
      sellerPhone: seller.sellerPhone ?? seller.phone,
      storeName: seller.storeName ?? seller.shopName ?? seller.businessName,

      totalReturns: 0,
      completedReturns: 0,
      rejectedReturns: 0,
      activeReturns: 0,

      totalRefundAmount: 0,
      sellerLiabilityAmount: 0,
      damagedInventoryCount: 0,
      damagedInventoryValue: 0,

      disputesRaised: 0,
      disputesApproved: 0,
      disputesRejected: 0,
      disputesPending: 0,

      payoutBaseAmount: 0,
      payoutHoldAmount: 0,
      payoutDeductionAmount: 0,
      payoutCreditAmount: 0,
      finalPayableAmount: 0,

      adjustmentType: "NO_ACTION",
      settlementStatus: "APPROVED",

      liabilityRate: 0,
      disputeApprovalRate: 0,
      damageRate: 0,

      riskScore: 0,
      riskLevel: "LOW",

      settlementReasons: [],
      recommendedActions: [],

      lastReturnAt: undefined,
      lastUpdatedAt: new Date().toISOString(),

      returnReasonMap: new Map<string, number>()
    });
  });

  requests.forEach((request) => {
    const items = getItems(request);
    const reason = getReturnReason(request);

    items.forEach((item) => {
      const sellerId = normalizeText(item.sellerId);

      if (!sellerId) {
        return;
      }

      const existing =
        sellerMap.get(sellerId) ??
        ({
          sellerId,
          sellerName: item.sellerName ?? "Unknown Seller",
          sellerEmail: item.sellerEmail,
          sellerPhone: item.sellerPhone,
          totalReturns: 0,
          completedReturns: 0,
          rejectedReturns: 0,
          activeReturns: 0,
          totalRefundAmount: 0,
          sellerLiabilityAmount: 0,
          damagedInventoryCount: 0,
          damagedInventoryValue: 0,
          disputesRaised: 0,
          disputesApproved: 0,
          disputesRejected: 0,
          disputesPending: 0,
          payoutBaseAmount: 0,
          payoutHoldAmount: 0,
          payoutDeductionAmount: 0,
          payoutCreditAmount: 0,
          finalPayableAmount: 0,
          adjustmentType: "NO_ACTION",
          settlementStatus: "APPROVED",
          liabilityRate: 0,
          disputeApprovalRate: 0,
          damageRate: 0,
          riskScore: 0,
          riskLevel: "LOW",
          settlementReasons: [],
          recommendedActions: [],
          lastReturnAt: undefined,
          lastUpdatedAt: new Date().toISOString(),
          returnReasonMap: new Map<string, number>()
        } satisfies SellerAccumulator);

      const itemRefundAmount = getItemRefundAmount({
        item,
        request,
        itemCount: items.length
      });

      existing.totalReturns += 1;
      existing.totalRefundAmount += itemRefundAmount;
      existing.payoutBaseAmount += itemRefundAmount;

      if (isCompletedReturn(request)) {
        existing.completedReturns += 1;
      } else if (isRejectedReturn(request)) {
        existing.rejectedReturns += 1;
      } else {
        existing.activeReturns += 1;
      }

      existing.returnReasonMap.set(
        reason,
        (existing.returnReasonMap.get(reason) ?? 0) + 1
      );

      const updatedAt = request.updatedAt ?? request.createdAt;
      if (
        updatedAt &&
        (!existing.lastReturnAt ||
          getSafeDateTime(updatedAt) > getSafeDateTime(existing.lastReturnAt))
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
      ({
        sellerId,
        sellerName: dispute.sellerName ?? "Unknown Seller",
        sellerEmail: dispute.sellerEmail,
        sellerPhone: dispute.sellerPhone,
        totalReturns: 0,
        completedReturns: 0,
        rejectedReturns: 0,
        activeReturns: 0,
        totalRefundAmount: 0,
        sellerLiabilityAmount: 0,
        damagedInventoryCount: 0,
        damagedInventoryValue: 0,
        disputesRaised: 0,
        disputesApproved: 0,
        disputesRejected: 0,
        disputesPending: 0,
        payoutBaseAmount: 0,
        payoutHoldAmount: 0,
        payoutDeductionAmount: 0,
        payoutCreditAmount: 0,
        finalPayableAmount: 0,
        adjustmentType: "NO_ACTION",
        settlementStatus: "APPROVED",
        liabilityRate: 0,
        disputeApprovalRate: 0,
        damageRate: 0,
        riskScore: 0,
        riskLevel: "LOW",
        settlementReasons: [],
        recommendedActions: [],
        lastReturnAt: undefined,
        lastUpdatedAt: new Date().toISOString(),
        returnReasonMap: new Map<string, number>()
      } satisfies SellerAccumulator);

    existing.disputesRaised += 1;

    const disputeStatus = normalizeStatus(dispute.status ?? dispute.decision);

    if (["APPROVED", "SELLER_LIABLE", "ADMIN_APPROVED"].includes(disputeStatus)) {
      existing.disputesApproved += 1;
      existing.sellerLiabilityAmount +=
        getNumber(dispute.liabilityAmount) || getNumber(dispute.refundAmount);
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
      ({
        sellerId,
        sellerName: item.sellerName ?? "Unknown Seller",
        totalReturns: 0,
        completedReturns: 0,
        rejectedReturns: 0,
        activeReturns: 0,
        totalRefundAmount: 0,
        sellerLiabilityAmount: 0,
        damagedInventoryCount: 0,
        damagedInventoryValue: 0,
        disputesRaised: 0,
        disputesApproved: 0,
        disputesRejected: 0,
        disputesPending: 0,
        payoutBaseAmount: 0,
        payoutHoldAmount: 0,
        payoutDeductionAmount: 0,
        payoutCreditAmount: 0,
        finalPayableAmount: 0,
        adjustmentType: "NO_ACTION",
        settlementStatus: "APPROVED",
        liabilityRate: 0,
        disputeApprovalRate: 0,
        damageRate: 0,
        riskScore: 0,
        riskLevel: "LOW",
        settlementReasons: [],
        recommendedActions: [],
        lastReturnAt: undefined,
        lastUpdatedAt: new Date().toISOString(),
        returnReasonMap: new Map<string, number>()
      } satisfies SellerAccumulator);

    const damagedValue =
      getNumber(item.estimatedLossAmount) ||
      getNumber(item.lossAmount) ||
      getNumber(item.refundAmount);

    existing.damagedInventoryCount += 1;
    existing.damagedInventoryValue += damagedValue;
    existing.sellerLiabilityAmount += damagedValue;

    sellerMap.set(sellerId, existing);
  });

  adjustmentRecords.forEach((record) => {
    const sellerId = normalizeText(record.sellerId);
    const existing = sellerMap.get(sellerId);

    if (!existing) {
      return;
    }

    existing.adjustmentType = record.adjustmentType;
    existing.settlementStatus = record.settlementStatus;
    existing.payoutHoldAmount = record.payoutHoldAmount;
    existing.payoutDeductionAmount = record.payoutDeductionAmount;
    existing.payoutCreditAmount = record.payoutCreditAmount;
    existing.finalPayableAmount = record.finalPayableAmount;
    existing.lastUpdatedAt = record.updatedAt;

    sellerMap.set(sellerId, existing);
  });

  return Array.from(sellerMap.values())
    .map((row) => {
      const riskScore = getRiskScore({
        totalReturns: row.totalReturns,
        sellerLiabilityAmount: row.sellerLiabilityAmount,
        damagedInventoryValue: row.damagedInventoryValue,
        disputesApproved: row.disputesApproved,
        disputesRaised: row.disputesRaised
      });

      const calculatedAdjustmentType = getAdjustmentType({
        riskScore,
        sellerLiabilityAmount: row.sellerLiabilityAmount,
        damagedInventoryValue: row.damagedInventoryValue,
        disputesApproved: row.disputesApproved
      });

      const adjustmentType =
        row.adjustmentType === "NO_ACTION"
          ? calculatedAdjustmentType
          : row.adjustmentType;

      const settlementStatus =
        row.settlementStatus === "APPROVED" && adjustmentType !== "NO_ACTION"
          ? getSettlementStatus(adjustmentType)
          : row.settlementStatus;

      const payoutDeductionAmount =
        row.payoutDeductionAmount > 0
          ? row.payoutDeductionAmount
          : Math.min(row.sellerLiabilityAmount, row.payoutBaseAmount);

      const payoutHoldAmount =
        row.payoutHoldAmount > 0
          ? row.payoutHoldAmount
          : adjustmentType === "PAYOUT_HOLD"
            ? row.payoutBaseAmount
            : 0;

      const payoutCreditAmount = row.payoutCreditAmount;

      const finalPayableAmount = Math.max(
        row.payoutBaseAmount - payoutDeductionAmount - payoutHoldAmount + payoutCreditAmount,
        0
      );

      const liabilityRate =
        row.totalRefundAmount > 0
          ? Math.round((row.sellerLiabilityAmount / row.totalRefundAmount) * 100)
          : 0;

      const disputeApprovalRate =
        row.disputesRaised > 0
          ? Math.round((row.disputesApproved / row.disputesRaised) * 100)
          : 0;

      const damageRate =
        row.totalReturns > 0
          ? Math.round((row.damagedInventoryCount / row.totalReturns) * 100)
          : 0;

      const settlementReasons = buildSettlementReasons({
        totalReturns: row.totalReturns,
        sellerLiabilityAmount: row.sellerLiabilityAmount,
        damagedInventoryValue: row.damagedInventoryValue,
        disputesApproved: row.disputesApproved,
        disputesRejected: row.disputesRejected
      });

      const recommendedActions = buildRecommendedActions({
        adjustmentType,
        settlementStatus
      });

      // Safely strip returnReasonMap without creating an unused variable declaration for ESLint
      const safeRow: Partial<SellerAccumulator> = { ...row };
      delete safeRow.returnReasonMap;

      return {
        ...(safeRow as SellerPayoutSettlementRow),
        payoutDeductionAmount,
        payoutHoldAmount,
        payoutCreditAmount,
        finalPayableAmount,
        adjustmentType,
        settlementStatus,
        liabilityRate,
        disputeApprovalRate,
        damageRate,
        riskScore,
        riskLevel: getRiskLevel(riskScore),
        settlementReasons,
        recommendedActions
      };
    })
    .sort((first, second) => second.riskScore - first.riskScore);
};

const buildSummary = (
  rows: SellerPayoutSettlementRow[]
): SellerPayoutSettlementSummary => {
  return {
    totalSellers: rows.length,
    monitoredSellers: rows.filter((row) => row.totalReturns > 0).length,

    totalReturns: rows.reduce((total, row) => total + row.totalReturns, 0),
    totalRefundAmount: rows.reduce(
      (total, row) => total + row.totalRefundAmount,
      0
    ),
    totalSellerLiabilityAmount: rows.reduce(
      (total, row) => total + row.sellerLiabilityAmount,
      0
    ),
    totalDamagedInventoryValue: rows.reduce(
      (total, row) => total + row.damagedInventoryValue,
      0
    ),
    totalPayoutAdjustmentAmount: rows.reduce(
      (total, row) =>
        total + row.payoutHoldAmount + row.payoutDeductionAmount - row.payoutCreditAmount,
      0
    ),

    pendingSettlements: rows.filter((row) => row.settlementStatus === "PENDING")
      .length,
    underReviewSettlements: rows.filter(
      (row) => row.settlementStatus === "UNDER_REVIEW"
    ).length,
    approvedSettlements: rows.filter((row) => row.settlementStatus === "APPROVED")
      .length,
    settledSettlements: rows.filter((row) => row.settlementStatus === "SETTLED")
      .length,
    rejectedSettlements: rows.filter((row) => row.settlementStatus === "REJECTED")
      .length,
    onHoldSettlements: rows.filter((row) => row.settlementStatus === "ON_HOLD")
      .length,

    lowRiskSellers: rows.filter((row) => row.riskLevel === "LOW").length,
    mediumRiskSellers: rows.filter((row) => row.riskLevel === "MEDIUM").length,
    highRiskSellers: rows.filter((row) => row.riskLevel === "HIGH").length,
    criticalRiskSellers: rows.filter((row) => row.riskLevel === "CRITICAL")
      .length
  };
};

const buildAdjustmentRecord = (
  payload: SellerPayoutSettlementActionPayload
): SellerPayoutAdjustmentRecord => {
  const now = new Date().toISOString();

  const nextSettlementStatus = (() => {
    if (payload.action === "APPROVE_SETTLEMENT") {
      return "APPROVED" as const;
    }

    if (payload.action === "HOLD_PAYOUT") {
      return "ON_HOLD" as const;
    }

    if (payload.action === "RELEASE_PAYOUT") {
      return "APPROVED" as const;
    }

    if (payload.action === "MARK_SETTLED") {
      return "SETTLED" as const;
    }

    if (payload.action === "REJECT_SETTLEMENT") {
      return "REJECTED" as const;
    }

    return "UNDER_REVIEW" as const;
  })();

  const adjustmentType: SellerPayoutAdjustmentType = (() => {
    if (payload.action === "HOLD_PAYOUT") {
      return "PAYOUT_HOLD";
    }

    if (payload.action === "RELEASE_PAYOUT") {
      return "PAYOUT_RELEASE";
    }

    if (payload.action === "MARK_SETTLED") {
      return "PAYOUT_DEDUCTION";
    }

    if (payload.action === "REJECT_SETTLEMENT") {
      return "NO_ACTION";
    }

    return "MANUAL_REVIEW";
  })();

  return {
    id: createId("SPA"),
    adjustmentId: createId("SPADJ"),
    sellerId: payload.sellerId,
    sellerName: payload.sellerName,
    adjustmentType,
    settlementStatus: nextSettlementStatus,
    payoutBaseAmount: payload.payoutBaseAmount,
    payoutHoldAmount: payload.payoutHoldAmount,
    payoutDeductionAmount: payload.payoutDeductionAmount,
    payoutCreditAmount: payload.payoutCreditAmount,
    finalPayableAmount: payload.finalPayableAmount,
    reason: payload.reason,
    createdBy: "Admin",
    createdAt: now,
    updatedAt: now
  };
};

export const sellerPayoutSettlementService = {
  getDashboardData: async (): Promise<SellerPayoutSettlementDashboardData> => {
    const [sellers, requests, disputes, damagedInventory, adjustmentRecords] =
      await Promise.all([
        safeGetArray<SellerLike>(SELLERS_ENDPOINT),
        safeGetArray<ReturnRequest>(RETURN_REQUESTS_ENDPOINT),
        safeGetArray<SellerReturnDisputeLike>(SELLER_RETURN_DISPUTES_ENDPOINT),
        safeGetArray<DamagedInventoryLike>(DAMAGED_RETURN_INVENTORY_ENDPOINT),
        safeGetArray<SellerPayoutAdjustmentRecord>(
          SELLER_PAYOUT_ADJUSTMENTS_ENDPOINT
        )
      ]);

    const rows = buildSellerRows({
      sellers,
      requests,
      disputes,
      damagedInventory,
      adjustmentRecords
    });

    return {
      summary: buildSummary(rows),
      rows,
      adjustmentRecords
    };
  },

  createAdjustmentRecord: async (
    payload: SellerPayoutSettlementActionPayload
  ): Promise<SellerPayoutAdjustmentRecord> => {
    const adjustmentRecord = buildAdjustmentRecord(payload);

    return apiClient.post<
      SellerPayoutAdjustmentRecord,
      SellerPayoutAdjustmentRecord
    >(SELLER_PAYOUT_ADJUSTMENTS_ENDPOINT, adjustmentRecord);
  },

  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount || 0);
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