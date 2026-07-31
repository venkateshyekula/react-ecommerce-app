import type { ReturnPackageTrackingEvent } from "../../types/returnPackageTracking";
import {
  formatReturnTrackingStatus,
  getReturnTrackingStatusBadgeClass,
} from "../../utils/returnPackageTrackingUtils";

interface ReturnPackageTrackingTimelineProps {
  events: ReturnPackageTrackingEvent[];
}

const ReturnPackageTrackingTimeline = ({
  events,
}: ReturnPackageTrackingTimelineProps) => {
  if (events.length === 0) {
    return (
      <div className="alert alert-light border small mb-0">
        No package tracking events have been added yet.
      </div>
    );
  }

  // NOTE: Reversing the array ensures the latest updates sit at the top of the feed
  const visibleEvents = [...events].reverse();

  // Helper function to format timestamp consistently
  const formatTimestamp = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="return-package-tracking-timeline">
      {visibleEvents.map((event, index) => (
        <div className="return-package-tracking-event" key={event.id}>
          <div className="return-package-tracking-marker">
            <span className="return-package-tracking-dot">
              <i className="bi bi-box-seam" />
            </span>

            {index < visibleEvents.length - 1 ? (
              <span className="return-package-tracking-line" />
            ) : null}
          </div>

          <div className="return-package-tracking-content text-start">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2 mb-2">
              <div>
                <h6 className="fw-bold mb-1">{event.title}</h6>
                <p className="text-muted small mb-0">
                  {event.description}
                </p>
              </div>

              <span
                className={`badge align-self-start ${getReturnTrackingStatusBadgeClass(
                  event.status,
                )}`}
              >
                {formatReturnTrackingStatus(event.status)}
              </span>
            </div>

            <div className="d-flex flex-wrap gap-3 small text-muted mt-1">
              {event.location ? (
                <span>
                  <i className="bi bi-geo-alt me-1" />
                  {event.location}
                </span>
              ) : null}

              {event.handledByName ? (
                <span>
                  <i className="bi bi-person-check me-1" />
                  {event.handledByName}
                </span>
              ) : null}

              <span>
                <i className="bi bi-clock me-1" />
                {formatTimestamp(event.createdAt)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReturnPackageTrackingTimeline;