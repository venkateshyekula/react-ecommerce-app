import { useState } from "react";
import type { SellerReturnDispute } from "../../types/sellerReturnDispute";
import { formatReturnLabel } from "../../utils/sellerReturnWorkflowUtils";
import AdminSellerEvidencePreview from "./AdminSellerEvidencePreview";
import AdminReturnDisputeTimeline from "./AdminReturnDisputeTimeline";

type AdminReturnDisputeReviewPanelProps = {
  dispute: SellerReturnDispute;
  isSaving: boolean;
  onApprove: (remarks: string) => Promise<void>;
  onReject: (remarks: string) => Promise<void>;
  onNeedEvidence: (remarks: string) => Promise<void>;
};

const MIN_REMARKS_LENGTH = 5;

const getDisputeBadgeClass = (status?: string | null): string => {
  const normalizedStatus = status?.trim().toUpperCase() ?? "";

  if (["APPROVED", "RESOLVED", "ACCEPTED"].includes(normalizedStatus)) {
    return "text-bg-success";
  }

  if (["REJECTED", "DECLINED", "CANCELLED"].includes(normalizedStatus)) {
    return "text-bg-danger";
  }

  if (normalizedStatus === "NEEDS_MORE_EVIDENCE") {
    return "text-bg-info";
  }

  return "text-bg-warning text-dark";
};

const AdminReturnDisputeReviewPanel = ({
  dispute,
  isSaving,
  onApprove,
  onReject,
  onNeedEvidence
}: AdminReturnDisputeReviewPanelProps) => {
  const [remarks, setRemarks] = useState<string>("");

  const isRemarksInvalid = remarks.trim().length < MIN_REMARKS_LENGTH;

  const hasSellerReReviewEvidence =
    Boolean(dispute.sellerAdditionalRemarks) ||
    Boolean(dispute.sellerEvidence && dispute.sellerEvidence.length > 0);

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        {/* Header Section */}
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
          <div>
            <span className="badge text-bg-light border mb-2">
              {dispute.disputeId}
            </span>

            <h5 className="fw-bold mb-1">{dispute.productName}</h5>

            <p className="text-muted small mb-0">
              Seller: {dispute.sellerName} · Order {dispute.orderId}
            </p>
          </div>

          <span
            className={`badge align-self-start ${getDisputeBadgeClass(
              dispute.status
            )}`}
          >
            {formatReturnLabel(dispute.status)}
          </span>
        </div>

        {/* Details Box */}
        <div className="alert alert-light border small">
          <div>
            <strong>Return ID:</strong> {dispute.returnRequestId}
          </div>
          <div>
            <strong>Product ID:</strong> {dispute.productId}
          </div>
          <div>
            <strong>Reason:</strong> {formatReturnLabel(dispute.disputeReason)}
          </div>
          <div>
            <strong>Description:</strong> {dispute.disputeDescription}
          </div>
          {dispute.qcRemarks ? (
            <div>
              <strong>Warehouse QC Remarks:</strong> {dispute.qcRemarks}
            </div>
          ) : null}
        </div>

        {dispute.adminRemarks ? (
          <div className="alert alert-info small">
            <strong>Previous Admin Remarks:</strong> {dispute.adminRemarks}
          </div>
        ) : null}

        {/* Evidence & Timeline Split */}
        <div className="row g-3 mb-3">
          <div className="col-xl-7">
            <AdminSellerEvidencePreview dispute={dispute} />
          </div>

          <div className="col-xl-5">
            <AdminReturnDisputeTimeline dispute={dispute} />
          </div>
        </div>

        {hasSellerReReviewEvidence ? (
          <div className="alert alert-success small mb-3">
            <i className="bi bi-info-circle me-1" />
            Seller has submitted additional evidence. Review the seller response
            and evidence before making a final decision.
          </div>
        ) : null}

        {/* Admin Input */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Admin Review Remarks</label>
          <textarea
            className="form-control"
            rows={4}
            value={remarks}
            disabled={isSaving}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Add decision remarks for seller and internal return review..."
          />
          <div className="form-text">
            {isRemarksInvalid ? (
              <span className="text-warning">
                <i className="bi bi-exclamation-triangle me-1" />
                Remarks must be at least {MIN_REMARKS_LENGTH} characters long
                to take action.
              </span>
            ) : (
              "Remarks will be visible to the seller."
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex flex-wrap justify-content-end gap-2 mt-3">
          <button
            type="button"
            className="btn btn-outline-warning"
            disabled={isSaving || isRemarksInvalid}
            onClick={() => void onNeedEvidence(remarks.trim())}
          >
            {isSaving ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : (
              <i className="bi bi-question-circle me-2" />
            )}
            Need More Evidence
          </button>

          <button
            type="button"
            className="btn btn-outline-danger"
            disabled={isSaving || isRemarksInvalid}
            onClick={() => void onReject(remarks.trim())}
          >
            {isSaving ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : (
              <i className="bi bi-x-circle me-2" />
            )}
            Reject Dispute
          </button>

          <button
            type="button"
            className="btn btn-success"
            disabled={isSaving || isRemarksInvalid}
            onClick={() => void onApprove(remarks.trim())}
          >
            {isSaving ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : (
              <i className="bi bi-check-circle me-2" />
            )}
            Approve Seller Dispute
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminReturnDisputeReviewPanel;