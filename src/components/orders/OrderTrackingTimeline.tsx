import type {
  OrderStatus,
  TrackingEvent,
  TrackingStep
} from "../../types/order";

interface OrderTrackingTimelineProps {
  steps: TrackingStep[];
  currentStatus: OrderStatus;
  events?: TrackingEvent[];
}

const OrderTrackingTimeline = ({
  steps,
  currentStatus,
  events = []
}: OrderTrackingTimelineProps) => {
  const getEventForStep = (stepLabel: string): TrackingEvent | undefined => {
    return events.find((event) => event.status === stepLabel);
  };

  return (
    <div className="order-timeline-container py-3">
      {steps.map((step, index) => {
        const stepEvent = getEventForStep(step.label);
        const isCurrent = step.label === currentStatus;
        const isLast = index === steps.length - 1;

        let stepClass = "timeline-item";

        if (step.isCompleted) {
          stepClass += " is-completed";
        }

        if (isCurrent) {
          stepClass += " is-current";
        }

        return (
          <div
            key={`${step.label}-${index}`}
            className={stepClass}
          >
            {!isLast ? (
              <div
                className={`timeline-line ${
                  step.isCompleted && steps[index + 1]?.isCompleted
                    ? "line-active"
                    : ""
                }`}
              />
            ) : null}

            <div className="timeline-icon-box">
              {isCurrent ? (
                <div className="icon-circle current-circle">
                  <span className="pulse-dot" />
                </div>
              ) : step.isCompleted ? (
                <div className="icon-circle completed-circle">
                  <i className="bi bi-check-lg" />
                </div>
              ) : (
                <div className="icon-circle pending-circle">
                  <span className="small-dot" />
                </div>
              )}
            </div>

            <div className="timeline-text-content w-100">
              <div className="d-flex align-items-center gap-2 mb-1">
                <h6
                  className={`status-title mb-0 ${
                    step.isCompleted || isCurrent
                      ? "fw-bold text-dark"
                      : "text-muted"
                  }`}
                >
                  {step.label}
                </h6>

                {isCurrent ? (
                  <span className="badge bg-light-success text-success border border-success-subtle small-badge">
                    Active Status
                  </span>
                ) : null}
              </div>

              {stepEvent ? (
                <div className="timeline-event-details mb-2">
                  <p className="small fw-semibold text-dark mb-1">
                    {stepEvent.title}
                  </p>

                  <p className="small text-muted mb-1">
                    {stepEvent.description}
                  </p>

                  <div className="d-flex flex-wrap gap-2 small text-muted">
                    {stepEvent.location ? (
                      <span>
                        <i className="bi bi-geo-alt me-1" />
                        {stepEvent.location}
                      </span>
                    ) : null}

                    {stepEvent.timestamp ? (
                      <span>
                        <i className="bi bi-clock me-1" />
                        {new Date(stepEvent.timestamp).toLocaleString("en-IN")}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {step.subSteps && step.subSteps.length > 0 ? (
                <div className="transit-logs-container mt-3 mb-2">
                  {step.subSteps.map((sub, subIdx) => (
                    <div
                      key={`${step.label}-substep-${subIdx}-${sub.title}`}
                      className="transit-log-row position-relative ps-3 pb-3"
                    >
                      {subIdx !== step.subSteps!.length - 1 ? (
                        <div className="transit-log-subline" />
                      ) : null}

                      <span
                        className={`transit-log-dot ${
                          subIdx === 0 && isCurrent ? "latest" : ""
                        }`}
                      />

                      <div className="transit-log-details">
                        <p
                          className={`small mb-0 ${
                            subIdx === 0
                              ? "fw-semibold text-dark"
                              : "text-muted"
                          }`}
                        >
                          {sub.title}
                        </p>

                        <span className="transit-log-time text-muted">
                          {sub.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderTrackingTimeline;