import { useState } from "react";
import type { ReturnPickupProof } from "../../types/returnPackageTracking";
import {
  formatPickupProofVerificationStatus,
  getPickupProofStatusBadgeClass,
  isPickupProofActionable
} from "../../utils/returnPackageTrackingUtils";

interface ReturnPickupProofVerificationPanelProps {
  proofs: ReturnPickupProof[];
  canVerifyProof?: boolean;
  isUpdating?: boolean;
  onVerifyProof: (proof: ReturnPickupProof) => Promise<void>;
  onRejectProof: (
    proof: ReturnPickupProof,
    rejectionReason: string
  ) => Promise<void>;
}

const ReturnPickupProofVerificationPanel = ({
  proofs,
  canVerifyProof = false,
  isUpdating = false,
  onVerifyProof,
  onRejectProof
}: ReturnPickupProofVerificationPanelProps) => {
  const [rejectionReasonByProofId, setRejectionReasonByProofId] = useState<
    Record<string, string>
  >({});
  
  // Track which specific proof card is currently processing an action
  const [actioningProofId, setActioningProofId] = useState<string>("");

  if (proofs.length === 0) {
    return (
      <div className="alert alert-light border small mb-0">
        No pickup proof uploaded yet.
      </div>
    );
  }

  const handleVerify = async (proof: ReturnPickupProof) => {
    setActioningProofId(proof.id);
    try {
      await onVerifyProof(proof);
    } finally {
      setActioningProofId("");
    }
  };

  const handleReject = async (proof: ReturnPickupProof, reason: string) => {
    setActioningProofId(proof.id);
    try {
      await onRejectProof(proof, reason);
      // Clean up local state upon successful rejection submit
      setRejectionReasonByProofId((prev) => {
        const copy = { ...prev };
        delete copy[proof.id];
        return copy;
      });
    } finally {
      setActioningProofId("");
    }
  };

  return (
    <div className="return-pickup-proof-list d-flex flex-column gap-3">
      {proofs.map((proof) => {
        const rejectionReason = rejectionReasonByProofId[proof.id] ?? "";
        const canTakeAction = canVerifyProof && isPickupProofActionable(proof);
        const isCurrentCardProcessing = isUpdating && actioningProofId === proof.id;

        return (
          <div className="return-pickup-proof-card border rounded-4 p-3 bg-white shadow-sm" key={proof.id}>
            <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
              <div>
                <span className="badge text-bg-light border mb-2">
                  {proof.proofId}
                </span>

                <h6 className="fw-bold mb-1">
                  Pickup Proof · {proof.packageCondition}
                </h6>

                <p className="text-muted small mb-0">
                  Uploaded by {proof.uploadedByName ?? "Pickup Agent"} on{" "}
                  {new Date(proof.uploadedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <span
                className={`badge align-self-start ${getPickupProofStatusBadgeClass(
                  proof.verificationStatus
                )}`}
              >
                {formatPickupProofVerificationStatus(proof.verificationStatus)}
              </span>
            </div>

            {/* FIXED: Wrapped data URL in a semantic img tag to display the image instead of printing plain text codes */}
            {proof.packagePhotoDataUrl ? (
              <div className="return-pickup-proof-image-wrap mb-3 border rounded overflow-hidden bg-light text-center" style={{ maxHeight: "250px" }}>
                <img 
                  src={proof.packagePhotoDataUrl} 
                  alt={`Condition verification proof for ${proof.proofId}`}
                  className="img-fluid object-fit-contain" 
                  style={{ maxHeight: "250px", width: "100%" }}
                />
              </div>
            ) : null}

            <div className="row g-3 small mb-2">
              <div className="col-md-6">
                <div className="return-proof-info-box border rounded p-2 bg-light-subtle">
                  <span className="text-muted d-block small">OTP Verified</span>
                  <strong className="text-dark">{proof.otpVerified ? "Yes" : "No"}</strong>
                </div>
              </div>

              <div className="col-md-6">
                <div className="return-proof-info-box border rounded p-2 bg-light-subtle">
                  <span className="text-muted d-block small">Signature Captured</span>
                  <strong className="text-dark">
                    {proof.customerSignatureCaptured ? "Yes" : "No"}
                  </strong>
                </div>
              </div>

              <div className="col-md-6">
                <div className="return-proof-info-box border rounded p-2 bg-light-subtle">
                  <span className="text-muted d-block small">Pickup Agent</span>
                  <strong className="text-dark">{proof.pickupAgentName ?? "-"}</strong>
                </div>
              </div>

              <div className="col-md-6">
                <div className="return-proof-info-box border rounded p-2 bg-light-subtle">
                  <span className="text-muted d-block small">Pickup Location</span>
                  <strong className="text-dark">{proof.pickupLocation ?? "-"}</strong>
                </div>
              </div>
            </div>

            {proof.customerRemarks || proof.agentRemarks ? (
              <div className="return-proof-remarks mt-3 border-start border-3 ps-2 py-1 bg-light-subtle small rounded-end">
                {proof.customerRemarks ? (
                  <p className="mb-1">
                    <strong>Customer Remarks:</strong> {proof.customerRemarks}
                  </p>
                ) : null}

                {proof.agentRemarks ? (
                  <p className="mb-0">
                    <strong>Agent Remarks:</strong> {proof.agentRemarks}
                  </p>
                ) : null}
              </div>
            ) : null}

            {proof.rejectionReason ? (
              <div className="alert alert-danger small mt-3 mb-0">
                <strong>Rejected:</strong> {proof.rejectionReason}
              </div>
            ) : null}

            {proof.verificationStatus === "VERIFIED" ? (
              <div className="alert alert-success small mt-3 mb-0">
                Verified by <strong>{proof.verifiedByName}</strong> on{" "}
                {proof.verifiedAt
                  ? new Date(proof.verifiedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                  : "-"}
              </div>
            ) : null}

            {canTakeAction ? (
              <div className="border-top pt-3 mt-3">
                <label
                  htmlFor={`rejectionReason-${proof.id}`}
                  className="form-label small fw-semibold text-secondary"
                >
                  Rejection Reason
                </label>

                <textarea
                  id={`rejectionReason-${proof.id}`}
                  className="form-control form-control-sm"
                  rows={2}
                  placeholder="Enter reason details only if rejecting this proof submission..."
                  value={rejectionReason}
                  disabled={isUpdating}
                  onChange={(event) =>
                    setRejectionReasonByProofId((previousValues) => ({
                      ...previousValues,
                      [proof.id]: event.target.value
                    }))
                  }
                />

                <div className="d-flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-success d-inline-flex align-items-center"
                    disabled={isUpdating}
                    onClick={() => void handleVerify(proof)}
                  >
                    {isCurrentCardProcessing ? (
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                    ) : (
                      <i className="bi bi-check2-circle me-1" />
                    )}
                    Verify Proof
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                    disabled={isUpdating || rejectionReason.trim().length === 0}
                    onClick={() =>
                      void handleReject(proof, rejectionReason.trim())
                    }
                  >
                    {isCurrentCardProcessing ? (
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                    ) : (
                      <i className="bi bi-x-circle me-1" />
                    )}
                    Reject Proof
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default ReturnPickupProofVerificationPanel;