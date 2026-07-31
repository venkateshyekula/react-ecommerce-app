import type { ReturnRequest } from "../../types/returnRequest";
import type {
  ReturnPickupAttempt,
  ReturnPickupPartner,
} from "../../types/returnPickup";
import { formatCurrency } from "../../utils/currencyFormatter";
import {
  canMarkFailedAttempt,
  canMarkOutForPickup,
  canMarkPickedUp,
  formatPickupLabel,
  getPickupAttemptStatusBadgeClass,
} from "../../utils/returnPickupUtils";

interface AgentReturnPickupCardProps {
  request: ReturnRequest;
  attempt: ReturnPickupAttempt;
  partner?: ReturnPickupPartner | null;
  isUpdating?: boolean;
  isSelected?: boolean;
  failureReason: string;
  onFailureReasonChange: (attemptId: string, value: string) => void;
  onMarkOutForPickup: (
    request: ReturnRequest,
    attempt: ReturnPickupAttempt,
  ) => Promise<void>;
  onMarkPickedUp: (
    request: ReturnRequest,
    attempt: ReturnPickupAttempt,
    partner?: ReturnPickupPartner | null,
  ) => Promise<void>;
  onMarkFailedAttempt: (
    request: ReturnRequest,
    attempt: ReturnPickupAttempt,
    failureReason: string,
  ) => Promise<void>;
  onSelectForProof: (request: ReturnRequest) => void;
}

const AgentReturnPickupCard = ({
  request,
  attempt,
  partner = null,
  isUpdating = false,
  isSelected = false,
  failureReason,
  onFailureReasonChange,
  onMarkOutForPickup,
  onMarkPickedUp,
  onMarkFailedAttempt,
  onSelectForProof,
}: AgentReturnPickupCardProps) => {
  const totalAmount =
    request.refundAmount ??
    request.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

  return (
    <div
      role="button"
      tabIndex={0}
      className={`agent-return-pickup-card bg-white rounded-3 p-4 transition-all ${
        isSelected
          ? "border border-2 border-danger shadow-sm"
          : "border shadow-sm"
      }`}
      style={{ cursor: "pointer" }}
      onClick={() => onSelectForProof(request)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelectForProof(request);
        }
      }}
    >
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
        <div className="min-w-0">
          <span className="badge text-bg-light border mb-2">
            {attempt.attemptId}
          </span>

          <h5 className="fw-bold mb-1">
            Return Pickup · {request.returnRequestId ?? request.requestId}
          </h5>

          <p className="text-muted small mb-0">
            Order: <strong>{request.orderId}</strong>
          </p>

          <p className="text-muted small mb-0">
            Customer: <strong>{request.userName ?? request.userId}</strong>
          </p>
        </div>

        <span
          className={`badge align-self-start ${getPickupAttemptStatusBadgeClass(
            attempt.status,
          )}`}
        >
          {formatPickupLabel(attempt.status)}
        </span>
      </div>

      <div className="agent-pickup-meta-grid mb-3">
        <div>
          <span>Pickup Date</span>
          <strong>
            {new Date(attempt.scheduledPickupDate).toLocaleDateString("en-IN")}
          </strong>
        </div>

        <div>
          <span>Pickup Slot</span>
          <strong>{attempt.pickupSlot}</strong>
        </div>

        <div>
          <span>Refund Amount</span>
          <strong>{formatCurrency(totalAmount)}</strong>
        </div>

        <div>
          <span>Attempt</span>
          <strong>#{attempt.attemptNumber}</strong>
        </div>
      </div>

      <div className="alert alert-light border small mb-3">
        <strong>Pickup Address:</strong> {request.pickupAddress ?? "-"}
        <br />
        <strong>Reason:</strong> {request.returnReason ?? request.reason}
      </div>

      <div className="agent-pickup-items mb-3">
        {request.items.map((item, index) => (
          <div
            className="agent-pickup-item"
            key={`${item.productId}-${item.selectedSize ?? "no-size"}-${index}`}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="agent-pickup-item-img"
              />
            ) : (
              <div className="agent-pickup-item-placeholder">
                <i className="bi bi-box" />
              </div>
            )}

            <div className="flex-grow-1 min-w-0">
              <strong className="d-block text-truncate">{item.name}</strong>

              <p className="small text-muted mb-0">
                Qty {item.quantity}
                {item.selectedSize ? ` · Size ${item.selectedSize}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      {attempt.failureReason ? (
        <div className="alert alert-warning small">
          <strong>Failure Reason:</strong> {attempt.failureReason}
        </div>
      ) : null}

      {attempt.pickupProofCode ? (
        <div className="alert alert-success small">
          <strong>Pickup Proof Code:</strong> {attempt.pickupProofCode}
        </div>
      ) : null}

      <div className="d-flex flex-wrap gap-2 mb-3">
        {canMarkOutForPickup(attempt) ? (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={isUpdating}
            onClick={(event) => {
              event.stopPropagation();
              void onMarkOutForPickup(request, attempt);
            }}
          >
            Mark Out For Pickup
          </button>
        ) : null}

        {canMarkPickedUp(attempt) ? (
          <button
            type="button"
            className="btn btn-sm btn-success"
            disabled={isUpdating}
            onClick={(event) => {
              event.stopPropagation();
              void onMarkPickedUp(request, attempt, partner);
            }}
          >
            Mark Picked Up
          </button>
        ) : null}

        <button
          type="button"
          className={`btn btn-sm ${
            isSelected ? "btn-primary" : "btn-outline-secondary"
          }`}
          disabled={isUpdating}
          onClick={(event) => {
            event.stopPropagation();
            onSelectForProof(request);
          }}
        >
          {isSelected ? "Proof Active" : "Upload / View Proof"}
        </button>
      </div>

      {canMarkFailedAttempt(attempt) ? (
        <div
          className="agent-failed-reason-control d-flex gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <input
            className="form-control"
            placeholder="Reason for failed pickup attempt"
            value={failureReason}
            disabled={isUpdating}
            onChange={(event) =>
              onFailureReasonChange(attempt.id, event.target.value)
            }
          />

          <button
            type="button"
            className="btn btn-outline-danger text-nowrap"
            disabled={isUpdating || failureReason.trim().length === 0}
            onClick={(event) => {
              event.stopPropagation();
              void onMarkFailedAttempt(
                request,
                attempt,
                failureReason.trim(),
              );
            }}
          >
            Mark Failed
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default AgentReturnPickupCard;