import type { FulfillmentStatus, OrderStatus } from "../types/order";

export interface FulfillmentTimelineStep {
  key: FulfillmentStatus;
  label: string;
  description: string;
  icon: string;
}

export const fulfillmentTimelineSteps: FulfillmentTimelineStep[] = [
  {
    key: "PENDING",
    label: "Order Received",
    description: "Your order has been received and is waiting for allocation.",
    icon: "bi bi-hourglass-split"
  },
  {
    key: "ALLOCATED",
    label: "Warehouse Allocated",
    description: "A fulfillment center has been assigned for your order.",
    icon: "bi bi-building"
  },
  {
    key: "PACKED",
    label: "Packed",
    description: "Your order has been packed and is ready to ship.",
    icon: "bi bi-box-seam"
  },
  {
    key: "SHIPPED",
    label: "Shipped",
    description: "Your order has been shipped from the fulfillment center.",
    icon: "bi bi-truck"
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    description: "Your order is out for delivery today.",
    icon: "bi bi-geo-alt"
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    description: "Your order has been delivered successfully.",
    icon: "bi bi-check2-circle"
  },
  {
    key: "FAILED",
    label: "Delivery Issue",
    description: "There was an issue with delivery. Support may contact you.",
    icon: "bi bi-exclamation-triangle"
  }
];

export const isCancelledOrderStatus = (
  orderStatus?: OrderStatus | string
): boolean => {
  return orderStatus === "Cancelled" || orderStatus === "Order Cancelled";
};

export const getFallbackFulfillmentStatus = (
  orderStatus?: OrderStatus | string,
  fulfillmentStatus?: FulfillmentStatus
): FulfillmentStatus => {
  if (fulfillmentStatus) {
    return fulfillmentStatus;
  }

  switch (orderStatus) {
    case "Delivered":
      return "DELIVERED";

    case "Out for Delivery":
      return "OUT_FOR_DELIVERY";

    case "Shipped":
      return "SHIPPED";

    case "Packed":
      return "PACKED";

    case "Order Placed":
      return "PENDING";

    case "Cancelled":
    case "Order Cancelled":
      return "FAILED";

    default:
      return "PENDING";
  }
};
export const getFulfillmentStatusLabel = (
  status?: FulfillmentStatus,
  orderStatus?: OrderStatus | string
): string => {
  if (status === "FAILED" && isCancelledOrderStatus(orderStatus)) {
    return "Order Cancelled";
  }

  switch (status) {
    case "ALLOCATED":
      return "Warehouse Allocated";

    case "PACKED":
      return "Packed";

    case "SHIPPED":
      return "Shipped";

    case "OUT_FOR_DELIVERY":
      return "Out for Delivery";

    case "DELIVERED":
      return "Delivered";

    case "FAILED":
      return "Delivery Issue";

    case "PENDING":
    default:
      return "Pending";
  }
};

export const getFulfillmentStatusClass = (
  status?: FulfillmentStatus
): string => {
  switch (status) {
    case "DELIVERED":
      return "success";

    case "FAILED":
      return "danger";

    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
      return "primary";

    case "ALLOCATED":
    case "PACKED":
      return "info";

    case "PENDING":
    default:
      return "secondary";
  }
};

export const getFulfillmentStepIndex = (
  status?: FulfillmentStatus
): number => {
  const currentStatus = status ?? "PENDING";

  const index = fulfillmentTimelineSteps.findIndex(
    (step) => step.key === currentStatus
  );

  return index >= 0 ? index : 0;
};