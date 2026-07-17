import type { ProductCategory } from "./product";

export interface Warehouse {
  id: number;
  name: string;
  city: string;
  state: string;
  active: boolean;
}

export interface DeliveryZone {
  id: number;
  zone: string;
  prefixes: string[];
  warehouseId: number;
  deliveryDays: number;
  cashOnDelivery: boolean;
  freeDelivery: boolean;
  active: boolean;
}

export interface CreateZoneInput {
  zone: string;
  prefixes: string[];
  warehouseId: number;
  deliveryDays: number;
  cashOnDelivery: boolean;
  freeDelivery: boolean;
  active: boolean;
}

export interface CreateWarehouseInput {
  name: string;
  city: string;
  state: string;
  active: boolean;
}

export interface DeliverySlaRule {
  id: number;
  category: ProductCategory;
  handlingDays: number;
  additionalDays: number;
  priority: number;
  active: boolean;
}

export interface CreateDeliverySlaRuleInput {
  category: ProductCategory;
  handlingDays: number;
  additionalDays: number;
  priority: number;
  active: boolean;
}

export interface SellerFulfillmentMapping {
  id: number;
  sellerId: string;
  sellerName: string;
  warehouseIds: number[];
  preferredWarehouseId: number;
  active: boolean;
}

export interface CreateSellerFulfillmentInput {
  sellerId: string;
  sellerName: string;
  warehouseIds: number[];
  preferredWarehouseId: number;
  active: boolean;
}

export interface DeliveryPromiseSnapshot {
  pincode: string;
  zoneId: number;
  zoneName: string;
  warehouseId?: number;
  warehouseName?: string;
  sellerId?: string;
  sellerName?: string;
  estimatedDeliveryDate: string;
  finalDeliveryDays: number;
  cashOnDelivery: boolean;
  freeDelivery: boolean;
  fulfillmentMessage: string;
  categorySlaApplied?: {
    category: string;
    handlingDays: number;
    additionalDays: number;
  };
}