import type {
  DeliveryPromiseSnapshot,
  DeliverySlaRule,
  DeliveryZone,
  SellerFulfillmentMapping,
  Warehouse
} from "../types/delivery";
import type { ProductCategory } from "../types/product";

interface BuildDeliveryEstimateParams {
  pincode: string;
  product: DeliveryEstimateProduct;
  zones: DeliveryZone[];
  warehouses: Warehouse[];
  slaRules: DeliverySlaRule[];
  sellerMappings: SellerFulfillmentMapping[];
}

export interface DeliveryEstimateProduct {
  category: ProductCategory;
  sellerId?: string;
  sellerName?: string;
}

const getEstimatedDeliveryDate = (deliveryDays: number): string => {
  const deliveryDate = new Date();

  deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);

  return deliveryDate.toISOString();
};

export const buildDeliveryPromiseSnapshot = ({
  pincode,
  product,
  zones,
  warehouses,
  slaRules,
  sellerMappings
}: BuildDeliveryEstimateParams): DeliveryPromiseSnapshot | null => {
  const prefix = pincode.substring(0, 2);

  const matchedZone = zones.find(
    (zone) => zone.active && zone.prefixes.includes(prefix)
  );

  if (!matchedZone) {
    return null;
  }

  const warehouseMap = warehouses.reduce<Record<number, Warehouse>>(
    (result, warehouse) => {
      result[warehouse.id] = warehouse;
      return result;
    },
    {}
  );

  const activeSlaRule =
    slaRules
      .filter((rule) => rule.active && rule.category === product.category)
      .sort(
        (firstRule, secondRule) => firstRule.priority - secondRule.priority
      )[0] ?? undefined;

  const activeSellerMapping = product.sellerId
    ? sellerMappings.find(
        (mapping) => mapping.active && mapping.sellerId === product.sellerId
      )
    : undefined;

  const zoneWarehouse = warehouseMap[matchedZone.warehouseId];

  let selectedWarehouse = zoneWarehouse;
  let additionalSellerDays = 0;
  let fulfillmentMessage = "Fulfilled through zone warehouse routing.";

  if (activeSellerMapping) {
    if (activeSellerMapping.warehouseIds.includes(matchedZone.warehouseId)) {
      selectedWarehouse = zoneWarehouse;
      fulfillmentMessage = "Seller ships from the mapped zone warehouse.";
    } else {
      const preferredWarehouse =
        warehouseMap[activeSellerMapping.preferredWarehouseId];

      if (preferredWarehouse?.active) {
        selectedWarehouse = preferredWarehouse;
        additionalSellerDays = 1;
        fulfillmentMessage =
          "Preferred seller warehouse applied for this delivery.";
      } else {
        const fallbackWarehouseId = activeSellerMapping.warehouseIds.find(
          (warehouseId) => warehouseMap[warehouseId]?.active
        );

        const fallbackWarehouse = fallbackWarehouseId
          ? warehouseMap[fallbackWarehouseId]
          : undefined;

        if (fallbackWarehouse) {
          selectedWarehouse = fallbackWarehouse;
          additionalSellerDays = 2;
          fulfillmentMessage = "Fallback active seller warehouse applied.";
        }
      }
    }
  }

  const handlingDays = activeSlaRule?.handlingDays ?? 0;
  const additionalDays = activeSlaRule?.additionalDays ?? 0;

  const finalDeliveryDays =
    matchedZone.deliveryDays + handlingDays + additionalDays + additionalSellerDays;

  return {
    pincode,
    zoneId: matchedZone.id,
    zoneName: matchedZone.zone,
    warehouseId: selectedWarehouse?.id,
    warehouseName: selectedWarehouse?.name,
    sellerId: product.sellerId,
    sellerName: product.sellerName,
    estimatedDeliveryDate: getEstimatedDeliveryDate(finalDeliveryDays),
    finalDeliveryDays,
    cashOnDelivery: matchedZone.cashOnDelivery,
    freeDelivery: matchedZone.freeDelivery,
    fulfillmentMessage,
    categorySlaApplied: activeSlaRule
      ? {
          category: activeSlaRule.category,
          handlingDays: activeSlaRule.handlingDays,
          additionalDays: activeSlaRule.additionalDays
        }
      : undefined
  };
};

export const formatDeliveryPromiseDate = (dateValue: string): string => {
  return new Date(dateValue).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};