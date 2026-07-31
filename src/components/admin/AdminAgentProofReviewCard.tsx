import { useState, useEffect } from "react";
import { agentProofVerificationService } from "../../services/agentProofVerificationService";
import type {
  AgentProofReviewRow,
  AgentProofVerificationStatus
} from "../../types/agentProofVerification";

type AdminAgentProofReviewCardProps = {
  row: AgentProofReviewRow;
  isSaving: boolean;
  onReview: ({
    row,
    status,
    remarks
  }: {
    row: AgentProofReviewRow;
    status: AgentProofVerificationStatus;
    remarks: string;
  }) => Promise<void>;
};

const formatLabel = (value?: string): string => {
  if (!value) {
    return "Not Available";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getVerificationBadgeClass = (
  status: AgentProofVerificationStatus
): string => {
  if (status === "VERIFIED") {
    return "text-bg-success";
  }

  if (status === "REJECTED") {
    return "text-bg-danger";
  }

  return "text-bg-warning text-dark";
};

const isValidUrlOrDataUri = (url?: string): boolean => {
  if (!url) return false;

  const trimmedUrl = url.trim();

  // Valid standard web URLs
  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://") || trimmedUrl.startsWith("/")) {
    return true;
  }

  // Valid base64 Data URI check
  if (trimmedUrl.startsWith("data:image/")) {
    const parts = trimmedUrl.split(",");
    // Ensure comma separator exists and base64 string is not empty
    return parts.length === 2 && parts[1].trim().length > 0;
  }

  return false;
};

const isImageProof = (row: AgentProofReviewRow): boolean => {
  const proofUrl = row.proofUrl?.toLowerCase().trim() ?? "";

  return (
    row.proofType === "PHOTO" ||
    proofUrl.startsWith("data:image/") ||
    proofUrl.endsWith(".png") ||
    proofUrl.endsWith(".jpg") ||
    proofUrl.endsWith(".jpeg") ||
    proofUrl.endsWith(".webp")
  );
};

const AdminAgentProofReviewCard = ({
  row,
  isSaving,
  onReview
}: AdminAgentProofReviewCardProps) => {
  const [reviewRemarks, setReviewRemarks] = useState<string>(
    row.reviewRemarks ?? ""
  );
  const [hasImageError, setHasImageError] = useState<boolean>(false);

  useEffect(() => {
    setReviewRemarks(row.reviewRemarks ?? "");
    setHasImageError(false);
  }, [row.reviewRemarks, row.proofUrl]);

  const isRemarksInvalid = reviewRemarks.trim().length < 5;
  const isProofValid = isValidUrlOrDataUri(row.proofUrl);

  return (
    <div className="card border-0 shadow-sm rounded-4 h-100">
      <div className="card-body p-4 d-flex flex-column justify-content-between">
        <div>
          {/* Header Section */}
          <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 mb-3">
            <div>
              <div className="d-flex flex-wrap gap-2 mb-2">
                <span className="badge text-bg-light border">
                  {row.proofId}
                </span>

                <span className="badge text-bg-light border">
                  {formatLabel(row.sourceType)}
                </span>

                <span className="badge text-bg-light border">
                  {formatLabel(row.taskType)}
                </span>
              </div>

              <h5 className="fw-bold mb-1">
                {row.customerName ?? "Customer"}
              </h5>

              <p className="text-muted small mb-0">
                Task: <strong>{row.taskId}</strong>
                {row.orderId ? (
                  <>
                    {" "}
                    · Order: <strong>{row.orderId}</strong>
                  </>
                ) : null}
              </p>
            </div>

            <span
              className={`badge align-self-start ${getVerificationBadgeClass(
                row.verificationStatus
              )}`}
            >
              {formatLabel(row.verificationStatus)}
            </span>
          </div>

          {/* Details Box */}
          <div className="alert alert-light border small">
            <div>
              <strong>Agent:</strong> {row.agentName} ({row.agentId})
            </div>

            {row.assignmentStatus ? (
              <div>
                <strong>Assignment Status:</strong>{" "}
                {formatLabel(row.assignmentStatus)}
              </div>
            ) : null}

            <div>
              <strong>Proof Type:</strong> {formatLabel(row.proofType)}
            </div>

            <div>
              <strong>Captured:</strong>{" "}
              {agentProofVerificationService.formatDateTime(row.capturedAt)}
            </div>

            {row.address ? (
              <div>
                <strong>Address:</strong> {row.address}
              </div>
            ) : null}
          </div>

          {/* Proof Preview Box */}
          {row.proofUrl && isProofValid && !hasImageError ? (
            <div className="border rounded-4 p-3 mb-3 bg-light">
              <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                <h6 className="fw-bold mb-0">Proof Preview</h6>

                <a
                  href={row.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-primary"
                >
                  View
                  <i className="bi bi-box-arrow-up-right ms-1" />
                </a>
              </div>

              {isImageProof(row) ? (
                <div className="text-center bg-white border rounded-3 p-2">
                  <img
                    src={row.proofUrl}
                    alt={`Proof for task ${row.taskId}`}
                    className="img-fluid rounded"
                    style={{ maxHeight: "220px", objectFit: "contain" }}
                    onError={() => setHasImageError(true)}
                  />
                </div>
              ) : (
                <div className="small text-muted">
                  This proof is not an image preview. Use View to open it.
                </div>
              )}
            </div>
          ) : (
            <div className="alert alert-warning border small mb-3">
              {row.proofUrl && (hasImageError || !isProofValid)
                ? "Invalid or corrupted proof URL/image structure."
                : "No proof image or proof URL attached."}
            </div>
          )}

          {/* Additional Info Alerts */}
          {row.otpCode || typeof row.otpVerified === "boolean" ? (
            <div className="alert alert-info small">
              <strong>OTP Verified:</strong> {row.otpVerified ? "Yes" : "No"}
              {row.otpCode ? (
                <div>
                  <strong>OTP Code:</strong> {row.otpCode}
                </div>
              ) : null}
            </div>
          ) : null}

          {row.agentRemarks ? (
            <div className="alert alert-secondary small">
              <strong>Agent Remarks:</strong> {row.agentRemarks}
            </div>
          ) : null}

          {row.customerRemarks ? (
            <div className="alert alert-light border small">
              <strong>Customer Remarks:</strong> {row.customerRemarks}
            </div>
          ) : null}

          {row.reviewedAt ? (
            <div className="alert alert-success small">
              <strong>Reviewed By:</strong> {row.reviewedByName ?? "Admin"}
              <br />
              <strong>Reviewed At:</strong>{" "}
              {agentProofVerificationService.formatDateTime(row.reviewedAt)}
              {row.reviewRemarks ? (
                <>
                  <br />
                  <strong>Review Remarks:</strong> {row.reviewRemarks}
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Form Controls */}
        <div className="mt-3">
          <label className="form-label fw-semibold">Review Remarks</label>
          <textarea
            className="form-control"
            rows={3}
            value={reviewRemarks}
            disabled={isSaving}
            onChange={(event) => setReviewRemarks(event.target.value)}
            placeholder="Add verification remarks (min 5 characters)..."
          />

          {isRemarksInvalid && reviewRemarks.length > 0 && (
            <div className="form-text text-danger">
              Remarks must be at least 5 characters long.
            </div>
          )}

          <div className="d-flex flex-wrap justify-content-end gap-2 mt-3">
            <button
              type="button"
              className="btn btn-outline-danger"
              disabled={isSaving || isRemarksInvalid}
              onClick={() =>
                void onReview({
                  row,
                  status: "REJECTED",
                  remarks: reviewRemarks.trim()
                })
              }
            >
              <i className="bi bi-x-circle me-2" />
              Reject Proof
            </button>

            <button
              type="button"
              className="btn btn-success"
              disabled={isSaving || isRemarksInvalid}
              onClick={() =>
                void onReview({
                  row,
                  status: "VERIFIED",
                  remarks: reviewRemarks.trim()
                })
              }
            >
              <i className="bi bi-check-circle me-2" />
              Verify Proof
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAgentProofReviewCard;