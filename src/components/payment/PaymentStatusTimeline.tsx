import type { PaymentTransaction } from "../../types/payment";
import { formatCurrency } from "../../utils/currencyFormatter";

interface PaymentStatusTimelineProps {
  payment: PaymentTransaction;
}

const PaymentStatusTimeline = ({ payment }: PaymentStatusTimelineProps) => {
  return (
    <div className="payment-status-timeline border rounded-4 p-3 bg-white">
      <h6 className="fw-bold mb-3">Payment Status Timeline</h6>

      <div className="payment-status-grid">
        <div>
          <span>Payment ID</span>
          <strong>{payment.paymentId}</strong>
        </div>

        <div>
          <span>Status</span>
          <strong>{payment.status}</strong>
        </div>

        <div>
          <span>Gateway Status</span>
          <strong>{payment.gatewayStatus ?? "-"}</strong>
        </div>

        <div>
          <span>Gateway Reference</span>
          <strong>{payment.gatewayReferenceId ?? "-"}</strong>
        </div>

        <div>
          <span>Amount</span>
          <strong>{formatCurrency(payment.amount)}</strong>
        </div>

        <div>
          <span>Linked Order</span>
          <strong>{payment.orderId ?? "Not linked"}</strong>
        </div>

        <div>
          <span>Refund Status</span>
          <strong>{payment.refundStatus ?? "NOT_REQUIRED"}</strong>
        </div>

        <div>
          <span>Issue Flag</span>
          <strong>{payment.issueFlag ?? "-"}</strong>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusTimeline;