import type { OrderStatus, TrackingStep } from "../types/order";

export const ORDER_STATUSES: OrderStatus[] = [
  "Order Placed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered"
];

export const generateOrderId = (): string => {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `ORD-${datePart}-${randomPart}`;
};

export const getInitialTrackingSteps = (): TrackingStep[] => {
  return ORDER_STATUSES.map((status, index) => ({
    label: status,
    isCompleted: index === 0
  }));
};

export const getOrderStatusIndex = (status: OrderStatus): number => {
  return ORDER_STATUSES.findIndex((orderStatus) => orderStatus === status);
};

export const buildTrackingStepsByStatus = (
  currentStatus: OrderStatus
): TrackingStep[] => {
  const currentStatusIndex = getOrderStatusIndex(currentStatus);

  return ORDER_STATUSES.map((status, index) => ({
    label: status,
    isCompleted: index <= currentStatusIndex
  }));
};