export type ReturnItemConditionGrade = "A" | "B" | "C" | "D";

export type InventoryRestockStatus =
  | "PENDING"
  | "RESTOCKED"
  | "OPEN_BOX"
  | "DAMAGED_HOLD"
  | "BLOCKED"
  | "DISPUTE_PENDING";

export type InventoryRestockType =
  | "SELLABLE"
  | "OPEN_BOX"
  | "DAMAGED"
  | "HOLD"
  | "BLOCKED";

export interface InventoryRestockLog {
  id: string;
  restockId: string;

  returnRequestId: string;
  returnRequestDbId?: string;
  orderId: string;

  productId: string;
  productName: string;

  sellerId: string;
  sellerName: string;

  quantity: number;

  restockStatus: InventoryRestockStatus;
  restockType: InventoryRestockType;

  qcStatus?: string;
  conditionGrade?: ReturnItemConditionGrade;

  previousStock?: number;
  newStock?: number;

  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OpenBoxInventoryItem {
  id: string;
  openBoxId: string;

  returnRequestId: string;
  orderId: string;

  productId: string;
  productName: string;

  sellerId: string;
  sellerName: string;

  quantity: number;
  conditionGrade: ReturnItemConditionGrade;

  originalPrice: number;
  openBoxPrice: number;

  reason: string;
  status: "AVAILABLE" | "SOLD" | "HOLD";

  createdAt: string;
  updatedAt?: string;
}

export interface DamagedReturnInventoryItem {
  id: string;
  damageId: string;

  returnRequestId: string;
  orderId: string;

  productId: string;
  productName: string;

  sellerId: string;
  sellerName: string;

  quantity: number;
  damageType: string;
  conditionGrade: ReturnItemConditionGrade;

  estimatedLoss: number;
  status: "HOLD" | "DISPOSED" | "SELLER_DISPUTE" | "SCRAP";

  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateInventoryRestockLogPayload {
  returnRequestId: string;
  returnRequestDbId?: string;
  orderId: string;

  productId: string;
  productName: string;

  sellerId: string;
  sellerName: string;

  quantity: number;

  restockStatus: InventoryRestockStatus;
  restockType: InventoryRestockType;

  qcStatus?: string;
  conditionGrade?: ReturnItemConditionGrade;

  previousStock?: number;
  newStock?: number;

  remarks?: string;
}