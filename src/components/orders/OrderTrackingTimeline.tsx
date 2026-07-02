import type { OrderStatus, TrackingStep } from "../../types/order";

interface OrderTrackingTimelineProps {
  steps: TrackingStep[];
  currentStatus: OrderStatus;
}

const OrderTrackingTimeline = ({
  steps,
  currentStatus
}: OrderTrackingTimelineProps) => {
  return (
    <div className="order-timeline-container py-3">
      {steps.map((step, index) => {
        const isCurrent = step.label === currentStatus;
        const isLast = index === steps.length - 1;

        let stepClass = "timeline-item";
        if (step.isCompleted) stepClass += " is-completed";
        if (isCurrent) stepClass += " is-current";

        return (
          <div key={step.label} className={stepClass}>
            {/* Main connecting track line */}
            {!isLast && (
              <div 
                className={`timeline-line ${
                  step.isCompleted && steps[index + 1]?.isCompleted 
                    ? "line-active" 
                    : ""
                }`} 
              />
            )}

            {/* Main Milestone Circle Marker */}
            <div className="timeline-icon-box">
              {/* FIX: Prioritize isCurrent over isCompleted so the active status can animate */}
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

            {/* Status Content Area */}
            <div className="timeline-text-content w-100">
              <div className="d-flex align-items-center gap-2 mb-1">
                <h6 className={`status-title mb-0 ${step.isCompleted || isCurrent ? "fw-bold text-dark" : "text-muted"}`}>
                  {step.label}
                </h6>
                {isCurrent && (
                  <span className="badge bg-light-success text-success border border-success-subtle small-badge">
                    Active Status
                  </span>
                )}
              </div>

              {/* NESTED TRANSIT SUB-STEPS */}
              {step.subSteps && step.subSteps.length > 0 && (
                <div className="transit-logs-container mt-3 mb-2">
                  {step.subSteps.map((sub, subIdx) => (
                    <div key={subIdx} className="transit-log-row position-relative ps-3 pb-3">
                      {subIdx !== step.subSteps!.length - 1 && (
                        <div className="transit-log-subline" />
                      )}
                      
                      <span className={`transit-log-dot ${subIdx === 0 && isCurrent ? "latest" : ""}`} />
                      
                      <div className="transit-log-details">
                        <p className={`small mb-0 ${subIdx === 0 ? "fw-semibold text-dark" : "text-muted"}`}>
                          {sub.title}
                        </p>
                        <span className="transit-log-time text-muted">
                          {sub.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderTrackingTimeline;