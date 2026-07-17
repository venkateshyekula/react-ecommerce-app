import { useMemo, useState } from "react";
import type { RefundRequest, RefundStatus } from "../../types/refund";
import { formatCurrency } from "../../utils/currencyFormatter";
import {
  buildGatewayRefundReference,
  canCompleteRefund,
  canFailRefund,
  canMarkRefundProcessing,
  canStartRefund,
  formatRefundStatusLabel,
  isRefundReadOnly
} from "../../utils/refundWorkflowUtils";
import RefundRequestStatusBadge from "./RefundRequestStatusBadge";

interface RefundRequestCardProps {
  refund: RefundRequest;
  isUpdating?: boolean;
  onUpdateStatus: ({
    refund,
    status,
    gatewayRefundReferenceId,
    resolutionNote
  }: {
    refund: RefundRequest;
    status: RefundStatus;
    gatewayRefundReferenceId?: string;
    resolutionNote?: string;
  }) => Promise<void>;
}

const RefundRequestCard = ({
  refund,
  isUpdating = false,
  onUpdateStatus
}: RefundRequestCardProps) => {
  const [gatewayRefundReferenceId, setGatewayRefundReferenceId] =
    useState<string>(
      refund.gatewayRefundReferenceId ??
        buildGatewayRefundReference(refund.refundId)
    );

  const [resolutionNote, setResolutionNote] = useState<string>(
    refund.resolutionNote ?? ""
  );

  const readOnly = isRefundReadOnly(refund);

  const recommendedAction = useMemo(() => {
    if (canStartRefund(refund)) {
      return "Review payment/order evidence and start refund if refund is valid.";
    }

    if (canMarkRefundProcessing(refund)) {
      return "Gateway refund has been initiated. Move to processing after refund request is accepted.";
    }

    if (canCompleteRefund(refund)) {
      return "Enter gateway refund reference and complete the refund after settlement confirmation.";
    }

    if (refund.status === "COMPLETED") {
      return "Refund is completed. No further action is required.";
    }

    if (refund.status === "FAILED") {
      return "Refund failed. Review resolution note and retry through a future workflow if needed.";
    }

    return "No action required.";
  }, [refund]);

  const formatRefundModeLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

  return (
    <div className="refund-request-card bg-white border rounded-4 p-4 h-100">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
        <div>
          <span className="badge text-bg-light border mb-2">
            {refund.refundId}
          </span>

          <h5 className="fw-bold mb-1">
            {formatCurrency(refund.amount)} refund request
          </h5>

          <p className="text-muted small mb-0">
            Payment: <strong>{refund.paymentId}</strong>
            {refund.orderId ? (
              <>
                {" "}
                · Order: <strong>{refund.orderId}</strong>
              </>
            ) : (
              " · Order: Not linked"
            )}
          </p>
        </div>

        <div className="d-flex align-items-start gap-2">
          <RefundRequestStatusBadge status={refund.status} />

          <span className="badge text-bg-light border refund-request-mode-badge">
            {formatRefundModeLabel(refund.refundMode)}
          </span>
        </div>
      </div>

      <div className="refund-request-meta-grid mb-3">
        <div>
          <span>Customer</span>
          <strong>{refund.userName ?? refund.userId}</strong>
        </div>

        <div>
          <span>Assigned Team</span>
          <strong>{refund.assignedTeam}</strong>
        </div>

        <div>
          <span>Created By</span>
          <strong>{refund.createdBy}</strong>
        </div>

        <div>
          <span>Created</span>
          <strong>{new Date(refund.createdAt).toLocaleString("en-IN")}</strong>
        </div>
      </div>

      <div className="alert alert-light border small mb-3">
        <strong>Reason:</strong> {refund.reason}
      </div>

      <div className="alert alert-info small mb-3">
        <strong>Recommended action:</strong> {recommendedAction}
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label
            htmlFor={`gateway-ref-${refund.id}`}
            className="form-label fw-semibold"
          >
            Gateway Refund Reference
          </label>

          <input
            id={`gateway-ref-${refund.id}`}
            className="form-control"
            value={gatewayRefundReferenceId}
            disabled={readOnly || isUpdating}
            placeholder="Enter gateway refund reference"
            onChange={(event) =>
              setGatewayRefundReferenceId(event.target.value)
            }
          />
        </div>

        <div className="col-md-6">
          <label
            htmlFor={`resolution-note-${refund.id}`}
            className="form-label fw-semibold"
          >
            Resolution Note {canFailRefund(refund) && <span className="text-danger">*</span>}
          </label>

          <textarea
            id={`resolution-note-${refund.id}`}
            className="form-control"
            rows={3}
            value={resolutionNote}
            disabled={readOnly || isUpdating}
            placeholder="Add refund processing note, settlement details, or failed reason."
            onChange={(event) => setResolutionNote(event.target.value)}
          />
        </div>
      </div>

      {refund.gatewayRefundReferenceId ? (
        <div className="alert alert-success py-2 small">
          <strong>Gateway Reference:</strong> {refund.gatewayRefundReferenceId}
        </div>
      ) : null}

      {refund.resolutionNote ? (
        <div className="alert alert-light border py-2 small">
          <strong>Resolution:</strong> {refund.resolutionNote}
        </div>
      ) : null}

      <div className="d-flex flex-wrap gap-2">
        {canStartRefund(refund) ? (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={isUpdating}
            onClick={() =>
              void onUpdateStatus({
                refund,
                status: "INITIATED",
                gatewayRefundReferenceId,
                resolutionNote:
                  resolutionNote.trim() || "Refund initiated after review."
              })
            }
          >
            Start Refund
          </button>
        ) : null}

        {canMarkRefundProcessing(refund) ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            disabled={isUpdating}
            onClick={() =>
              void onUpdateStatus({
                refund,
                status: "PROCESSING",
                gatewayRefundReferenceId,
                resolutionNote:
                  resolutionNote.trim() ||
                  "Refund moved to processing with gateway."
              })
            }
          >
            Mark Processing
          </button>
        ) : null}

        {canCompleteRefund(refund) ? (
          <button
            type="button"
            className="btn btn-sm btn-success"
            disabled={isUpdating || gatewayRefundReferenceId.trim().length === 0}
            onClick={() =>
              void onUpdateStatus({
                refund,
                status: "COMPLETED",
                gatewayRefundReferenceId,
                resolutionNote:
                  resolutionNote.trim() ||
                  "Refund completed and confirmed with gateway."
              })
            }
          >
            Complete Refund
          </button>
        ) : null}

        {canFailRefund(refund) ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            disabled={isUpdating}
            onClick={() =>
              void onUpdateStatus({
                refund,
                status: "FAILED",
                gatewayRefundReferenceId,
                resolutionNote:
                  resolutionNote.trim()
              })
            }
          >
            Mark Failed
          </button>
        ) : null}

        {readOnly ? (
          <span className="badge text-bg-light border align-self-center">
            {formatRefundStatusLabel(refund.status)}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default RefundRequestCard;