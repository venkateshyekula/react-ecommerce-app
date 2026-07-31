import type { AgentAssignment } from "../../types/agentAssignment";

type PickupTaskCardProps = {
  assignment: AgentAssignment;
  isUpdating: boolean;
  onStartPickup: (assignment: AgentAssignment) => Promise<void>;
  onMarkAttempted: (assignment: AgentAssignment) => Promise<void>;
  onCompletePickup: (assignment: AgentAssignment) => void;
};

const formatLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case "ASSIGNED":
      return "text-bg-info";
    case "OUT_FOR_PICKUP":
      return "text-bg-primary";
    case "PICKUP_COMPLETED":
      return "text-bg-success";
    case "PICKUP_ATTEMPTED":
    case "FAILED":
      return "text-bg-danger";
    default:
      return "text-bg-secondary";
  }
};

const formatScheduledDate = (dateStr?: string | null): string => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime())
    ? dateStr
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
};

const PickupTaskCard = ({
  assignment,
  isUpdating,
  onStartPickup,
  onMarkAttempted,
  onCompletePickup
}: PickupTaskCardProps) => {
  const isCompleted = assignment.status === "PICKUP_COMPLETED";
  const isOutForPickup = assignment.status === "OUT_FOR_PICKUP";
  const isAssignedOrRetrying =
    assignment.status === "ASSIGNED" ||
    assignment.status === "PICKUP_ATTEMPTED" ||
    assignment.status === "FAILED";

  return (
    <div className="card border-0 shadow-sm rounded-4 h-100">
      <div className="card-body p-4 d-flex flex-column justify-content-between">
        <div>
          {/* Header Row */}
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-2 mb-3">
            <div>
              <span className="badge text-bg-light border mb-2 font-monospace">
                {assignment.assignmentId}
              </span>

              <h5 className="fw-bold mb-1">{assignment.customerName}</h5>

              <p className="text-muted small mb-0">
                Return: <strong className="text-dark">{assignment.taskId}</strong>
                {assignment.orderId ? (
                  <>
                    {" "}
                    - Order: <strong className="text-dark">{assignment.orderId}</strong>
                  </>
                ) : null}
              </p>
            </div>

            <span
              className={`badge ${getStatusBadgeClass(assignment.status)}`}
            >
              {formatLabel(assignment.status)}
            </span>
          </div>

          {/* Details Box */}
          <div className="alert alert-light border small mb-3">
            <div className="mb-1">
              <i className="bi bi-geo-alt me-2 text-muted" />
              <strong>Address:</strong> {assignment.address}
            </div>

            {assignment.customerPhone ? (
              <div className="mb-1">
                <i className="bi bi-telephone me-2 text-muted" />
                <strong>Phone:</strong> {assignment.customerPhone}
              </div>
            ) : null}

            {assignment.scheduledDate ? (
              <div className="mb-1">
                <i className="bi bi-calendar-event me-2 text-muted" />
                <strong>Date:</strong> {formatScheduledDate(assignment.scheduledDate)}
              </div>
            ) : null}

            {assignment.scheduledSlot ? (
              <div className="mb-1">
                <i className="bi bi-clock me-2 text-muted" />
                <strong>Slot:</strong> {assignment.scheduledSlot}
              </div>
            ) : null}

            <div>
              <i className="bi bi-arrow-repeat me-2 text-muted" />
              <strong>Attempts:</strong> {assignment.attemptCount ?? 0}
            </div>
          </div>

          {/* Remarks */}
          {assignment.remarks ? (
            <div className="p-2 bg-body-tertiary rounded mb-3 border-start border-3 border-warning small text-muted">
              <strong>Last Remark:</strong> {assignment.remarks}
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="d-flex flex-wrap justify-content-end gap-2 pt-2 border-top">
          {/* Start Pickup Action */}
          <button
            type="button"
            className="btn btn-sm btn-outline-primary fw-semibold"
            disabled={isUpdating || isCompleted || isOutForPickup}
            onClick={() => void onStartPickup(assignment)}
          >
            {isUpdating && isAssignedOrRetrying ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : (
              <i className="bi bi-truck me-2" />
            )}
            {isOutForPickup ? "In Progress" : "Start Pickup"}
          </button>

          {/* Mark Attempted Action */}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger fw-semibold"
            disabled={isUpdating || isCompleted}
            onClick={() => void onMarkAttempted(assignment)}
          >
            <i className="bi bi-x-circle me-2" />
            Mark Attempted
          </button>

          {/* Complete Pickup Action */}
          <button
            type="button"
            className="btn btn-sm btn-success fw-semibold"
            disabled={isUpdating || isCompleted}
            onClick={() => onCompletePickup(assignment)}
          >
            <i className="bi bi-check-circle me-2" />
            Complete Pickup
          </button>
        </div>
      </div>
    </div>
  );
};

export default PickupTaskCard;