import type { ReturnPickupAttempt } from "../../types/returnPickup";
import {
  formatPickupLabel,
  getPickupAttemptStatusBadgeClass,
} from "../../utils/returnPickupUtils";

interface PickupAttemptHistoryProps {
  attempts: ReturnPickupAttempt[];
}

const PickupAttemptHistory = ({ attempts }: PickupAttemptHistoryProps) => {
  if (attempts.length === 0) {
    return (
      <div className="pickup-attempt-history border rounded-4 p-3 bg-light">
        <h6 className="fw-bold mb-1">Pickup Attempt History</h6>
        <p className="text-muted small mb-0">
          No pickup attempts have been recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="pickup-attempt-history border rounded-4 p-3 bg-light">
      <div className="d-flex justify-content-between gap-2 mb-3">
        <div>
          <h6 className="fw-bold mb-1">Pickup Attempt History</h6>
          <p className="text-muted small mb-0">
            Partner assignment, pickup progress, and failed attempts.
          </p>
        </div>

        <span className="badge align-self-start text-bg-light border">
          {attempts.length} attempts
        </span>
      </div>

      <div className="d-flex flex-column gap-2">
        {attempts.map((attempt) => (
          <div className="pickup-attempt-row" key={attempt.id}>
            <div>
              <strong>
                Attempt #{attempt.attemptNumber} · {attempt.partnerName}
              </strong>

              <p className="text-muted small mb-0">
                {attempt.scheduledPickupDate
                  ? new Date(
                      attempt.scheduledPickupDate,
                    ).toLocaleDateString("en-IN")
                  : "Date pending"}{" "}
                · {attempt.pickupSlot}
              </p>

              {attempt.failureReason ? (
                <p className="text-danger small mb-0">
                  Failure: {attempt.failureReason}
                </p>
              ) : null}

              {attempt.pickupProofCode ? (
                <p className="text-success small mb-0">
                  Proof: {attempt.pickupProofCode}
                </p>
              ) : null}
            </div>

            <div className="text-end">
              <span
                className={`badge ${getPickupAttemptStatusBadgeClass(
                  attempt.status,
                )}`}
              >
                {formatPickupLabel(attempt.status)}
              </span>

              <p className="text-muted small mb-0 mt-1">
                {new Date(attempt.updatedAt).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PickupAttemptHistory;