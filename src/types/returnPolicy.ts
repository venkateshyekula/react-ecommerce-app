import type { ProductCategory } from "./product";
import type { Order } from "./order";

export interface ReturnPolicyRule {
  id: number;
  category: ProductCategory;
  returnWindowDays: number;
  returnable: boolean;
  replacementAllowed: boolean;
  active: boolean;
}

export interface CreateReturnPolicyRuleInput {
  category: ProductCategory;
  returnWindowDays: number;
  returnable: boolean;
  replacementAllowed: boolean;
  active: boolean;
}

export interface ReturnEligibilityResult {
  eligible: boolean;
  replacementAllowed: boolean;
  returnWindowDays: number;
  returnDeadline?: string;
  message: string;
  reason?: string;
}

export type ReturnEligibilityOrder = Pick<
  Order,
  | "orderStatus"
  | "fulfillmentStatus"
  | "deliveryPromise"
  | "trackingEvents"
  | "items"
>;