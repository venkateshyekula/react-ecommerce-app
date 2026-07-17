import type { FulfillmentStatus, TrackingEvent } from "../../types/order";
import {
  fulfillmentTimelineSteps,
  getFulfillmentStatusClass,
  getFulfillmentStatusLabel,
  isCancelledOrderStatus
} from "../../utils/fulfillmentUtils";

interface OrderFulfillmentTimelineProps {
  fulfillmentStatus?: FulfillmentStatus;
  orderStatus?: string;
  events?: TrackingEvent[];
}

interface TimelineSubEvent {
  title: string;
  description: string;
  location?: string;
  timestamp?: string;
  isFallback: boolean;
}

const normalWorkflowSteps = fulfillmentTimelineSteps.filter(
  (step) => step.key !== "FAILED"
);

const failedStep = fulfillmentTimelineSteps.find(
  (step) => step.key === "FAILED"
);

const fulfillmentStatusToTrackingStatusMap: Record<FulfillmentStatus, string> =
  {
    PENDING: "Order Placed",
    ALLOCATED: "Warehouse Allocated",
    PACKED: "Packed",
    SHIPPED: "Shipped",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    FAILED: "Cancelled"
  };

const trackingStatusToFulfillmentIndexMap: Record<string, number> = {
  "Order Placed": 0,
  "Warehouse Allocated": 1,
  Packed: 2,
  Shipped: 3,
  "Out for Delivery": 4,
  Delivered: 5
};

const formatEventTimestamp = (timestamp?: string): string => {
  if (!timestamp) {
    return "";
  }

  return new Date(timestamp).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};

const OrderFulfillmentTimeline = ({
  fulfillmentStatus = "PENDING",
  orderStatus,
  events = []
}: OrderFulfillmentTimelineProps) => {
  const isCancelledOrder = isCancelledOrderStatus(orderStatus);
  const statusClass = getFulfillmentStatusClass(fulfillmentStatus);

  const normalActiveIndex = Math.max(
    0,
    normalWorkflowSteps.findIndex((step) => step.key === fulfillmentStatus)
  );

  const reachedIndexFromEvents = events.reduce((highestIndex, event) => {
    if (!event.isCompleted) {
      return highestIndex;
    }

    const eventIndex = trackingStatusToFulfillmentIndexMap[event.status];

    if (eventIndex === undefined) {
      return highestIndex;
    }

    return Math.max(highestIndex, eventIndex);
  }, 0);

  const visibleSteps =
    fulfillmentStatus === "FAILED" && failedStep
      ? [
          ...normalWorkflowSteps.slice(0, reachedIndexFromEvents + 1),
          failedStep
        ]
      : normalWorkflowSteps;

  const getEventForStep = (
    stepStatus: FulfillmentStatus
  ): TrackingEvent | undefined => {
    const trackingStatus = fulfillmentStatusToTrackingStatusMap[stepStatus];

    if (stepStatus === "FAILED") {
      return events.find((event) => event.status === "Cancelled");
    }

    return events.find((event) => event.status === trackingStatus);
  };

  const getStepState = (
    stepStatus: FulfillmentStatus,
    index: number
  ): {
    isCompleted: boolean;
    isActive: boolean;
    isFuture: boolean;
    isFailed: boolean;
  } => {
    if (fulfillmentStatus === "FAILED") {
      const isFailed = stepStatus === "FAILED";

      return {
        isCompleted: !isFailed,
        isActive: isFailed,
        isFuture: false,
        isFailed
      };
    }

    if (fulfillmentStatus === "DELIVERED") {
      return {
        isCompleted: true,
        isActive: false,
        isFuture: false,
        isFailed: false
      };
    }

    return {
      isCompleted: index < normalActiveIndex,
      isActive: index === normalActiveIndex,
      isFuture: index > normalActiveIndex,
      isFailed: false
    };
  };

  const getSubEventForStep = (
    stepStatus: FulfillmentStatus,
    index: number
  ): TimelineSubEvent | null => {
    const { isCompleted, isActive } = getStepState(stepStatus, index);

    const canShowSubEvent = isCompleted || isActive;

    if (!canShowSubEvent) {
      return null;
    }

    const stepEvent = getEventForStep(stepStatus);

    if (stepEvent) {
      return {
        title: stepEvent.title,
        description: stepEvent.description,
        location: stepEvent.location,
        timestamp: stepEvent.timestamp,
        isFallback: false
      };
    }

    if (stepStatus === "ALLOCATED") {
      return {
        title: "Warehouse allocation completed",
        description: "A fulfillment center has been selected for this order.",
        isFallback: true
      };
    }

    if (stepStatus === "FAILED") {
      if (isCancelledOrder) {
        return {
          title: "Order cancelled",
          description:
            "This order has been cancelled. Fulfillment steps are stopped.",
          isFallback: true
        };
      }

      return {
        title: "Delivery issue update pending",
        description:
          "The latest delivery issue details are not yet available.",
        isFallback: true
      };
    }

    return {
      title: "Update pending from fulfillment system",
      description:
        "This step has been reached, but detailed tracking information is not available yet.",
      isFallback: true
    };
  };

  return (
    <div className="order-fulfillment-timeline-card">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
        <div>
          <h6 className="fw-bold mb-1">Fulfillment Progress</h6>

          <p className="text-muted small mb-0">
            Current Status:{" "}
            <strong>
              {getFulfillmentStatusLabel(fulfillmentStatus, orderStatus)}
            </strong>
          </p>
        </div>

        <span className={`fulfillment-status-pill ${statusClass}`}>
          {getFulfillmentStatusLabel(fulfillmentStatus, orderStatus)}
        </span>
      </div>

      <div className="order-fulfillment-timeline">
        {visibleSteps.map((step, index) => {
          const { isCompleted, isActive, isFuture, isFailed } = getStepState(
            step.key,
            index
          );

          const subEvent = getSubEventForStep(step.key, index);

          return (
            <div
              className={`order-fulfillment-step ${
                isCompleted ? "completed" : ""
              } ${isActive ? "active" : ""} ${isFuture ? "future" : ""} ${
                isFailed ? "failed" : ""
              }`}
              key={step.key}
            >
              <div className="order-fulfillment-step-icon">
                <i className={step.icon} />
              </div>

              <div className="order-fulfillment-step-content">
                <strong>
                  {step.key === "FAILED" && isCancelledOrder
                    ? "Order Cancelled"
                    : step.label}
                </strong>

                <p>
                  {step.key === "FAILED" && isCancelledOrder
                    ? "This order has been cancelled by the customer."
                    : step.description}
                </p>

                {subEvent ? (
                  <div
                    className={`order-fulfillment-sub-event-dotted ${
                      subEvent.isFallback ? "fallback" : ""
                    }`}
                  >
                    <span className="order-fulfillment-sub-dot" />

                    <div className="order-fulfillment-sub-event-body">
                      <p className="order-fulfillment-sub-event-title mb-1">
                        {subEvent.title}
                      </p>

                      <p className="order-fulfillment-sub-event-description mb-2">
                        {subEvent.description}
                      </p>

                      {subEvent.location || subEvent.timestamp ? (
                        <div className="order-fulfillment-sub-event-meta">
                          {subEvent.location ? (
                            <span>
                              <i className="bi bi-geo-alt" />
                              {subEvent.location}
                            </span>
                          ) : null}

                          {subEvent.timestamp ? (
                            <span>
                              <i className="bi bi-clock" />
                              {formatEventTimestamp(subEvent.timestamp)}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderFulfillmentTimeline;