import { useMemo, useState } from "react";
import type { ReturnRequest } from "../../types/returnRequest";
import type {
  ReturnRefundFailureReason,
  ReturnRefundSettlement,
  ReturnRefundSettlementMode,
} from "../../types/returnRefundSettlement";
import { returnRefundSettlementService } from "../../services/returnRefundSettlementService";
import { formatCurrency } from "../../utils/currencyFormatter";
import {
  formatSettlementLabel,
  getReturnRefundAmount,
  getSettlementStatusBadgeClass,
  returnRefundSettlementModeOptions,
} from "../../utils/returnRefundSettlementUtils";

interface ReturnRefundSettlementPanelProps {
  request: ReturnRequest;
  settlement?: ReturnRefundSettlement | null;
  currentUser?: {
    id: string;
    name: string;
  } | null;
  canManageSettlement?: boolean;
  onSettlementChanged: () => Promise<void>;
}

const ReturnRefundSettlementPanel = ({
  request,
  settlement = null,
  currentUser = null,
  canManageSettlement = false,
  onSettlementChanged,
}: ReturnRefundSettlementPanelProps) => {
  const [settlementMode, setSettlementMode] =
    useState<ReturnRefundSettlementMode>(
      request.refundPreference === "WALLET"
        ? "WALLET"
        : "ORIGINAL_PAYMENT_MODE",
    );
  const [failureReason, setFailureReason] =
    useState<ReturnRefundFailureReason>("PAYMENT_GATEWAY_FAILURE");
  const [failureRemarks, setFailureRemarks] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const refundAmount = useMemo(() => {
    return getReturnRefundAmount(request);
  }, [request]);

  const canQueue =
    canManageSettlement && !settlement && request.qualityCheckStatus === "PASSED";

  const canProcess =
    canManageSettlement &&
    settlement &&
    (settlement.settlementStatus === "QUEUED" ||
      settlement.settlementStatus === "FAILED" ||
      settlement.settlementStatus === "MANUAL_REVIEW");

  const canFail =
    canManageSettlement &&
    settlement &&
    (settlement.settlementStatus === "QUEUED" ||
      settlement.settlementStatus === "PROCESSING");

  const handleQueueSettlement = async (): Promise<void> => {
    if (!currentUser) {
      setErrorMessage("Login is required to queue refund settlement.");
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMessage("");

      await returnRefundSettlementService.queueSettlementForReturn({
        request,
        settlementMode,
        queuedByUserId: currentUser.id,
        queuedByName: currentUser.name,
        settlementRemarks: remarks.trim() || null,
      });

      setRemarks("");
      await onSettlementChanged();
    } catch {
      setErrorMessage("Unable to queue refund settlement.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProcessSettlement = async (): Promise<void> => {
    if (!currentUser || !settlement) {
      setErrorMessage("Login is required to process settlement.");
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMessage("");

      await returnRefundSettlementService.processSettlement({
        settlement,
        payload: {
          processedByUserId: currentUser.id,
          processedByName: currentUser.name,
          settlementRemarks: remarks.trim() || settlement.settlementRemarks,
        },
      });

      setRemarks("");
      await onSettlementChanged();
    } catch {
      setErrorMessage("Unable to process refund settlement.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFailSettlement = async (): Promise<void> => {
    if (!currentUser || !settlement) {
      setErrorMessage("Login is required to fail settlement.");
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMessage("");

      await returnRefundSettlementService.failSettlement({
        settlement,
        payload: {
          processedByUserId: currentUser.id,
          processedByName: currentUser.name,
          failureReason,
          failureRemarks: failureRemarks.trim(),
        },
      });

      setFailureRemarks("");
      await onSettlementChanged();
    } catch {
      setErrorMessage("Unable to mark settlement failed.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="return-refund-settlement-panel bg-white border rounded-4 p-4 shadow-sm">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
        <div>
          <h5 className="fw-bold mb-1">Refund Settlement Automation</h5>
          <p className="text-muted small mb-0">
            Queue and process refund through original payment, wallet, or coupon
            compensation.
          </p>
        </div>

        {settlement ? (
          <span
            className={`badge align-self-start ${getSettlementStatusBadgeClass(
              settlement.settlementStatus,
            )}`}
          >
            {formatSettlementLabel(settlement.settlementStatus)}
          </span>
        ) : (
          <span className="badge text-bg-light border align-self-start">
            Not Started
          </span>
        )}
      </div>

      {errorMessage ? (
        <div className="alert alert-danger small mb-3">{errorMessage}</div>
      ) : null}

      {!canManageSettlement ? (
        <div className="alert alert-info small mb-3">
          You can view settlement details, but only Admin or Refund Support users
          can queue and process settlements.
        </div>
      ) : null}

      <div className="return-refund-settlement-meta-grid mb-3">
        <div>
          <span>Return ID</span>
          <strong>{request.returnRequestId ?? request.requestId}</strong>
        </div>

        <div>
          <span>Order ID</span>
          <strong>{request.orderId}</strong>
        </div>

        <div>
          <span>Refund Amount</span>
          <strong>{formatCurrency(refundAmount)}</strong>
        </div>

        <div>
          <span>QC Status</span>
          <strong>{request.qualityCheckStatus ?? "-"}</strong>
        </div>
      </div>

      {settlement ? (
        <div className="return-refund-settlement-details mb-3">
          <div className="row g-3 small">
            <div className="col-md-6">
              <span>Settlement ID</span>
              <strong>{settlement.settlementId}</strong>
            </div>

            <div className="col-md-6">
              <span>Mode</span>
              <strong>{formatSettlementLabel(settlement.settlementMode)}</strong>
            </div>

            <div className="col-md-6">
              <span>Gateway Reference</span>
              <strong>{settlement.gatewayReferenceId ?? "-"}</strong>
            </div>

            <div className="col-md-6">
              <span>Wallet Transaction</span>
              <strong>{settlement.walletTransactionId ?? "-"}</strong>
            </div>

            <div className="col-md-6">
              <span>Coupon Code</span>
              <strong>{settlement.couponCode ?? "-"}</strong>
            </div>

            <div className="col-md-6">
              <span>Settled At</span>
              <strong>
                {settlement.settledAt && !isNaN(new Date(settlement.settledAt).getTime())
                  ? new Date(settlement.settledAt).toLocaleString("en-IN")
                  : "-"}
              </strong>
            </div>
          </div>

          {settlement.failureRemarks ? (
            <div className="alert alert-danger small mt-3 mb-0">
              <strong>Failure:</strong>{" "}
              {formatSettlementLabel(settlement.failureReason)} -{" "}
              {settlement.failureRemarks}
            </div>
          ) : null}
        </div>
      ) : null}

      {!settlement ? (
        <div className="return-refund-settlement-form-stack">
          <div>
            <label className="form-label small fw-semibold">
              Settlement Mode
            </label>

            <select
              className="form-select"
              value={settlementMode}
              disabled={isUpdating || !canQueue}
              onChange={(event) =>
                setSettlementMode(
                  event.target.value as ReturnRefundSettlementMode,
                )
              }
            >
              {returnRefundSettlementModeOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <p className="text-muted small mt-2 mb-0">
              {
                returnRefundSettlementModeOptions.find(
                  (option) => option.value === settlementMode,
                )?.description
              }
            </p>
          </div>

          <div className="mt-3">
            <label className="form-label small fw-semibold">
              Settlement Remarks
            </label>

            <textarea
              className="form-control"
              rows={3}
              value={remarks}
              disabled={isUpdating || !canQueue}
              placeholder="Add settlement instruction or refund note..."
              onChange={(event) => setRemarks(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary mt-3"
            disabled={isUpdating || !canQueue}
            onClick={() => void handleQueueSettlement()}
          >
            {isUpdating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Queueing...
              </>
            ) : (
              "Queue Refund Settlement"
            )}
          </button>
        </div>
      ) : null}

      {settlement ? (
        <div className="return-refund-settlement-actions mt-3">
          <button
            type="button"
            className="btn btn-success me-2 mb-3"
            disabled={isUpdating || !canProcess}
            onClick={() => void handleProcessSettlement()}
          >
            {isUpdating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Processing...
              </>
            ) : (
              "Process Settlement"
            )}
          </button>

          <div className="return-refund-failure-box p-3 border rounded bg-light">
            <label className="form-label small fw-semibold">
              Failure Reason
            </label>

            <select
              className="form-select"
              value={failureReason}
              disabled={isUpdating || !canFail}
              onChange={(event) =>
                setFailureReason(event.target.value as ReturnRefundFailureReason)
              }
            >
              <option value="PAYMENT_GATEWAY_FAILURE">
                Payment Gateway Failure
              </option>
              <option value="BANK_REVERSAL_FAILED">Bank Reversal Failed</option>
              <option value="WALLET_CREDIT_FAILED">Wallet Credit Failed</option>
              <option value="COUPON_GENERATION_FAILED">
                Coupon Generation Failed
              </option>
              <option value="CUSTOMER_ACCOUNT_MISMATCH">
                Customer Account Mismatch
              </option>
              <option value="MANUAL_REVIEW_REQUIRED">
                Manual Review Required
              </option>
              <option value="OTHER">Other</option>
            </select>

            <textarea
              className="form-control mt-2"
              rows={2}
              value={failureRemarks}
              disabled={isUpdating || !canFail}
              placeholder="Add failure remarks before marking failed..."
              onChange={(event) => setFailureRemarks(event.target.value)}
            />

            <button
              type="button"
              className="btn btn-outline-danger mt-2"
              disabled={
                isUpdating || !canFail || failureRemarks.trim().length === 0
              }
              onClick={() => void handleFailSettlement()}
            >
              Mark Settlement Failed
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReturnRefundSettlementPanel;