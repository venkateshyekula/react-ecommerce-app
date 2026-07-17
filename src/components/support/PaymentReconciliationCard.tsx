import type { RefundRequest } from "../../types/refund";
import { formatCurrency } from "../../utils/currencyFormatter";
import type { PaymentReconciliationRecord } from "../../utils/paymentReconciliationUtils";
import { formatReconciliationIssueType } from "../../utils/paymentReconciliationUtils";
import PaymentReconciliationStatusBadge from "./PaymentReconciliationStatusBadge";

interface PaymentReconciliationCardProps {
  record: PaymentReconciliationRecord;
  isCreatingRefund?: boolean;
  onCreateRefundRequest: (record: PaymentReconciliationRecord) => Promise<void>;
}

const formatRefundStatus = (refund: RefundRequest): string => {
  if (!refund?.status) return "Unknown";
  return refund.status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatDisplayValue = (value?: string | null): string => {
  return value && value.trim().length > 0 ? value : "-";
};

const PaymentReconciliationCard = ({
  record,
  isCreatingRefund = false,
  onCreateRefundRequest,
}: PaymentReconciliationCardProps) => {
  const { payment, checkoutSession, refundRequests } = record;

  const handleRefundClick = async (): Promise<void> => {
    const confirmMessage = `Are you sure you want to initialize a refund request of ${formatCurrency(
      payment.amount,
    )} for Payment ID: ${payment.paymentId}?`;

    if (window.confirm(confirmMessage)) {
      await onCreateRefundRequest(record);
    }
  };

  return (
    <div className="payment-reconciliation-card bg-white border rounded-4 p-4 h-100 d-flex flex-column justify-content-between">
      <div>
        {/* Header Block */}
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
          <div>
            <span className="badge text-bg-light border mb-2">
              {payment.paymentId}
            </span>
            <h5 className="fw-bold mb-1">{record.title}</h5>
            <p className="text-muted small mb-0">
              {formatReconciliationIssueType(record.issueType)}
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-start">
            <PaymentReconciliationStatusBadge severity={record.severity} />
            <span className="badge text-bg-light border">{payment.status}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-muted mb-3">{record.description}</p>

        {/* Data Matrix Grid */}
        <div className="payment-reconciliation-grid mb-3">
          <div>
            <span>Amount</span>
            <strong>{formatCurrency(payment.amount)}</strong>
          </div>
          <div>
            <span>Payment Method</span>
            <strong>{payment.paymentMethod}</strong>
          </div>
          <div>
            <span>Gateway Status</span>
            <strong className="text-uppercase">
              {payment.gatewayStatus ?? "-"}
            </strong>
          </div>
          <div className="payment-reconciliation-grid-item payment-reconciliation-grid-item-wide">
            <span>Gateway Reference</span>
            <strong
              className="payment-reconciliation-long-value"
              title={formatDisplayValue(payment.gatewayReferenceId)}
            >
              {formatDisplayValue(payment.gatewayReferenceId)}
            </strong>
          </div>
          <div>
            <span>Order ID</span>
            <strong>{payment.orderId ?? "Not linked"}</strong>
          </div>
          <div>
  <span>Refund Status</span>
  <strong className="payment-reconciliation-long-value">
    {formatDisplayValue(payment.refundStatus ?? "NOT_REQUIRED")}
  </strong>
</div>
          <div>
            <span>Issue Flag</span>
            <strong>{payment.issueFlag ?? "-"}</strong>
          </div>
          <div>
  <span>Checkout Session</span>
  <strong className="payment-reconciliation-long-value">
    {formatDisplayValue(checkoutSession?.status ?? "Not found")}
  </strong>
</div>
        </div>

        {/* Action Recommendation */}
        <div className="alert alert-light border small mb-3">
          <strong>Recommended action:</strong> {record.recommendedAction}
        </div>

        {/* Linked Histories */}
        {refundRequests && refundRequests.length > 0 ? (
          <div className="payment-reconciliation-refunds mb-3">
            <h6 className="fw-bold mb-2 small text-secondary text-uppercase tracking-wider">
              Linked Refund Requests
            </h6>
            <div className="d-flex flex-column gap-2">
              {refundRequests.map((refund) => (
                <div
                  className="payment-reconciliation-refund-row p-2 border rounded-3 bg-light d-flex justify-content-between align-items-center"
                  key={refund.id}
                >
                  <div>
                    <strong className="small">{refund.refundId}</strong>
                    <p
                      className="text-muted small mb-0"
                      style={{ fontSize: "0.75rem" }}
                    >
                      {formatCurrency(refund.amount)} ·{" "}
                      {refund.refundMode.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span className="badge text-bg-light border shadow-sm">
                    {formatRefundStatus(refund)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Primary Action Button Bar */}
      {record.canCreateRefundRequest ? (
        <div className="pt-2 border-top mt-auto">
          <button
            type="button"
            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
            disabled={isCreatingRefund}
            onClick={handleRefundClick}
          >
            {isCreatingRefund ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                Creating Refund...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-counterclockwise me-1" />
                Create Refund Request
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default PaymentReconciliationCard;
