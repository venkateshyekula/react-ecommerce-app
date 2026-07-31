import { useState, type ChangeEvent, type FormEvent } from "react";
import type { AgentAssignment } from "../../types/agentAssignment";
import type {
  CreateDeliveryProofPayload,
  DeliveryProofType
} from "../../types/deliveryAgent";

type DeliveryProofModalProps = {
  assignment: AgentAssignment;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateDeliveryProofPayload) => Promise<void>;
};

const MAX_PROOF_FILE_SIZE_BYTES = 3 * 1024 * 1024;

const allowedProofFileTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp"
];

const convertFileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!allowedProofFileTypes.includes(file.type)) {
      reject(new Error("Please upload PNG, JPG, JPEG, or WEBP image proof."));
      return;
    }

    if (file.size > MAX_PROOF_FILE_SIZE_BYTES) {
      reject(new Error("Delivery proof image should not exceed 3 MB."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result));
    };

    reader.onerror = () => {
      reject(new Error("Unable to read selected delivery proof image."));
    };

    reader.readAsDataURL(file);
  });
};

const DeliveryProofModal = ({
  assignment,
  isSaving,
  onClose,
  onSubmit
}: DeliveryProofModalProps) => {
  const [proofType, setProofType] = useState<DeliveryProofType>("PHOTO");
  const [proofUrl, setProofUrl] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [otpVerified, setOtpVerified] = useState<boolean>(true);
  const [customerRemarks, setCustomerRemarks] = useState<string>("");
  const [agentRemarks, setAgentRemarks] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const isValid =
    proofType === "PHOTO"
      ? proofUrl.trim().length > 0 || agentRemarks.trim().length >= 5
      : proofType === "OTP"
        ? otpCode.trim().length >= 4
        : agentRemarks.trim().length >= 5;

  const handleProofTypeChange = (newType: DeliveryProofType) => {
    setProofType(newType);
    setErrorMessage("");
    if (newType === "OTP") {
      setOtpVerified(true);
    }
  };

  const handleProofFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    try {
      setErrorMessage("");
      const dataUrl = await convertFileToDataUrl(selectedFile);
      setProofUrl(dataUrl);
      setProofType("PHOTO");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to upload delivery proof image.";

      setErrorMessage(message);
    } finally {
      event.target.value = "";
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    setErrorMessage("");

    if (!isValid) {
      setErrorMessage(
        "Please provide valid delivery proof, OTP, or remarks before completing delivery."
      );
      return;
    }

    const payload: CreateDeliveryProofPayload = {
      assignmentId: assignment.assignmentId ?? assignment.id,
      taskId: assignment.taskId,
      orderId: assignment.orderId ?? assignment.taskId,
      orderDbId: assignment.orderDbId,
      agentId: assignment.agentId ?? "",
      agentName: assignment.agentName ?? "Delivery Agent",
      proofType,
      proofUrl: proofType === "PHOTO" ? proofUrl || undefined : undefined,
      otpCode: proofType === "OTP" ? otpCode.trim() || undefined : undefined,
      otpVerified: proofType === "OTP" ? otpCode.trim().length >= 4 : otpVerified,
      customerRemarks: customerRemarks.trim() || undefined,
      agentRemarks: agentRemarks.trim() || undefined
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit delivery proof.";

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
                    Complete Delivery With Proof
                  </h5>
                  <p className="text-muted small mb-0">
                    Order: {assignment.orderId ?? assignment.taskId} ·{" "}
                    {assignment.customerName}
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
                    <strong>Order:</strong>{" "}
                    {assignment.orderId ?? assignment.taskId}
                  </div>

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
                  <label className="form-label fw-semibold">Proof Type</label>

                  <select
                    className="form-select"
                    value={proofType}
                    disabled={isSaving}
                    onChange={(event) =>
                      handleProofTypeChange(event.target.value as DeliveryProofType)
                    }
                  >
                    <option value="PHOTO">Photo Proof</option>
                    <option value="OTP">OTP Proof</option>
                    <option value="MANUAL">Manual Confirmation</option>
                  </select>
                </div>

                {proofType === "PHOTO" ? (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Upload Delivery Proof Image
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
                ) : null}

                {proofType === "OTP" ? (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">OTP Code</label>
                    <input
                      className="form-control"
                      value={otpCode}
                      disabled={isSaving}
                      onChange={(event) => {
                        setOtpCode(event.target.value);
                        setErrorMessage("");
                      }}
                      placeholder="Enter customer OTP (min 4 characters)"
                    />
                  </div>
                ) : null}

                {proofType === "PHOTO" && proofUrl ? (
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
                        alt="Delivery Proof Preview"
                        className="img-fluid rounded"
                        style={{ maxHeight: "220px", objectFit: "contain" }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="form-check form-switch mb-3">
                  <input
                    id="deliveryOtpVerified"
                    type="checkbox"
                    className="form-check-input"
                    checked={otpVerified}
                    disabled={isSaving || proofType === "OTP"}
                    onChange={(event) => setOtpVerified(event.target.checked)}
                  />
                  <label
                    htmlFor="deliveryOtpVerified"
                    className="form-check-label fw-medium"
                  >
                    Customer handover verified
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
                    placeholder="Example: Customer received package."
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
                    placeholder="Example: Delivered at customer address."
                  />

                  <div className="form-text">
                    {proofType === "MANUAL"
                      ? "Required for manual confirmation (min 5 characters)."
                      : proofType === "PHOTO" && !proofUrl
                        ? "Required if proof image is not uploaded (min 5 characters)."
                        : "Optional additional agent notes."}
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
                      Complete Delivery
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

export default DeliveryProofModal;