import type { RefundRecord } from "../../types/refund";
import { formatCurrency } from "../../utils/currencyFormatter";

interface OrderRefundStatusCardProps {
  refunds: RefundRecord[];
}

const getRefundBadgeClass = (status: RefundRecord["status"]): string => {
  switch (status) {
    case "COMPLETED":
      return "success";

    case "FAILED":
      return "danger";

    case "INITIATED":
    case "PROCESSING":
      return "primary";

    case "PENDING":
    default:
      return "secondary";
  }
};

const getRefundStatusLabel = (status: RefundRecord["status"]): string => {
  switch (status) {
    case "INITIATED":
      return "Refund Initiated";

    case "PROCESSING":
      return "Processing";

    case "COMPLETED":
      return "Refund Completed";

    case "FAILED":
      return "Refund Failed";

    case "PENDING":
    default:
      return "Refund Pending";
  }
};

const getRefundMethodLabel = (method: RefundRecord["method"]): string => {
  switch (method) {
    case "WALLET":
      return "Wallet Credit";

    case "COUPON":
      return "Coupon Compensation";

    case "ORIGINAL_PAYMENT":
    default:
      return "Original Payment Method";
  }
};

const OrderRefundStatusCard = ({ refunds }: OrderRefundStatusCardProps) => {
  if (refunds.length === 0) {
    return null;
  }

  return (
    <div className="order-refund-status-card">
      <div className="d-flex align-items-start gap-3">
        <div className="order-refund-status-icon">
          <i className="bi bi-cash-coin" />
        </div>

        <div className="flex-grow-1">
          <h6 className="fw-bold mb-2">Refund Status</h6>

          <div className="order-refund-list">
            {refunds.map((refund) => (
              <div className="order-refund-item" key={refund.id}>
                <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
                  <div>
                    <strong>{refund.refundId}</strong>

                    <p className="text-muted small mb-1">
                      {getRefundMethodLabel(refund.method)} •{" "}
                      {formatCurrency(refund.amount)}
                    </p>

                    <p className="text-muted small mb-0">
                      Initiated on{" "}
                      {new Date(refund.initiatedAt).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <span
                    className={`refund-status-pill ${getRefundBadgeClass(
                      refund.status
                    )}`}
                  >
                    {getRefundStatusLabel(refund.status)}
                  </span>
                </div>

                {refund.compensationCouponCode ? (
                  <div className="refund-compensation-box mt-2">
                    <i className="bi bi-ticket-perforated me-2" />
                    Coupon issued:{" "}
                    <strong>{refund.compensationCouponCode}</strong>
                  </div>
                ) : null}

                {refund.walletCreditAmount ? (
                  <div className="refund-compensation-box mt-2">
                    <i className="bi bi-wallet2 me-2" />
                    Wallet credit:{" "}
                    <strong>{formatCurrency(refund.walletCreditAmount)}</strong>
                  </div>
                ) : null}

                {refund.adminRemarks ? (
                  <p className="small text-muted mt-2 mb-0">
                    {refund.adminRemarks}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderRefundStatusCard;