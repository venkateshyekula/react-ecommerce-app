import { useState, type FormEvent } from "react";
import type { AgentAssignment } from "../../types/agentAssignment";

type DeliveryAttemptFailedModalProps = {
  assignment: AgentAssignment;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
};

const predefinedReasons = [
  "Customer unavailable",
  "Door locked",
  "Customer requested reschedule",
  "Wrong address",
  "Customer refused delivery",
  "Customer phone not reachable",
  "Payment not ready for COD",
  "Address inaccessible",
  "Other"
];

const MIN_REASON_LENGTH = 5;

const DeliveryAttemptFailedModal = ({
  assignment,
  isSaving,
  onClose,
  onSubmit
}: DeliveryAttemptFailedModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string>(
    "Customer unavailable"
  );
  const [customReason, setCustomReason] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const finalReason =
    selectedReason === "Other" ? customReason.trim() : selectedReason;

  const isValid = finalReason.length >= MIN_REASON_LENGTH;

  const handleReasonChange = (newReason: string) => {
    setSelectedReason(newReason);
    setErrorMessage("");
    if (newReason !== "Other") {
      setCustomReason("");
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    setErrorMessage("");

    if (!isValid) {
      setErrorMessage(
        `Reason must be at least ${MIN_REASON_LENGTH} characters long.`
      );
      return;
    }

    try {
      await onSubmit(finalReason);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit delivery attempt reason.";

      setErrorMessage(message);
    }
  };

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg rounded-4">
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold">
                    Mark Delivery Attempted
                  </h5>
                  <p className="text-muted small mb-0">
                    {assignment.taskId} · {assignment.customerName}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  disabled={isSaving}
                  aria-label="Close"
                />
              </div>

              <div className="modal-body">
                {errorMessage ? (
                  <div className="alert alert-danger small">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="alert alert-warning small mb-3">
                  Please provide a reason why this delivery attempt could not be
                  completed.
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Attempt Reason
                  </label>

                  <select
                    className="form-select"
                    value={selectedReason}
                    disabled={isSaving}
                    onChange={(event) => handleReasonChange(event.target.value)}
                  >
                    {predefinedReasons.map((reason) => (
                      <option value={reason} key={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedReason === "Other" ? (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Custom Reason
                    </label>

                    <textarea
                      className="form-control"
                      rows={4}
                      value={customReason}
                      disabled={isSaving}
                      onChange={(event) => {
                        setCustomReason(event.target.value);
                        setErrorMessage("");
                      }}
                      placeholder="Enter failed delivery attempt reason..."
                    />

                    <div className="form-text">
                      Minimum {MIN_REASON_LENGTH} characters required ({customReason.trim().length}/{MIN_REASON_LENGTH}).
                    </div>
                  </div>
                ) : null}

                <div className="border rounded-4 p-3 bg-light small">
                  <div>
                    <strong>Order:</strong> {assignment.orderId ?? assignment.taskId}
                  </div>

                  {assignment.scheduledSlot ? (
                    <div>
                      <strong>Slot:</strong> {assignment.scheduledSlot}
                    </div>
                  ) : null}

                  <div>
                    <strong>Current Attempts:</strong>{" "}
                    {assignment.attemptCount ?? 0}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={isSaving || !isValid}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-x-circle me-2" />
                      Save Attempt
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div
        className="modal-backdrop show"
        onClick={isSaving ? undefined : onClose}
      />
    </>
  );
};

export default DeliveryAttemptFailedModal;