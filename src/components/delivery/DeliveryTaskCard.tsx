import type { AgentAssignment } from "../../types/agentAssignment";

type DeliveryTaskCardProps = {
  assignment: AgentAssignment;
  isUpdating: boolean;
  onStartDelivery: (assignment: AgentAssignment) => Promise<void>;
  onMarkAttempted: (assignment: AgentAssignment) => void;
  onCompleteDelivery: (assignment: AgentAssignment) => void;
};

const formatLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusBadgeClass = (status: string): string => {
  if (status === "ASSIGNED") {
    return "text-bg-info";
  }

  if (status === "OUT_FOR_DELIVERY") {
    return "text-bg-primary";
  }

  if (status === "DELIVERED") {
    return "text-bg-success";
  }

  if (["DELIVERY_ATTEMPTED", "FAILED"].includes(status)) {
    return "text-bg-danger";
  }

  return "text-bg-secondary";
};

const formatDate = (dateStr?: string): string | null => {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? dateStr : parsed.toLocaleDateString("en-IN");
};

const DeliveryTaskCard = ({
  assignment,
  isUpdating,
  onStartDelivery,
  onMarkAttempted,
  onCompleteDelivery
}: DeliveryTaskCardProps) => {
  const isDelivered = assignment.status === "DELIVERED";
  const isOutForDelivery = assignment.status === "OUT_FOR_DELIVERY";
  const formattedDate = formatDate(assignment.scheduledDate);

  return (
    <div className="card border-0 shadow-sm rounded-4 h-100">
      <div className="card-body p-4 d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
            <div>
              <span className="badge text-bg-light border mb-2">
                {assignment.assignmentId ?? assignment.id}
              </span>

              <h5 className="fw-bold mb-1">{assignment.customerName}</h5>

              <p className="text-muted small mb-0">
                Order:{" "}
                <strong>{assignment.orderId ?? assignment.taskId}</strong>
              </p>
            </div>

            <span
              className={`badge align-self-start ${getStatusBadgeClass(
                assignment.status
              )}`}
            >
              {formatLabel(assignment.status)}
            </span>
          </div>

          <div className="alert alert-light border small mb-3">
            <div>
              <strong>Address:</strong> {assignment.address}
            </div>

            {assignment.customerPhone ? (
              <div>
                <strong>Phone:</strong> {assignment.customerPhone}
              </div>
            ) : null}

            {formattedDate ? (
              <div>
                <strong>Date:</strong> {formattedDate}
              </div>
            ) : null}

            {assignment.scheduledSlot ? (
              <div>
                <strong>Slot:</strong> {assignment.scheduledSlot}
              </div>
            ) : null}

            <div>
              <strong>Attempt Count:</strong> {assignment.attemptCount ?? 0}
            </div>
          </div>

          {assignment.remarks ? (
            <p className="small text-muted mb-3">
              <strong>Last Remark:</strong> {assignment.remarks}
            </p>
          ) : null}
        </div>

        <div className="d-flex flex-wrap justify-content-end gap-2 pt-2 border-top">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            disabled={isUpdating || isDelivered || isOutForDelivery}
            onClick={() => void onStartDelivery(assignment)}
          >
            <i className="bi bi-truck me-2" />
            Start Delivery
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            disabled={isUpdating || isDelivered || !isOutForDelivery}
            onClick={() => onMarkAttempted(assignment)}
          >
            <i className="bi bi-x-circle me-2" />
            Mark Attempted
          </button>

          <button
            type="button"
            className="btn btn-sm btn-success"
            disabled={isUpdating || isDelivered || !isOutForDelivery}
            onClick={() => onCompleteDelivery(assignment)}
          >
            <i className="bi bi-check-circle me-2" />
            Complete Delivery
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTaskCard;