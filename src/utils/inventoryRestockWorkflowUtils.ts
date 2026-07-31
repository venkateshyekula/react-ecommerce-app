import type { ReturnRequest } from "../types/returnRequest";
import type {
  InventoryRestockStatus,
  InventoryRestockType,
  ReturnItemConditionGrade
} from "../types/inventoryRestock";
import type { SellerReturnDispute } from "../types/sellerReturnDispute";

export type ReturnRestockItem = {
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

export type InventoryRestockDecisionType =
  | "SELLABLE"
  | "OPEN_BOX"
  | "DAMAGED_HOLD"
  | "BLOCKED";

export const getReturnDisplayId = (request: ReturnRequest): string => {
  return request.returnRequestId ?? request.requestId ?? request.id;
};

export const normalizeRestockStatus = (value?: string | null): string => {
  return value?.trim().toUpperCase() ?? "";
};

export const getReturnItemsForRestock = (
  request: ReturnRequest
): ReturnRestockItem[] => {
  return (request.items ?? []).map((item) => ({
    productId: item.productId,
    name: item.name,
    brand: item.brand,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.subtotal,
    image: item.image,
    category: item.category,
    sellerId: item.sellerId,
    sellerName: item.sellerName,
    selectedSize: item.selectedSize
  }));
};

export const hasActiveSellerDisputeForItem = ({
  disputes,
  returnRequestDbId,
  productId
}: {
  disputes: SellerReturnDispute[];
  returnRequestDbId: string;
  productId: string;
}): boolean => {
  if (!Array.isArray(disputes) || !disputes.length) {
    return false;
  }

  return disputes.some((dispute) => {
    const status = normalizeRestockStatus(dispute.status);
    return (
      dispute.returnRequestDbId === returnRequestDbId &&
      dispute.productId === productId &&
      !["APPROVED", "REJECTED", "CANCELLED"].includes(status)
    );
  });
};

export const hasResolvedSellerDisputeForItem = ({
  disputes,
  returnRequestDbId,
  productId
}: {
  disputes: SellerReturnDispute[];
  returnRequestDbId: string;
  productId: string;
}): boolean => {
  if (!Array.isArray(disputes) || !disputes.length) {
    return false;
  }

  return disputes.some((dispute) => {
    const status = normalizeRestockStatus(dispute.status);
    return (
      dispute.returnRequestDbId === returnRequestDbId &&
      dispute.productId === productId &&
      ["APPROVED", "REJECTED"].includes(status)
    );
  });
};

export const getSuggestedConditionGrade = (
  request: ReturnRequest
): ReturnItemConditionGrade => {
  const qcStatus = normalizeRestockStatus(request.qualityCheckStatus);
  const returnStatus = normalizeRestockStatus(request.status);

  if (
    ["PASSED", "APPROVED", "COMPLETED"].includes(qcStatus) ||
    ["REFUND_COMPLETED", "COMPLETED"].includes(returnStatus)
  ) {
    return "A";
  }

  if (["IN_PROGRESS", "PENDING", "PARTIAL_PASS"].includes(qcStatus)) {
    return "B";
  }

  if (
    ["FAILED", "REJECTED", "QUALITY_CHECK_FAILED", "QC_REJECTED"].includes(
      qcStatus
    )
  ) {
    return "D";
  }

  return "C";
};

export const getSuggestedRestockDecision = ({
  request,
  hasActiveDispute
}: {
  request: ReturnRequest;
  hasActiveDispute: boolean;
}): {
  decisionType: InventoryRestockDecisionType;
  restockStatus: InventoryRestockStatus;
  restockType: InventoryRestockType;
  conditionGrade: ReturnItemConditionGrade;
  label: string;
  description: string;
} => {
  const qcStatus = normalizeRestockStatus(request.qualityCheckStatus);
  const returnStatus = normalizeRestockStatus(request.status);
  const conditionGrade = getSuggestedConditionGrade(request);

  if (hasActiveDispute) {
    return {
      decisionType: "BLOCKED",
      restockStatus: "DISPUTE_PENDING",
      restockType: "HOLD",
      conditionGrade,
      label: "Dispute Pending",
      description: "Restock is blocked because seller dispute is still active."
    };
  }

  if (
    ["PASSED", "APPROVED", "COMPLETED"].includes(qcStatus) ||
    ["REFUND_COMPLETED", "COMPLETED"].includes(returnStatus)
  ) {
    return {
      decisionType: "SELLABLE",
      restockStatus: "RESTOCKED",
      restockType: "SELLABLE",
      conditionGrade: "A",
      label: "Restock as Sellable",
      description: "QC passed. Product can be added back to sellable stock."
    };
  }

  if (conditionGrade === "B") {
    return {
      decisionType: "OPEN_BOX",
      restockStatus: "RESTOCKED",
      restockType: "OPEN_BOX",
      conditionGrade: "B",
      label: "Restock as Open Box",
      description: "QC passed with minor notes. Product can be listed as Open Box stock."
    };
  }

  if (
    ["FAILED", "REJECTED", "QUALITY_CHECK_FAILED", "QC_REJECTED"].includes(
      qcStatus
    )
  ) {
    return {
      decisionType: "DAMAGED_HOLD",
      restockStatus: "DAMAGED_HOLD",
      restockType: "DAMAGED",
      conditionGrade: "D",
      label: "Move to Damaged Hold",
      description: "QC failed. Product should not be returned to sellable stock."
    };
  }

  return {
    decisionType: "BLOCKED",
    restockStatus: "PENDING",
    restockType: "HOLD",
    conditionGrade,
    label: "Decision Pending",
    description: "Return is not ready for final restock decision."
  };
};

export const formatInventoryCurrency = (amount?: number | null): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount ?? 0);
};

export const formatInventoryLabel = (value?: string | null): string => {
  if (!value) {
    return "Not Available";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};