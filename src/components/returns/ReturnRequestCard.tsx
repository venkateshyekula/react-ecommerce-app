import { useEffect, useMemo, useState } from "react";
import ReturnStatusBadge from "./ReturnStatusBadge";
import ReturnTimeline from "./ReturnTimeline";
import type { ReturnRequest } from "../../types/returnRequest";
import { formatCurrency } from "../../utils/currencyFormatter";
import {
  canApproveReturn,
  canCancelReturn,
  canFailQualityCheck,
  canMarkReceivedAtWarehouse,
  canPassQualityCheck,
  canRejectReturn,
  canStartQualityCheck,
  formatReturnLabel,
} from "../../utils/returnWorkflowUtils";

export interface ReturnRequestCardProps {
  request: ReturnRequest;
  mode: "SUPPORT" | "CUSTOMER";
  isUpdating?: boolean;

  onApprove?: (
    currentRequest: ReturnRequest,
    remarks?: string,
  ) => Promise<void>;

  onReject?: (
    currentRequest: ReturnRequest,
    remarks: string,
  ) => Promise<void>;

  onReceivedAtWarehouse?: (
    currentRequest: ReturnRequest,
    remarks?: string,
  ) => Promise<void>;

  onStartQualityCheck?: (
    currentRequest: ReturnRequest,
    remarks?: string,
  ) => Promise<void>;

  onQualityCheckPassed?: (
    currentRequest: ReturnRequest,
    remarks?: string,
  ) => Promise<void>;

  onQualityCheckFailed?: (
    currentRequest: ReturnRequest,
    remarks: string,
  ) => Promise<void>;

  onRefundCompleted?: (
    currentRequest: ReturnRequest,
    remarks?: string,
  ) => Promise<void>;

  onClose?: (
    currentRequest: ReturnRequest,
    remarks?: string,
  ) => Promise<void>;

  onCancel?: (
    currentRequest: ReturnRequest,
    remarks?: string,
  ) => Promise<void>;
}

const getRequestDisplayId = (request: ReturnRequest): string => {
  return request.returnRequestId ?? request.requestId ?? "";
};

const isRefundCompletionAllowed = (request: ReturnRequest): boolean => {
  return (
    request.status === "REFUND_INITIATED" ||
    request.refundStatus === "PROCESSING" ||
    request.refundStatus === "INITIATED"
  );
};

const isCloseAllowed = (request: ReturnRequest): boolean => {
  return (
    request.status === "REFUNDED" ||
    request.status === "REFUND_COMPLETED" ||
    request.status === "REJECTED" ||
    request.status === "QUALITY_CHECK_FAILED" ||
    request.status === "CANCELLED"
  );
};

const formatDateTime = (dateValue?: string | null): string => {
  if (!dateValue) {
    return "-";
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString("en-IN");
};

const ReturnRequestCard = ({
  request,
  isUpdating = false,
  mode,
  onApprove,
  onReject,
  onReceivedAtWarehouse,
  onStartQualityCheck,
  onQualityCheckPassed,
  onQualityCheckFailed,
  onRefundCompleted,
  onClose,
  onCancel,
}: ReturnRequestCardProps) => {
  const [remarks, setRemarks] = useState<string>(
    request.adminRemarks ?? request.qualityCheckRemarks ?? "",
  );

  useEffect(() => {
    setRemarks(request.adminRemarks ?? request.qualityCheckRemarks ?? "");
  }, [request]);

  const requestDisplayId = getRequestDisplayId(request);

  const totalItems = useMemo(() => {
    return request.items.reduce((total, item) => total + item.quantity, 0);
  }, [request.items]);

  const refundAmount = useMemo(() => {
    return (
      request.refundAmount ??
      request.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      )
    );
  }, [request]);

  const pickupSummary = useMemo(() => {
    if (!request.pickupDate && !request.pickupSlot) {
      return "Not scheduled";
    }

    const pickupDateText = request.pickupDate
      ? new Date(request.pickupDate).toLocaleDateString("en-IN")
      : "Date pending";

    return `${pickupDateText} · ${request.pickupSlot ?? "Slot pending"}`;
  }, [request.pickupDate, request.pickupSlot]);

  const getCleanRemarks = (): string | undefined => {
    const trimmedRemarks = remarks.trim();

    return trimmedRemarks.length > 0 ? trimmedRemarks : undefined;
  };

  const getRequiredRemarks = (): string => {
    return remarks.trim();
  };

  return (
    <div className="return-request-card bg-white border rounded-4 p-4 h-100 shadow-sm d-flex flex-column justify-content-between">
      <div>
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
          <div className="min-w-0">
            <span className="badge text-bg-light border mb-2">
              {requestDisplayId}
            </span>

            <h5 className="fw-bold mb-1">
              Return for order {request.orderId}
            </h5>

            <p className="text-muted small mb-0">
              Customer: <strong>{request.userName ?? request.userId}</strong>
            </p>

            <p className="text-muted small mb-0">
              Requested:{" "}
              <strong>
                {formatDateTime(request.createdAt ?? request.requestedAt)}
              </strong>
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-start justify-content-lg-end">
            <ReturnStatusBadge type="RETURN" status={request.status} />

            <ReturnStatusBadge
              type="PICKUP"
              status={request.pickupStatus ?? "NOT_SCHEDULED"}
            />

            <ReturnStatusBadge
              type="QC"
              status={request.qualityCheckStatus ?? "NOT_STARTED"}
            />
          </div>
        </div>

        {request.pickupPartnerName &&
        request.pickupStatus !== "NOT_SCHEDULED" ? (
          <div className="alert alert-light border small mb-3">
            Assigned Partner: <strong>{request.pickupPartnerName}</strong>
            {request.pickupPartnerPhone ? (
              <>
                {" "}
                · Phone: <strong>{request.pickupPartnerPhone}</strong>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="return-request-items mb-3 d-flex flex-column gap-2">
          {request.items.map((item, index) => (
            <div
              className="return-request-item d-flex align-items-center gap-3 p-2 border rounded-3 bg-light-subtle"
              key={`${item.productId}-${item.selectedSize ?? "no-size"}-${index}`}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="rounded border flex-shrink-0"
                  style={{ width: "45px", height: "45px", objectFit: "cover" }}
                />
              ) : (
                <div
                  className="return-request-item-placeholder rounded border flex-shrink-0 d-flex align-items-center justify-content-center bg-light text-muted"
                  style={{ width: "45px", height: "45px" }}
                >
                  <i className="bi bi-box" />
                </div>
              )}

              <div className="flex-grow-1 min-w-0">
                <strong className="d-block text-truncate small">
                  {item.name}
                </strong>

                <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>
                  Qty {item.quantity}
                  {item.selectedSize ? ` · Size ${item.selectedSize}` : ""}
                  {item.category ? ` · ${item.category}` : ""}
                </p>

                <p className="mb-0" style={{ fontSize: "0.75rem" }}>
                  Reason:{" "}
                  <span className="fw-semibold text-secondary">
                    {formatReturnLabel(request.returnReason ?? request.reason)}
                  </span>
                </p>
              </div>

              <strong className="small flex-shrink-0">
                {formatCurrency(item.price * item.quantity)}
              </strong>
            </div>
          ))}
        </div>

        <div className="return-request-meta-grid mb-3">
          <div>
            <span>Total Items</span>
            <strong>{totalItems}</strong>
          </div>

          <div>
            <span>Refund Amount</span>
            <strong>{formatCurrency(refundAmount)}</strong>
          </div>

          <div>
            <span>Refund Preference</span>
            <strong>{formatReturnLabel(request.refundPreference)}</strong>
          </div>

          <div>
            <span>Refund Status</span>
            <strong>{formatReturnLabel(request.refundStatus)}</strong>
          </div>

          <div>
            <span>Pickup Summary</span>
            <strong>{pickupSummary}</strong>
          </div>

          <div>
            <span>Refund Transaction ID</span>
            <strong>{request.refundId ?? "Not created"}</strong>
          </div>

          <div>
            <span>Order DB ID</span>
            <strong className="return-request-long-value">
              {request.orderDbId}
            </strong>
          </div>

          <div>
            <span>Status Label</span>
            <strong>{formatReturnLabel(request.status)}</strong>
          </div>
        </div>

        <div className="alert alert-light border small mb-3">
          <strong>Return Reason Summary:</strong>{" "}
          {request.returnReason ?? request.reason}

          {request.customerComment ?? request.comments ? (
            <>
              <br />
              <strong>Customer Comment:</strong>{" "}
              {request.customerComment ?? request.comments}
            </>
          ) : null}

          {request.pickupAddress ? (
            <>
              <br />
              <strong>Pickup Full Address:</strong> {request.pickupAddress}
            </>
          ) : null}
        </div>

        {request.adminRemarks ? (
          <div className="alert alert-info small mb-3 shadow-sm">
            <strong>Admin Remarks Log:</strong> {request.adminRemarks}
          </div>
        ) : null}

        {request.qualityCheckRemarks ? (
          <div className="alert alert-warning small mb-3 shadow-sm">
            <strong>Quality Inspection Remarks:</strong>{" "}
            {request.qualityCheckRemarks}
          </div>
        ) : null}

        <ReturnTimeline request={request} />
      </div>

      <div>
        {mode === "SUPPORT" ? (
          <div className="return-management-actions mt-3 pt-3 border-top">
            <label
              htmlFor={`return-remarks-${request.id}`}
              className="form-label fw-semibold small"
            >
              Admin / QC / Refund Action Remarks
            </label>

            <textarea
              id={`return-remarks-${request.id}`}
              className="form-control mb-3"
              rows={2}
              value={remarks}
              disabled={isUpdating}
              placeholder="Add remarks for approval, rejection, quality check, refund settlement, or closure..."
              onChange={(event) => setRemarks(event.target.value)}
            />

            <div className="d-flex flex-wrap gap-2">
              {canApproveReturn(request) && onApprove ? (
                <button
                  type="button"
                  className="btn btn-sm btn-primary px-3"
                  disabled={isUpdating}
                  onClick={() => void onApprove(request, getCleanRemarks())}
                >
                  Approve
                </button>
              ) : null}

              {canRejectReturn(request) && onReject ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  disabled={isUpdating || remarks.trim().length === 0}
                  onClick={() => void onReject(request, getRequiredRemarks())}
                >
                  Reject
                </button>
              ) : null}

              {canMarkReceivedAtWarehouse(request) &&
              onReceivedAtWarehouse ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  disabled={isUpdating}
                  onClick={() =>
                    void onReceivedAtWarehouse(request, getCleanRemarks())
                  }
                >
                  Received at Warehouse
                </button>
              ) : null}

              {canStartQualityCheck(request) && onStartQualityCheck ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  disabled={isUpdating}
                  onClick={() =>
                    void onStartQualityCheck(request, getCleanRemarks())
                  }
                >
                  Start QC
                </button>
              ) : null}

              {canPassQualityCheck(request) && onQualityCheckPassed ? (
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  disabled={isUpdating}
                  onClick={() =>
                    void onQualityCheckPassed(request, getCleanRemarks())
                  }
                >
                  QC Passed + Create Refund
                </button>
              ) : null}

              {canFailQualityCheck(request) && onQualityCheckFailed ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  disabled={isUpdating || remarks.trim().length === 0}
                  onClick={() =>
                    void onQualityCheckFailed(request, getRequiredRemarks())
                  }
                >
                  QC Failed
                </button>
              ) : null}

              {isRefundCompletionAllowed(request) && onRefundCompleted ? (
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  disabled={isUpdating}
                  onClick={() =>
                    void onRefundCompleted(request, getCleanRemarks())
                  }
                >
                  Mark Refund Completed
                </button>
              ) : null}

              {isCloseAllowed(request) && onClose ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={isUpdating}
                  onClick={() => void onClose(request, getCleanRemarks())}
                >
                  Close Return
                </button>
              ) : null}

              {onCancel && canCancelReturn(request) ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark"
                  disabled={isUpdating || remarks.trim().length === 0}
                  onClick={() => void onCancel(request, getRequiredRemarks())}
                >
                  Cancel Request
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {mode === "CUSTOMER" && canCancelReturn(request) ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-danger w-100 mt-3"
            disabled={isUpdating}
            onClick={() => void onCancel?.(request, "Cancelled by customer.")}
          >
            Cancel Return Request
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ReturnRequestCard;