import { apiClient } from "./apiClient";
import type { ReturnRequest } from "../types/returnRequest";
import type {
  CreateInventoryRestockLogPayload,
  DamagedReturnInventoryItem,
  InventoryRestockLog,
  OpenBoxInventoryItem,
  ReturnItemConditionGrade
} from "../types/inventoryRestock";
import type { InventoryRestockDecisionType } from "../utils/inventoryRestockWorkflowUtils";
import { assertValidDeleteId } from "../utils/deleteSafetyUtils";

const RETURN_REQUESTS_ENDPOINT = "/returnRequests";
const PRODUCTS_ENDPOINT = "/products";
const INVENTORY_RESTOCK_LOGS_ENDPOINT = "/inventoryRestockLogs";
const OPEN_BOX_INVENTORY_ENDPOINT = "/openBoxInventory";
const DAMAGED_RETURN_INVENTORY_ENDPOINT = "/damagedReturnInventory";

type ProductLike = {
  id: string;
  stock?: number;
  inventory?: number;
  quantity?: number;
  [key: string]: unknown;
};

type CreateRestockDecisionInput = {
  request: ReturnRequest;
  productId: string;
  productName: string;
  sellerId: string;
  sellerName: string;
  quantity: number;
  price: number;
  decisionType: InventoryRestockDecisionType;
  conditionGrade: ReturnItemConditionGrade;
  remarks?: string;
};

const generateRestockDbId = (): string => {
  return `restock-log-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const generateRestockId = (): string => {
  return `RSTK-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${Date.now()}`;
};

const generateOpenBoxDbId = (): string => {
  return `open-box-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const generateDamageDbId = (): string => {
  return `damaged-return-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const getSafeTime = (dateStr?: string | null): number => {
  if (!dateStr) return 0;
  const time = new Date(dateStr).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const sortLogsByLatest = (logs: InventoryRestockLog[]): InventoryRestockLog[] => {
  return [...logs].sort(
    (firstLog, secondLog) =>
      getSafeTime(secondLog.createdAt) - getSafeTime(firstLog.createdAt)
  );
};

const getProductStockValue = (product: ProductLike): number | undefined => {
  if (typeof product.stock === "number") {
    return product.stock;
  }

  if (typeof product.inventory === "number") {
    return product.inventory;
  }

  if (typeof product.quantity === "number") {
    return product.quantity;
  }

  return undefined;
};

const buildStockPatch = (
  product: ProductLike,
  newStock: number
): Partial<ProductLike> => {
  if (typeof product.stock === "number") {
    return { stock: newStock };
  }

  if (typeof product.inventory === "number") {
    return { inventory: newStock };
  }

  if (typeof product.quantity === "number") {
    return { quantity: newStock };
  }

  return {};
};

export const inventoryRestockService = {
  getReturnRequests: async (): Promise<ReturnRequest[]> => {
    const requests = await apiClient.get<ReturnRequest[]>(
      RETURN_REQUESTS_ENDPOINT
    );

    return Array.isArray(requests) ? requests : [];
  },

  getRestockLogs: async (): Promise<InventoryRestockLog[]> => {
    const logs = await apiClient.get<InventoryRestockLog[]>(
      INVENTORY_RESTOCK_LOGS_ENDPOINT
    );

    return sortLogsByLatest(Array.isArray(logs) ? logs : []);
  },

  getRestockLogsBySellerId: async (
    sellerId: string
  ): Promise<InventoryRestockLog[]> => {
    if (!sellerId?.trim()) {
      return inventoryRestockService.getRestockLogs();
    }

    const endpoint = `${INVENTORY_RESTOCK_LOGS_ENDPOINT}?sellerId=${encodeURIComponent(
      sellerId.trim()
    )}`;

    const logs = await apiClient.get<InventoryRestockLog[]>(endpoint);
    const safeLogs = Array.isArray(logs) ? logs : [];

    return sortLogsByLatest(
      safeLogs.filter((log) => log.sellerId === sellerId.trim())
    );
  },

  getRestockLogsByReturnRequestId: async (
    returnRequestId: string
  ): Promise<InventoryRestockLog[]> => {
    if (!returnRequestId?.trim()) {
      return [];
    }

    const endpoint = `${INVENTORY_RESTOCK_LOGS_ENDPOINT}?returnRequestId=${encodeURIComponent(
      returnRequestId.trim()
    )}`;

    const logs = await apiClient.get<InventoryRestockLog[]>(endpoint);
    const safeLogs = Array.isArray(logs) ? logs : [];

    return sortLogsByLatest(
      safeLogs.filter(
        (log) => log.returnRequestId === returnRequestId.trim()
      )
    );
  },

  createRestockLog: async (
    payload: CreateInventoryRestockLogPayload
  ): Promise<InventoryRestockLog> => {
    const now = new Date().toISOString();

    const log: InventoryRestockLog = {
      ...payload,
      id: generateRestockDbId(),
      restockId: generateRestockId(),
      createdAt: now,
      updatedAt: now
    };

    return apiClient.post<InventoryRestockLog, InventoryRestockLog>(
      INVENTORY_RESTOCK_LOGS_ENDPOINT,
      log
    );
  },

  createOpenBoxInventoryItem: async (
    payload: Omit<OpenBoxInventoryItem, "id" | "openBoxId" | "createdAt">
  ): Promise<OpenBoxInventoryItem> => {
    const item: OpenBoxInventoryItem = {
      ...payload,
      id: generateOpenBoxDbId(),
      openBoxId: `OBX-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    return apiClient.post<OpenBoxInventoryItem, OpenBoxInventoryItem>(
      OPEN_BOX_INVENTORY_ENDPOINT,
      item
    );
  },

  createDamagedInventoryItem: async (
    payload: Omit<DamagedReturnInventoryItem, "id" | "damageId" | "createdAt">
  ): Promise<DamagedReturnInventoryItem> => {
    const item: DamagedReturnInventoryItem = {
      ...payload,
      id: generateDamageDbId(),
      damageId: `DMG-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    return apiClient.post<DamagedReturnInventoryItem, DamagedReturnInventoryItem>(
      DAMAGED_RETURN_INVENTORY_ENDPOINT,
      item
    );
  },

  increaseProductStockIfPossible: async ({
    productId,
    quantity
  }: {
    productId: string;
    quantity: number;
  }): Promise<{
    previousStock?: number;
    newStock?: number;
  }> => {
    try {
      const product = await apiClient.get<ProductLike>(
        `${PRODUCTS_ENDPOINT}/${encodeURIComponent(productId)}`
      );

      const previousStock = getProductStockValue(product);

      if (typeof previousStock !== "number") {
        return {};
      }

      const newStock = previousStock + quantity;
      const patchPayload = buildStockPatch(product, newStock);

      if (Object.keys(patchPayload).length === 0) {
        return {};
      }

      await apiClient.patch<ProductLike, Partial<ProductLike>>(
        `${PRODUCTS_ENDPOINT}/${encodeURIComponent(productId)}`,
        patchPayload
      );

      return {
        previousStock,
        newStock
      };
    } catch {
      return {};
    }
  },

  createRestockDecision: async ({
    request,
    productId,
    productName,
    sellerId,
    sellerName,
    quantity,
    price,
    decisionType,
    conditionGrade,
    remarks
  }: CreateRestockDecisionInput): Promise<InventoryRestockLog> => {
    const returnRequestId =
      request.returnRequestId ?? request.requestId ?? request.id;

    if (decisionType === "SELLABLE") {
      const stockResult =
        await inventoryRestockService.increaseProductStockIfPossible({
          productId,
          quantity
        });

      return inventoryRestockService.createRestockLog({
        returnRequestId,
        returnRequestDbId: request.id,
        orderId: request.orderId,
        productId,
        productName,
        sellerId,
        sellerName,
        quantity,
        restockStatus: "RESTOCKED",
        restockType: "SELLABLE",
        qcStatus: request.qualityCheckStatus,
        conditionGrade,
        previousStock: stockResult.previousStock,
        newStock: stockResult.newStock,
        remarks:
          remarks ??
          "QC passed. Product restored to sellable inventory after return."
      });
    }

    if (decisionType === "OPEN_BOX") {
      await inventoryRestockService.createOpenBoxInventoryItem({
        returnRequestId,
        orderId: request.orderId,
        productId,
        productName,
        sellerId,
        sellerName,
        quantity,
        conditionGrade,
        originalPrice: price,
        openBoxPrice: Math.round(price * 0.9),
        reason: remarks ?? "Returned item moved to open-box inventory.",
        status: "AVAILABLE"
      });

      return inventoryRestockService.createRestockLog({
        returnRequestId,
        returnRequestDbId: request.id,
        orderId: request.orderId,
        productId,
        productName,
        sellerId,
        sellerName,
        quantity,
        restockStatus: "OPEN_BOX",
        restockType: "OPEN_BOX",
        qcStatus: request.qualityCheckStatus,
        conditionGrade,
        remarks: remarks ?? "Product moved to open-box inventory."
      });
    }

    if (decisionType === "DAMAGED_HOLD") {
      await inventoryRestockService.createDamagedInventoryItem({
        returnRequestId,
        orderId: request.orderId,
        productId,
        productName,
        sellerId,
        sellerName,
        quantity,
        damageType: "RETURN_QC_FAILED",
        conditionGrade,
        estimatedLoss: price * quantity,
        status: "HOLD",
        remarks: remarks ?? "Product moved to damaged return hold."
      });

      return inventoryRestockService.createRestockLog({
        returnRequestId,
        returnRequestDbId: request.id,
        orderId: request.orderId,
        productId,
        productName,
        sellerId,
        sellerName,
        quantity,
        restockStatus: "DAMAGED_HOLD",
        restockType: "DAMAGED",
        qcStatus: request.qualityCheckStatus,
        conditionGrade,
        remarks: remarks ?? "QC failed. Product blocked from sellable stock."
      });
    }

    return inventoryRestockService.createRestockLog({
      returnRequestId,
      returnRequestDbId: request.id,
      orderId: request.orderId,
      productId,
      productName,
      sellerId,
      sellerName,
      quantity,
      restockStatus: "BLOCKED",
      restockType: "BLOCKED",
      qcStatus: request.qualityCheckStatus,
      conditionGrade,
      remarks: remarks ?? "Restock blocked due to pending dispute or decision."
    });
  },

  deleteRestockLog: async (restockLogId: string): Promise<void> => {
    assertValidDeleteId({
      entityType: "inventoryRestockLog",
      id: restockLogId
    });

    await apiClient.delete<void>(
      `${INVENTORY_RESTOCK_LOGS_ENDPOINT}/${encodeURIComponent(restockLogId)}`
    );
  }
};