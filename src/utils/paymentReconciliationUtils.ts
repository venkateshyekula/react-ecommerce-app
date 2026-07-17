import type { CheckoutPaymentSession } from "../types/checkoutPayment";
import type { PaymentTransaction } from "../types/payment";
import type { RefundRequest } from "../types/refund";

export type PaymentReconciliationIssueType =
  | "CAPTURED_PAYMENT_WITHOUT_ORDER"
  | "DUPLICATE_SUCCESSFUL_PAYMENT"
  | "REFUND_REQUIRED_MISSING_REQUEST"
  | "PENDING_GATEWAY_STALE"
  | "FAILED_PAYMENT_WITH_ACTIVE_SESSION"
  | "SESSION_PAYMENT_STATUS_MISMATCH"
  | "HEALTHY";

export type PaymentReconciliationSeverity =
  | "OK"
  | "INFO"
  | "WARNING"
  | "DANGER";

export interface PaymentReconciliationRecord {
  id: string;
  payment: PaymentTransaction;
  checkoutSession?: CheckoutPaymentSession | null;
  refundRequests: RefundRequest[];
  issueType: PaymentReconciliationIssueType;
  severity: PaymentReconciliationSeverity;
  title: string;
  description: string;
  recommendedAction: string;
  canCreateRefundRequest: boolean;
}

const STALE_PENDING_MINUTES = 15;

const getMinutesSince = (dateValue?: string): number => {
  if (!dateValue) {
    return 0;
  }

  const time = new Date(dateValue).getTime();

  if (Number.isNaN(time)) {
    return 0;
  }

  return Math.floor((Date.now() - time) / 60_000);
};

const getDuplicateSuccessfulPayments = (
  payment: PaymentTransaction,
  allPayments: PaymentTransaction[]
): PaymentTransaction[] => {
  if (!payment.checkoutReferenceId) {
    return [];
  }

  return allPayments.filter(
    (currentPayment) =>
      currentPayment.id !== payment.id &&
      currentPayment.checkoutReferenceId === payment.checkoutReferenceId &&
      currentPayment.status === "SUCCESS"
  );
};

export const buildPaymentReconciliationRecords = ({
  payments,
  sessions,
  refundRequests
}: {
  payments: PaymentTransaction[];
  sessions: CheckoutPaymentSession[];
  refundRequests: RefundRequest[];
}): PaymentReconciliationRecord[] => {
  return payments.map((payment) => {
    const checkoutSession =
      sessions.find((session) => session.paymentId === payment.paymentId) ??
      null;

    const linkedRefundRequests = refundRequests.filter(
      (refundRequest) => refundRequest.paymentId === payment.paymentId
    );

    const duplicateSuccessfulPayments = getDuplicateSuccessfulPayments(
      payment,
      payments
    );

    const hasRefundRequest = linkedRefundRequests.length > 0;

    if (
      payment.status === "SUCCESS" &&
      payment.gatewayStatus === "CAPTURED" &&
      !payment.orderId
    ) {
      return {
        id: `recon-${payment.id}`,
        payment,
        checkoutSession,
        refundRequests: linkedRefundRequests,
        issueType: "CAPTURED_PAYMENT_WITHOUT_ORDER",
        severity: "DANGER",
        title: "Captured payment without linked order",
        description:
          "Payment was captured successfully, but no order is linked to this payment transaction.",
        recommendedAction:
          "Create a refund request or complete manual order correction after verification.",
        canCreateRefundRequest: !hasRefundRequest
      };
    }

    if (
      payment.status === "SUCCESS" &&
      duplicateSuccessfulPayments.length > 0
    ) {
      return {
        id: `recon-${payment.id}`,
        payment,
        checkoutSession,
        refundRequests: linkedRefundRequests,
        issueType: "DUPLICATE_SUCCESSFUL_PAYMENT",
        severity: "DANGER",
        title: "Duplicate successful payment detected",
        description:
          "Multiple successful payments were found for the same checkout reference.",
        recommendedAction:
          "Keep the valid payment linked to the order and create a refund request for the duplicate debit.",
        canCreateRefundRequest: !hasRefundRequest
      };
    }

    if (
      payment.status === "REFUND_REQUIRED" &&
      payment.refundStatus === "PENDING_REVIEW" &&
      !hasRefundRequest
    ) {
      return {
        id: `recon-${payment.id}`,
        payment,
        checkoutSession,
        refundRequests: linkedRefundRequests,
        issueType: "REFUND_REQUIRED_MISSING_REQUEST",
        severity: "DANGER",
        title: "Refund required but refund request missing",
        description:
          "Payment is marked as refund required, but no refund request exists in the refund queue.",
        recommendedAction:
          "Create a refund request and assign it to the Refund Team.",
        canCreateRefundRequest: true
      };
    }

    if (
      payment.status === "PENDING" &&
      payment.gatewayStatus === "PENDING_GATEWAY_CONFIRMATION" &&
      getMinutesSince(payment.updatedAt) >= STALE_PENDING_MINUTES
    ) {
      return {
        id: `recon-${payment.id}`,
        payment,
        checkoutSession,
        refundRequests: linkedRefundRequests,
        issueType: "PENDING_GATEWAY_STALE",
        severity: "WARNING",
        title: "Pending payment is stale",
        description:
          "Payment has been pending gateway confirmation longer than expected.",
        recommendedAction:
          "Review gateway callback history and advise the customer to retry if needed.",
        canCreateRefundRequest: false
      };
    }

    if (
      payment.status === "FAILED" &&
      checkoutSession &&
      !["PAYMENT_FAILED", "REFUND_REQUIRED"].includes(checkoutSession.status)
    ) {
      return {
        id: `recon-${payment.id}`,
        payment,
        checkoutSession,
        refundRequests: linkedRefundRequests,
        issueType: "FAILED_PAYMENT_WITH_ACTIVE_SESSION",
        severity: "WARNING",
        title: "Failed payment with active checkout session",
        description:
          "Payment failed, but the checkout session is not marked as failed.",
        recommendedAction:
          "Review checkout session state and ask the customer to retry payment.",
        canCreateRefundRequest: false
      };
    }

    if (
      checkoutSession &&
      checkoutSession.status === "ORDER_CREATED" &&
      payment.status !== "SUCCESS" &&
      payment.status !== "REFUNDED"
    ) {
      return {
        id: `recon-${payment.id}`,
        payment,
        checkoutSession,
        refundRequests: linkedRefundRequests,
        issueType: "SESSION_PAYMENT_STATUS_MISMATCH",
        severity: "WARNING",
        title: "Checkout session and payment status mismatch",
        description:
          "Checkout session indicates that order was created, but payment transaction is not successful or refunded.",
        recommendedAction:
          "Verify order, payment gateway callback, and checkout session consistency.",
        canCreateRefundRequest: false
      };
    }

    return {
      id: `recon-${payment.id}`,
      payment,
      checkoutSession,
      refundRequests: linkedRefundRequests,
      issueType: "HEALTHY",
      severity: "OK",
      title: "Payment looks healthy",
      description:
        "No payment reconciliation issue was detected for this transaction.",
      recommendedAction: "No action required.",
      canCreateRefundRequest: false
    };
  });
};

export const getReconciliationSeverityBadgeClass = (
  severity: PaymentReconciliationSeverity
): string => {
  switch (severity) {
    case "OK":
      return "text-bg-success";

    case "INFO":
      return "text-bg-info";

    case "WARNING":
      return "text-bg-warning";

    case "DANGER":
      return "text-bg-danger";

    default:
      return "text-bg-light";
  }
};

export const formatReconciliationIssueType = (
  issueType: PaymentReconciliationIssueType
): string => {
  return issueType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};