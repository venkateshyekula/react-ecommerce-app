import type { ReturnRequest } from "../types/returnRequest";
import type {
  InventoryRestockStatus,
  InventoryRestockType,
  ReturnItemConditionGrade
} from "../types/inventoryRestock";
import type { SellerReturnDispute } from "../types/sellerReturnDispute";

export type SellerReturnItem = {
  productId: string;
  name: string;
  brand?: string;
  price: number;
  quantity: number;
  subtotal?: number;
  image?: string;
  category?: string;
  sellerId?: string;
  sellerName?: string;
  selectedSize?: string;
};

const PROBLEMATIC_QC_STATUSES = new Set([
  "FAILED",
  "REJECTED",
  "QC_REJECTED",
  "QUALITY_CHECK_FAILED",
  "MISMATCH",
  "DAMAGED",
  "MISSING_ACCESSORY"
]);

const PASSED_QC_STATUSES = new Set(["PASSED", "APPROVED", "COMPLETED"]);

export const getReturnDisplayId = (request: ReturnRequest): string => {
  return request.returnRequestId ?? request.requestId ?? request.id;
};

export const getSellerItemsFromReturn = (
  request: ReturnRequest,
  sellerId: string
): SellerReturnItem[] => {
  return (request.items ?? []).filter((item) => item.sellerId === sellerId);
};

export const hasSellerItemsInReturn = (
  request: ReturnRequest,
  sellerId: string
): boolean => {
  return getSellerItemsFromReturn(request, sellerId).length > 0;
};

export const getSellerNameFromReturn = (
  request: ReturnRequest,
  sellerId: string
): string => {
  const item = (request.items ?? []).find(
    (currentItem) => currentItem.sellerId === sellerId
  );
  return item?.sellerName ?? "Seller";
};

export const isProblematicQcStatus = (status?: string | null): boolean => {
  if (!status) return false;
  const normalizedStatus = status.trim().toUpperCase();
  return PROBLEMATIC_QC_STATUSES.has(normalizedStatus);
};

export const canSellerRaiseReturnDispute = ({
  request,
  productId,
  sellerId,
  disputes
}: {
  request: ReturnRequest;
  productId: string;
  sellerId: string;
  disputes: SellerReturnDispute[];
}): boolean => {
  const belongsToSeller = (request.items ?? []).some(
    (item) => item.productId === productId && item.sellerId === sellerId
  );

  if (!belongsToSeller) {
    return false;
  }

  // Check against request.id and display ID variations
  const displayId = getReturnDisplayId(request);
  const existingActiveDispute = disputes.some((dispute) => {
    const isMatchingReturn =
      dispute.returnRequestDbId === request.id ||
      dispute.returnRequestDbId === displayId ||
      dispute.returnRequestId === displayId;

    return (
      isMatchingReturn &&
      dispute.productId === productId &&
      dispute.sellerId === sellerId &&
      !["REJECTED", "CANCELLED"].includes(
        dispute.status?.trim().toUpperCase() ?? ""
      )
    );
  });

  if (existingActiveDispute) {
    return false;
  }

  const normalizedReturnStatus = request.status?.trim().toUpperCase() ?? "";
  const normalizedRefundStatus =
    request.refundStatus?.trim().toUpperCase() ?? "";

  if (normalizedReturnStatus === "CLOSED") {
    return false;
  }

  if (normalizedRefundStatus === "COMPLETED") {
    return false;
  }

  return isProblematicQcStatus(request.qualityCheckStatus);
};

export const getRestockDecision = ({
  qcStatus,
  conditionGrade,
  hasPendingDispute
}: {
  qcStatus?: string | null;
  conditionGrade?: ReturnItemConditionGrade;
  hasPendingDispute?: boolean;
}): {
  restockStatus: InventoryRestockStatus;
  restockType: InventoryRestockType;
  label: string;
} => {
  if (hasPendingDispute) {
    return {
      restockStatus: "DISPUTE_PENDING",
      restockType: "HOLD",
      label: "Restock blocked due to seller dispute"
    };
  }

  const normalizedQcStatus = qcStatus?.trim().toUpperCase() ?? "";

  if (PASSED_QC_STATUSES.has(normalizedQcStatus)) {
    if (conditionGrade === "A") {
      return {
        restockStatus: "RESTOCKED",
        restockType: "SELLABLE",
        label: "Restock as sellable inventory"
      };
    }

    // Default passed QC items with B grade or missing grade to open box
    return {
      restockStatus: "OPEN_BOX",
      restockType: "OPEN_BOX",
      label: "Move to open-box inventory"
    };
  }

  if (PROBLEMATIC_QC_STATUSES.has(normalizedQcStatus)) {
    return {
      restockStatus: "DAMAGED_HOLD",
      restockType: "DAMAGED",
      label: "Move to damaged return hold"
    };
  }

  return {
    restockStatus: "PENDING",
    restockType: "HOLD",
    label: "Restock decision pending"
  };
};

export const formatReturnCurrency = (amount?: number | null): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount ?? 0);
};

export const formatReturnLabel = (value?: string | null): string => {
  if (!value) {
    return "Not Available";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};