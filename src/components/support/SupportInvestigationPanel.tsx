import type { CustomerSupportTicket } from "../../types/customerSupport";
import type { CouponRedemption } from "../../types/coupon";
import type { Order } from "../../types/order";
import type { PaymentTransaction } from "../../types/payment";
import type { RewardTransaction } from "../../types/rewards";
import type { WalletTransaction } from "../../types/wallet";
import { formatCurrency } from "../../utils/currencyFormatter";
import { buildSupportInvestigation } from "../../utils/supportInvestigationUtils";

interface SupportInvestigationPanelProps {
  ticket: CustomerSupportTicket;
  relatedOrder?: Order | null;
  paymentTransactions: PaymentTransaction[];
  walletTransactions: WalletTransaction[];
  rewardTransactions: RewardTransaction[];
  couponRedemptions: CouponRedemption[];
  isLoading?: boolean;
}

const getSeverityBadgeClass = (severity: string): string => {
  switch (severity) {
    case "SUCCESS":
      return "text-bg-success";

    case "DANGER":
      return "text-bg-danger";

    case "WARNING":
      return "text-bg-warning";

    case "INFO":
    default:
      return "text-bg-info";
  }
};

const getPaymentStatusClass = (status: string): string => {
  switch (status) {
    case "SUCCESS":
      return "text-bg-success";

    case "FAILED":
      return "text-bg-danger";

    case "PENDING":
      return "text-bg-warning";

    case "REFUNDED":
      return "text-bg-info";

    default:
      return "text-bg-secondary";
  }
};

const SupportInvestigationPanel = ({
  ticket,
  relatedOrder,
  paymentTransactions,
  walletTransactions,
  rewardTransactions,
  couponRedemptions,
  isLoading = false
}: SupportInvestigationPanelProps) => {
  const investigation = buildSupportInvestigation({
    ticket,
    relatedOrder,
    paymentTransactions,
    walletTransactions,
    rewardTransactions,
    couponRedemptions
  });

  if (isLoading) {
    return (
      <div className="support-investigation-panel border rounded-4 p-3 mb-3">
        <div className="d-flex align-items-center gap-2">
          <span className="spinner-border spinner-border-sm" />
          <span className="text-muted">Loading investigation details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="support-investigation-panel border rounded-4 p-3 mb-3">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
        <div>
          <h6 className="fw-bold mb-1">Investigation Workspace</h6>
          <p className="text-muted small mb-0">{investigation.issueLabel}</p>
        </div>

        <span className="badge text-bg-light border align-self-start">
          {ticket.ticketId}
        </span>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="support-investigation-mini-card">
            <span>Customer</span>
            <strong>{ticket.userName}</strong>
            <small>{ticket.userEmail}</small>
          </div>
        </div>

        <div className="col-md-6">
          <div className="support-investigation-mini-card">
            <span>Order Reference</span>
            <strong>{ticket.orderId ?? "Not provided"}</strong>
            <small>{ticket.category}</small>
          </div>
        </div>
      </div>

      {relatedOrder ? (
        <div className="support-investigation-order-card bg-light rounded-4 p-3 mb-3">
          <h6 className="fw-bold mb-2">Order Snapshot</h6>

          <div className="row g-2 small">
            <div className="col-md-6">
              Order ID: <strong>{relatedOrder.orderId}</strong>
            </div>

            <div className="col-md-6">
              Order Status: <strong>{relatedOrder.orderStatus}</strong>
            </div>

            <div className="col-md-6">
              Fulfillment:{" "}
              <strong>
                {relatedOrder.fulfillmentStatus ?? "Not assigned"}
              </strong>
            </div>

            <div className="col-md-6">
              Payment: <strong>{relatedOrder.paymentMethod}</strong>
            </div>

            <div className="col-md-6">
              Amount:{" "}
              <strong>{formatCurrency(relatedOrder.totalAmount)}</strong>
            </div>

            <div className="col-md-6">
              Tracking Events:{" "}
              <strong>{relatedOrder.trackingEvents?.length ?? 0}</strong>
            </div>
          </div>
        </div>
      ) : null}

      {paymentTransactions.length > 0 ? (
        <div className="support-investigation-payment-card border rounded-4 p-3 mb-3">
          <h6 className="fw-bold mb-2">Payment Transactions</h6>

          <div className="d-flex flex-column gap-2">
            {paymentTransactions.map((transaction) => (
              <div
                className="support-investigation-payment-row"
                key={transaction.id}
              >
                <div>
                  <strong>{transaction.paymentId}</strong>

                  <p className="small text-muted mb-0">
                    {transaction.gatewayReferenceId ?? "No gateway reference"} ·{" "}
                    {transaction.paymentMethod}
                  </p>

                  {transaction.issueFlag ? (
                    <p className="small text-danger fw-semibold mb-0 mt-1">
                      Issue: {transaction.issueFlag}
                    </p>
                  ) : null}
                </div>

                <div className="text-end">
                  <span
                    className={`badge ${getPaymentStatusClass(
                      transaction.status
                    )}`}
                  >
                    {transaction.status}
                  </span>

                  <p className="small fw-semibold mb-0 mt-1">
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="support-investigation-findings d-flex flex-column gap-2">
        {investigation.findings.map((finding) => (
          <div
            className="support-investigation-finding border rounded-4 p-3"
            key={finding.id}
          >
            <div className="d-flex justify-content-between gap-2 mb-1">
              <strong>{finding.title}</strong>

              <span
                className={`badge align-self-start ${getSeverityBadgeClass(finding.severity)}`}
              >
                {finding.severity}
              </span>
            </div>

            <p className="small text-muted mb-0">{finding.description}</p>
          </div>
        ))}
      </div>

      <div className="alert alert-primary mt-3 mb-0" role="alert">
        <strong>Recommended Action:</strong> {investigation.recommendedAction}
      </div>

      <div className="support-investigation-extra-row mt-3">
        <span>Wallet: {walletTransactions.length}</span>
        <span>Rewards: {rewardTransactions.length}</span>
        <span>Coupons: {couponRedemptions.length}</span>
      </div>
    </div>
  );
};

export default SupportInvestigationPanel;