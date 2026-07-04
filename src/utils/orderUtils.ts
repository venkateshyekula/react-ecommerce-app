import type { OrderStatus, TrackingEvent, TrackingStep } from "../types/order";

export const ORDER_STATUSES: OrderStatus[] = [
  "Order Placed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered"
];

export const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  "Cancelled",
  "Return Requested",
  "Returned"
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
  if (TERMINAL_ORDER_STATUSES.includes(currentStatus)) {
    return ORDER_STATUSES.map((status) => ({
      label: status,
      isCompleted: false
    }));
  }

  const currentStatusIndex = getOrderStatusIndex(currentStatus);

  return ORDER_STATUSES.map((status, index) => ({
    label: status,
    isCompleted: index <= currentStatusIndex
  }));
};

export const getInitialTrackingEvents = (): TrackingEvent[] => {
  const now = new Date();

  return [
    {
      id: `track-${Date.now()}-001`,
      status: "Order Placed",
      title: "Order placed successfully",
      description:
        "Your order has been received and payment details have been confirmed.",
      location: "ShopEase Order System",
      timestamp: now.toISOString(),
      isCompleted: true
    },
    {
      id: `track-${Date.now()}-002`,
      status: "Packed",
      title: "Packing pending",
      description: "Your order will be packed at the seller warehouse.",
      location: "Seller Warehouse",
      timestamp: "",
      isCompleted: false
    },
    {
      id: `track-${Date.now()}-003`,
      status: "Shipped",
      title: "Shipment pending",
      description: "Your package will be handed over to the logistics partner.",
      location: "Logistics Hub",
      timestamp: "",
      isCompleted: false
    },
    {
      id: `track-${Date.now()}-004`,
      status: "Out for Delivery",
      title: "Out for delivery pending",
      description: "Your package will be assigned to a delivery partner.",
      location: "Nearest Delivery Hub",
      timestamp: "",
      isCompleted: false
    },
    {
      id: `track-${Date.now()}-005`,
      status: "Delivered",
      title: "Delivery pending",
      description: "Your package will be delivered to the selected address.",
      location: "Customer Address",
      timestamp: "",
      isCompleted: false
    }
  ];
};

export const buildTrackingEventsByStatus = (
  currentStatus: OrderStatus,
  existingEvents: TrackingEvent[] = getInitialTrackingEvents()
): TrackingEvent[] => {
  if (currentStatus === "Cancelled") {
    return [
      ...existingEvents.map((event) => ({
        ...event,
        isCompleted: event.status === "Order Placed"
      })),
      {
        id: `track-${Date.now()}-cancelled`,
        status: "Cancelled",
        title: "Order cancelled",
        description: "This order has been cancelled.",
        location: "ShopEase Order System",
        timestamp: new Date().toISOString(),
        isCompleted: true
      }
    ];
  }

  if (currentStatus === "Return Requested") {
    return [
      ...existingEvents.map((event) => ({
        ...event,
        isCompleted: true
      })),
      {
        id: `track-${Date.now()}-return-requested`,
        status: "Return Requested",
        title: "Return requested",
        description:
          "A return request has been created and is awaiting pickup confirmation.",
        location: "ShopEase Returns",
        timestamp: new Date().toISOString(),
        isCompleted: true
      }
    ];
  }

  if (currentStatus === "Returned") {
    return [
      ...existingEvents.map((event) => ({
        ...event,
        isCompleted: true
      })),
      {
        id: `track-${Date.now()}-returned`,
        status: "Returned",
        title: "Product returned",
        description: "The returned product has been received successfully.",
        location: "Return Warehouse",
        timestamp: new Date().toISOString(),
        isCompleted: true
      }
    ];
  }

  const currentStatusIndex = getOrderStatusIndex(currentStatus);

  return existingEvents.map((event) => {
    const eventStatusIndex = getOrderStatusIndex(event.status);

    if (eventStatusIndex === -1) {
      return event;
    }

    const isCompleted = eventStatusIndex <= currentStatusIndex;

    return {
      ...event,
      isCompleted,
      title: isCompleted ? `${event.status} completed` : event.title,
      timestamp:
        isCompleted && !event.timestamp
          ? new Date().toISOString()
          : event.timestamp
    };
  });
};

export const canCancelOrder = (status: OrderStatus): boolean => {
  return ["Order Placed", "Packed"].includes(status);
};

export const canReturnOrder = (status: OrderStatus): boolean => {
  return status === "Delivered";
};

export const getOrderStatusBadgeClass = (status: OrderStatus): string => {
  switch (status) {
    case "Order Placed":
      return "bg-primary-subtle text-primary border border-primary-subtle";

    case "Packed":
      return "bg-info-subtle text-info border border-info-subtle";

    case "Shipped":
      return "bg-warning-subtle text-warning border border-warning-subtle";

    case "Out for Delivery":
      return "bg-purple-subtle text-purple border border-purple-subtle";

    case "Delivered":
      return "bg-success-subtle text-success border border-success-subtle";

    case "Cancelled":
      return "bg-danger-subtle text-danger border border-danger-subtle";

    case "Return Requested":
      return "bg-warning-subtle text-warning border border-warning-subtle";

    case "Returned":
      return "bg-secondary-subtle text-secondary border border-secondary-subtle";

    default:
      return "bg-light text-dark border";
  }
};

export const formatTrackingDate = (timestamp: string): string => {
  if (!timestamp) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
};