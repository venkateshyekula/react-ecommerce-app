import type { ProductCategory } from "../types/product";
import type {
  ReturnEligibilityOrder,
  ReturnEligibilityResult,
  ReturnPolicyRule
} from "../types/returnPolicy";

const getDeliveredDate = (order: ReturnEligibilityOrder): string | undefined => {
  const deliveredEvent = order.trackingEvents?.find(
    (event) => event.status === "Delivered" && event.timestamp
  );

  if (deliveredEvent?.timestamp) {
    return deliveredEvent.timestamp;
  }

  return order.deliveryPromise?.estimatedDeliveryDate;
};

const getFirstOrderCategory = (
  order: ReturnEligibilityOrder
): ProductCategory | undefined => {
  const firstItem = order.items[0] as unknown as {
    category?: ProductCategory;
  };

  return firstItem?.category;
};

export const getReturnEligibility = (
  order: ReturnEligibilityOrder,
  rules: ReturnPolicyRule[]
): ReturnEligibilityResult => {
  const category = getFirstOrderCategory(order);

  if (!category) {
    return {
      eligible: false,
      replacementAllowed: false,
      returnWindowDays: 0,
      message: "Return eligibility cannot be verified.",
      reason: "Product category is missing from order item."
    };
  }

  const rule = rules.find(
    (item) => item.active && item.category === category
  );

  if (!rule) {
    return {
      eligible: false,
      replacementAllowed: false,
      returnWindowDays: 0,
      message: "Return policy is unavailable for this category.",
      reason: "No active return policy rule found."
    };
  }

  if (!rule.returnable) {
    return {
      eligible: false,
      replacementAllowed: rule.replacementAllowed,
      returnWindowDays: rule.returnWindowDays,
      message: `${category} products are not returnable.`,
      reason: "Category marked as non-returnable."
    };
  }

  const isDelivered =
    order.orderStatus === "Delivered" ||
    order.fulfillmentStatus === "DELIVERED";

  if (!isDelivered) {
    return {
      eligible: false,
      replacementAllowed: rule.replacementAllowed,
      returnWindowDays: rule.returnWindowDays,
      message: "Return is available after delivery.",
      reason: "Order is not delivered yet."
    };
  }

  const deliveredDateValue = getDeliveredDate(order);

  if (!deliveredDateValue) {
    return {
      eligible: false,
      replacementAllowed: rule.replacementAllowed,
      returnWindowDays: rule.returnWindowDays,
      message: "Delivered date is unavailable.",
      reason: "Unable to calculate return deadline."
    };
  }

  const deliveredDate = new Date(deliveredDateValue);
  const deadline = new Date(deliveredDate);

  deadline.setDate(deadline.getDate() + rule.returnWindowDays);

  const isWithinWindow = new Date().getTime() <= deadline.getTime();

  const formattedDeadline = deadline.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  if (!isWithinWindow) {
    return {
      eligible: false,
      replacementAllowed: rule.replacementAllowed,
      returnWindowDays: rule.returnWindowDays,
      returnDeadline: deadline.toISOString(),
      message: `Return window closed on ${formattedDeadline}.`,
      reason: "Return window expired."
    };
  }

  return {
    eligible: true,
    replacementAllowed: rule.replacementAllowed,
    returnWindowDays: rule.returnWindowDays,
    returnDeadline: deadline.toISOString(),
    message: `Return available until ${formattedDeadline}.`
  };
};