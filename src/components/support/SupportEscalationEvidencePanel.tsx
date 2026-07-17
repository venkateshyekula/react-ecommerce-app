import type { CouponRedemption } from "../../types/couponRedemption";
import type { CustomerSupportTicket } from "../../types/customerSupport";
import type { Order } from "../../types/order";
import type { PaymentTransaction } from "../../types/payment";
import type { RefundRequest, RefundStatus } from "../../types/refund";
import type { RewardTransaction } from "../../types/rewards";
import type {
  SupportEscalation,
  SupportEscalationTeam
} from "../../types/supportEscalation";
import type { WalletTransaction } from "../../types/wallet";
import { formatCurrency } from "../../utils/currencyFormatter";

interface SupportEscalationEvidencePanelProps {
  escalation: SupportEscalation;
  ticket?: CustomerSupportTicket | null;
  relatedOrder?: Order | null;
  paymentTransactions?: PaymentTransaction[];
  walletTransactions?: WalletTransaction[];
  rewardTransactions?: RewardTransaction[];
  couponRedemptions?: CouponRedemption[];
  refundRequests?: RefundRequest[];
  isLoading?: boolean;
}

const getEvidenceBadgeClass = (value: "OK" | "WARNING" | "DANGER" | "INFO") => {
  switch (value) {
    case "OK":
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

const getRefundStatusBadgeClass = (status: RefundStatus): string => {
  switch (status) {
    case "PENDING_REVIEW":
    case "PENDING":
      return "text-bg-warning";
    case "INITIATED":
      return "text-bg-info";
    case "PROCESSING":
      return "text-bg-primary";
    case "COMPLETED":
      return "text-bg-success";
    case "FAILED":
      return "text-bg-danger";
    case "CANCELLED":
      return "text-bg-secondary";
    default:
      return "text-bg-light";
  }
};

const formatLabel = (value: string | null | undefined): string => {
  if (!value) return "-";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const EvidenceRow = ({
  label,
  value
}: {
  label: string;
  value: string | number | null | undefined;
}) => {
  return (
    <div className="support-evidence-row">
      <span>{label}</span>
      <strong>
        {value === undefined || value === null || value === "" ? "-" : value}
      </strong>
    </div>
  );
};

const EvidenceFinding = ({
  severity,
  title,
  description
}: {
  severity: "OK" | "WARNING" | "DANGER" | "INFO";
  title: string;
  description: string;
}) => {
  return (
    <div className="support-evidence-finding border rounded-4 p-3">
      <div className="d-flex justify-content-between gap-2 mb-1">
        <strong>{title}</strong>
        <span className={`badge ${getEvidenceBadgeClass(severity)}`}>
          {severity}
        </span>
      </div>
      <p className="small text-muted mb-0">{description}</p>
    </div>
  );
};

const getPaymentFinding = ({
  team,
  relatedOrder,
  paymentTransactions
}: {
  team: SupportEscalationTeam;
  relatedOrder?: Order | null;
  paymentTransactions: PaymentTransaction[];
}) => {
  if (team !== "PAYMENT_FINANCE") return null;

  const successfulUnlinkedPayment = paymentTransactions.find(
    (payment) =>
      payment.status === "SUCCESS" &&
      (!payment.orderId ||
        payment.issueFlag === "ORDER_NOT_CREATED" ||
        payment.issueFlag === "DUPLICATE_DEBIT")
  );

  const refundRequiredPayment = paymentTransactions.find(
    (payment) =>
      payment.status === "REFUND_REQUIRED" ||
      payment.refundStatus === "PENDING_REVIEW"
  );

  if (successfulUnlinkedPayment && !relatedOrder) {
    return (
      <EvidenceFinding
        severity="DANGER"
        title="Captured payment without linked order"
        description="A successful payment exists, but no related order record is available. Refund or manual order review is required."
      />
    );
  }

  if (refundRequiredPayment) {
    return (
      <EvidenceFinding
        severity="WARNING"
        title="Refund review required"
        description="A payment transaction is marked as refund required or pending review. Refund Team should validate and process the refund request."
      />
    );
  }

  if (successfulUnlinkedPayment) {
    return (
      <EvidenceFinding
        severity="WARNING"
        title="Payment needs review"
        description="A payment issue flag is present. Verify gateway reference and order linkage before resolving."
      />
    );
  }

  if (paymentTransactions.length === 0) {
    return (
      <EvidenceFinding
        severity="WARNING"
        title="No payment transaction found"
        description="No payment records were found for this user/order. Ask support to collect payment reference or screenshot."
      />
    );
  }

  return null;
};

const getRefundFinding = ({
  team,
  refundRequests,
  paymentTransactions
}: {
  team: SupportEscalationTeam;
  refundRequests: RefundRequest[];
  paymentTransactions: PaymentTransaction[];
}) => {
  if (team !== "REFUND_TEAM") return null;

  const refundRequiredPayment = paymentTransactions.some(
    (payment) =>
      payment.status === "REFUND_REQUIRED" ||
      payment.refundStatus === "PENDING_REVIEW" ||
      payment.issueFlag === "ORDER_NOT_CREATED" ||
      payment.issueFlag === "DUPLICATE_DEBIT"
  );

  const pendingRefund = refundRequests.find(
    (refund) =>
      refund.status === "PENDING_REVIEW" ||
      refund.status === "PENDING" ||
      refund.status === "INITIATED" ||
      refund.status === "PROCESSING"
  );

  const completedRefund = refundRequests.find(
    (refund) => refund.status === "COMPLETED"
  );

  if (refundRequiredPayment && refundRequests.length === 0) {
    return (
      <EvidenceFinding
        severity="DANGER"
        title="Refund request missing"
        description="Payment indicates refund review is required, but no refund request record was found. Create or verify refund request before resolving."
      />
    );
  }

  if (pendingRefund) {
    return (
      <EvidenceFinding
        severity="WARNING"
        title="Refund is still in progress"
        description="A refund request exists but is not completed yet. Continue refund workflow and add gateway refund reference before completion."
      />
    );
  }

  if (completedRefund) {
    return (
      <EvidenceFinding
        severity="OK"
        title="Refund completed"
        description="Refund request is completed. Verify gateway refund reference and resolution note before closing escalation."
      />
    );
  }

  // FIXED: Consolidated fallback check directly inside the main engine resolver block
  if (refundRequests.length === 0) {
    return (
      <EvidenceFinding
        severity="INFO"
        title="No refund request loaded"
        description="No refund request is currently linked to this issue. If payment requires refund, create or verify the refund queue record."
      />
    );
  }

  return null;
};

const SupportEscalationEvidencePanel = ({
  escalation,
  ticket,
  relatedOrder,
  paymentTransactions = [],
  walletTransactions = [],
  rewardTransactions = [],
  couponRedemptions = [],
  refundRequests = [],
  isLoading = false
}: SupportEscalationEvidencePanelProps) => {
  if (isLoading) {
    return (
      <div className="support-evidence-panel border rounded-4 p-3 mb-3">
        <div className="d-flex align-items-center gap-2">
          <span className="spinner-border spinner-border-sm" />
          <span className="text-muted">Loading investigation evidence...</span>
        </div>
      </div>
    );
  }

  const orderId = escalation.orderId ?? ticket?.orderId ?? "Not provided";

  const paymentFinding = getPaymentFinding({
    team: escalation.team,
    relatedOrder,
    paymentTransactions
  });

  const refundFinding = getRefundFinding({
    team: escalation.team,
    refundRequests,
    paymentTransactions
  });

  return (
    <div className="support-evidence-panel border rounded-4 p-3 mb-3">
      <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
        <div>
          <h6 className="fw-bold mb-1">Investigation Evidence</h6>
          <p className="text-muted small mb-0">
            Data-backed checks for this escalation team.
          </p>
        </div>
        <span className="badge text-bg-light border">Evidence</span>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-6">
          <div className="support-evidence-card">
            <h6 className="fw-bold mb-2">Order Check</h6>
            <EvidenceRow label="Order ID" value={orderId} />
            <EvidenceRow
              label="Order Record"
              value={relatedOrder ? "Found" : "Not Found"}
            />
            <EvidenceRow label="Order Status" value={relatedOrder?.orderStatus} />
            <EvidenceRow
              label="Fulfillment"
              value={relatedOrder?.fulfillmentStatus}
            />
            <EvidenceRow
              label="Order Amount"
              value={
                relatedOrder?.totalAmount !== undefined
                  ? formatCurrency(relatedOrder.totalAmount)
                  : "-"
              }
            />
          </div>
        </div>

        <div className="col-lg-6">
          <div className="support-evidence-card">
            <h6 className="fw-bold mb-2">Payment Check</h6>
            <EvidenceRow
              label="Payment Records"
              value={paymentTransactions.length}
            />
            <EvidenceRow
              label="Successful Payments"
              value={
                paymentTransactions.filter(
                  (payment) => payment.status === "SUCCESS"
                ).length
              }
            />
            <EvidenceRow
              label="Pending Payments"
              value={
                paymentTransactions.filter(
                  (payment) => payment.status === "PENDING"
                ).length
              }
            />
            <EvidenceRow
              label="Refund Required"
              value={
                paymentTransactions.filter(
                  (payment) => payment.status === "REFUND_REQUIRED"
                ).length
              }
            />
            <EvidenceRow
              label="Refunded Payments"
              value={
                paymentTransactions.filter(
                  (payment) => payment.status === "REFUNDED"
                ).length
              }
            />
          </div>
        </div>
      </div>

      {paymentTransactions.length > 0 ? (
        <div className="support-evidence-card mb-3">
          <h6 className="fw-bold mb-2">Payment Transactions</h6>
          <div className="d-flex flex-column gap-2">
            {paymentTransactions.map((payment, index) => (
              <div className="support-evidence-transaction" key={`${payment.id}-${index}`}>
                <div>
                  <strong>{payment.paymentId}</strong>
                  <p className="small text-muted mb-0">
                    {payment.gatewayReferenceId ?? "No gateway ref"} ·{" "}
                    {payment.gatewayStatus ?? "No gateway status"}
                  </p>
                  <p className="small text-muted mb-0">
                    Linked Order: {payment.orderId ?? "Not linked"}
                  </p>
                  <p className="small text-muted mb-0">
                    Refund Status: {payment.refundStatus ?? "NOT_REQUIRED"}
                  </p>
                  {payment.issueFlag ? (
                    <p className="small text-danger mb-0">
                      Issue: {formatLabel(payment.issueFlag)}
                    </p>
                  ) : null}
                </div>
                <div className="text-end">
                  <span className="badge text-bg-light border">
                    {payment.status}
                  </span>
                  <p className="small fw-semibold mb-0 mt-1">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {refundRequests.length > 0 ? (
        <div className="support-evidence-card mb-3">
          <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
            <div>
              <h6 className="fw-bold mb-1">Refund Requests</h6>
              <p className="text-muted small mb-0">
                Refund lifecycle records linked to this payment/order issue.
              </p>
            </div>
            <span className="badge text-bg-light border">
              {refundRequests.length}
            </span>
          </div>

          <div className="d-flex flex-column gap-2">
            {refundRequests.map((refund, index) => (
              <div className="support-refund-evidence-card" key={`${refund.id}-${index}`}>
                <div className="d-flex flex-column flex-lg-row justify-content-between gap-2 mb-2">
                  <div>
                    <strong>{refund.refundId}</strong>
                    <p className="small text-muted mb-0">
                      Payment: {refund.paymentId} · Order:{" "}
                      {refund.orderId ?? "Not linked"}
                    </p>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <span
                      className={`badge ${getRefundStatusBadgeClass(
                        refund.status
                      )}`}
                    >
                      {formatLabel(refund.status)}
                    </span>
                    <span className="badge text-bg-light border refund-request-mode-badge">
                      {formatLabel(refund.refundMode)}
                    </span>
                  </div>
                </div>

                <div className="support-refund-evidence-grid">
                  <EvidenceRow label="Amount" value={formatCurrency(refund.amount)} />
                  <EvidenceRow label="Created By" value={refund.createdBy} />
                  <EvidenceRow label="Assigned Team" value={refund.assignedTeam} />
                  <EvidenceRow
                    label="Gateway Reference"
                    value={refund.gatewayRefundReferenceId}
                  />
                </div>

                <div className="alert alert-light border small mb-2 mt-2">
                  <strong>Reason:</strong> {refund.reason}
                </div>

                {refund.resolutionNote ? (
                  <div className="alert alert-success small mb-0">
                    <strong>Resolution:</strong> {refund.resolutionNote}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="support-evidence-card">
            <h6 className="fw-bold mb-2">Wallet</h6>
            <EvidenceRow
              label="Transactions"
              value={walletTransactions.length}
            />
          </div>
        </div>
        <div className="col-md-4">
          <div className="support-evidence-card">
            <h6 className="fw-bold mb-2">Rewards</h6>
            <EvidenceRow
              label="Transactions"
              value={rewardTransactions.length}
            />
          </div>
        </div>
        <div className="col-md-4">
          <div className="support-evidence-card">
            <h6 className="fw-bold mb-2">Coupons</h6>
            <EvidenceRow
              label="Redemptions"
              value={couponRedemptions.length}
            />
          </div>
        </div>
      </div>

      <div className="d-flex flex-column gap-2">
        {paymentFinding}
        {refundFinding}

        {!relatedOrder && orderId !== "Not provided" ? (
          <EvidenceFinding
            severity="DANGER"
            title="Order record missing"
            description="The escalation references an order ID, but no matching order record was loaded."
          />
        ) : null}

        {relatedOrder?.fulfillmentStatus === "PENDING" ? (
          <EvidenceFinding
            severity="WARNING"
            title="Fulfillment pending"
            description="The order exists but fulfillment is still pending. Seller or warehouse follow-up may be required."
          />
        ) : null}

        {couponRedemptions.length === 0 &&
        escalation.team === "COUPON_PROMOTIONS" ? (
          <EvidenceFinding
            severity="WARNING"
            title="Coupon redemption missing"
            description="No coupon redemption record was found. Verify coupon eligibility, code, and usage limits."
          />
        ) : null}

        {walletTransactions.length === 0 &&
        rewardTransactions.length === 0 &&
        escalation.team === "WALLET_REWARDS" ? (
          <EvidenceFinding
            severity="WARNING"
            title="No wallet/reward transactions found"
            description="No wallet or reward transactions were found for this issue. Ask support to collect screenshot/evidence if required."
          />
        ) : null}
      </div>
    </div>
  );
};

export default SupportEscalationEvidencePanel;