import { useState, type ChangeEvent, type FormEvent } from "react";
import type { AgentAssignment } from "../../types/agentAssignment";
import type { CreatePickupProofPayload } from "../../types/pickupAgent";

type PickupProofModalProps = {
  assignment: AgentAssignment;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePickupProofPayload) => Promise<void>;
};

const MAX_PROOF_FILE_SIZE_BYTES = 3 * 1024 * 1024;

const allowedProofFileTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const convertFileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!allowedProofFileTypes.includes(file.type)) {
      reject(new Error("Please upload PNG, JPG, JPEG, or WEBP image proof."));
      return;
    }

    if (file.size > MAX_PROOF_FILE_SIZE_BYTES) {
      reject(new Error("Pickup proof image should not exceed 3 MB."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result));
    };

    reader.onerror = () => {
      reject(new Error("Unable to read selected pickup proof image."));
    };

    reader.readAsDataURL(file);
  });
};

const PickupProofModal = ({
  assignment,
  isSaving,
  onClose,
  onSubmit,
}: PickupProofModalProps) => {
  const [proofUrl, setProofUrl] = useState<string>("");
  const [otpVerified, setOtpVerified] = useState<boolean>(true);
  const [customerRemarks, setCustomerRemarks] = useState<string>("");
  const [agentRemarks, setAgentRemarks] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const isValid = proofUrl.trim().length > 0 || agentRemarks.trim().length >= 5;

  const handleProofFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    try {
      setErrorMessage("");
      const dataUrl = await convertFileToDataUrl(selectedFile);
      setProofUrl(dataUrl);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to upload pickup proof image.";

      setErrorMessage(message);
    } finally {
      event.target.value = "";
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    setErrorMessage("");

    if (!isValid) {
      setErrorMessage(
        "Please upload pickup proof image or enter agent remarks of at least 5 characters.",
      );
      return;
    }

    const payload: CreatePickupProofPayload = {
      assignmentId: assignment.assignmentId ?? assignment.id,
      taskId: assignment.taskId,
      returnRequestId: assignment.returnRequestId ?? assignment.taskId,
      returnRequestDbId: assignment.returnRequestDbId,
      orderId: assignment.orderId,
      agentId: assignment.agentId ?? "",
      agentName: assignment.agentName ?? "Pickup Agent",
      proofType: proofUrl ? "PHOTO" : "MANUAL",
      proofUrl: proofUrl || undefined,
      otpVerified,
      customerRemarks: customerRemarks.trim() || undefined,
      agentRemarks: agentRemarks.trim() || undefined,
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit pickup proof.";

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
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg rounded-4">
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold">
                    Complete Pickup With Proof
                  </h5>
                  <p className="text-muted small mb-0">
                    Return: {assignment.taskId} · {assignment.customerName}
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
                  <div className="alert alert-danger small" role="alert">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="alert alert-light border small mb-3">
                  <div>
                    <strong>Return:</strong> {assignment.taskId}
                  </div>

                  {assignment.orderId ? (
                    <div>
                      <strong>Order:</strong> {assignment.orderId}
                    </div>
                  ) : null}

                  {assignment.scheduledSlot ? (
                    <div>
                      <strong>Slot:</strong> {assignment.scheduledSlot}
                    </div>
                  ) : null}

                  <div>
                    <strong>Address:</strong> {assignment.address}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Upload Pickup Proof Image
                  </label>

                  <input
                    type="file"
                    className="form-control"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    disabled={isSaving}
                    onChange={(event) => void handleProofFileChange(event)}
                  />

                  <div className="form-text">
                    Supported formats: PNG, JPG, JPEG, WEBP. Max 3 MB.
                  </div>
                </div>

                {/* Fixed Image Preview */}
                {proofUrl ? (
                  <div className="border rounded-4 p-3 mb-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                      <h6 className="fw-bold mb-0">Proof Preview</h6>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        disabled={isSaving}
                        onClick={() => setProofUrl("")}
                      >
                        <i className="bi bi-trash me-1" />
                        Remove
                      </button>
                    </div>

                    <div className="text-center bg-white p-2 border rounded-3">
                      <img
                        src={proofUrl}
                        alt="Pickup Proof Preview"
                        className="img-fluid rounded"
                        style={{ maxHeight: "220px", objectFit: "contain" }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="form-check form-switch mb-3">
                  <input
                    id="otpVerified"
                    type="checkbox"
                    className="form-check-input"
                    checked={otpVerified}
                    disabled={isSaving}
                    onChange={(event) => setOtpVerified(event.target.checked)}
                  />
                  <label
                    htmlFor="otpVerified"
                    className="form-check-label fw-medium"
                  >
                    Customer OTP / handover verified
                  </label>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Customer Remarks
                  </label>

                  <textarea
                    className="form-control"
                    rows={3}
                    value={customerRemarks}
                    disabled={isSaving}
                    onChange={(event) => setCustomerRemarks(event.target.value)}
                    placeholder="Example: Customer handed over sealed package."
                  />
                </div>

                <div className="mb-0">
                  <label className="form-label fw-semibold">
                    Agent Remarks
                  </label>

                  <textarea
                    className="form-control"
                    rows={3}
                    value={agentRemarks}
                    disabled={isSaving}
                    onChange={(event) => setAgentRemarks(event.target.value)}
                    placeholder="Example: Product picked up in sealed condition."
                  />

                  <div className="form-text">
                    Required if proof image is not uploaded (min 5 characters).
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={isSaving}
                  onClick={onClose}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving || !isValid}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2" />
                      Complete Pickup
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

export default PickupProofModal;
