import type { CustomerSupportTicket } from "../types/customerSupport";
import type { CouponRedemption } from "../types/coupon";
import type { Order } from "../types/order";
import type { PaymentTransaction } from "../types/payment";
import type { RewardTransaction } from "../types/rewards";
import type { WalletTransaction } from "../types/wallet";

export type SupportInvestigationIssueType =
  | "PAYMENT_ORDER_NOT_CREATED"
  | "PAYMENT_GENERAL"
  | "ORDER_TIMELINE_STALE"
  | "DELIVERY_ISSUE"
  | "REFUND_ISSUE"
  | "WALLET_REWARD_ISSUE"
  | "COUPON_ISSUE"
  | "GENERAL_ISSUE";

export type SupportInvestigationSeverity =
  | "SUCCESS"
  | "INFO"
  | "WARNING"
  | "DANGER";

export interface SupportInvestigationFinding {
  id: string;
  title: string;
  description: string;
  severity: SupportInvestigationSeverity;
}

export interface SupportInvestigationResult {
  issueType: SupportInvestigationIssueType;
  issueLabel: string;
  findings: SupportInvestigationFinding[];
  recommendedAction: string;
}

const hasKeyword = (text: string, keywords: string[]): boolean => {
  const normalizedText = text.toLowerCase();

  return keywords.some((keyword) =>
    normalizedText.includes(keyword.toLowerCase())
  );
};

const getTicketSearchText = (ticket: CustomerSupportTicket): string => {
  return [
    ticket.category,
    ticket.priority,
    ticket.status,
    ticket.subject,
    ticket.message,
    ticket.orderId ?? "",
    ticket.supportReply ?? "",
    ticket.internalNote ?? "",
    ticket.escalationReason ?? ""
  ].join(" ");
};

export const detectSupportInvestigationIssueType = (
  ticket: CustomerSupportTicket
): SupportInvestigationIssueType => {
  const searchText = getTicketSearchText(ticket);

  if (
    ticket.category === "PAYMENT" &&
    hasKeyword(searchText, [
      "deducted",
      "debited",
      "amount deducted",
      "amount debited",
      "order not created",
      "order not placed",
      "not created",
      "not placed"
    ])
  ) {
    return "PAYMENT_ORDER_NOT_CREATED";
  }

  if (
    ticket.category === "PAYMENT" ||
    hasKeyword(searchText, ["payment", "upi", "card", "gateway", "debit"])
  ) {
    return "PAYMENT_GENERAL";
  }

  if (
    ticket.category === "DELIVERY" ||
    hasKeyword(searchText, [
      "tracking",
      "timeline",
      "not updated",
      "delivered",
      "not received",
      "courier",
      "package"
    ])
  ) {
    return "DELIVERY_ISSUE";
  }

  if (
    ticket.category === "RETURN_REFUND" ||
    hasKeyword(searchText, ["refund", "return", "pickup", "credited", "credit"])
  ) {
    return "REFUND_ISSUE";
  }

  if (
    ticket.category === "WALLET_REWARDS" ||
    hasKeyword(searchText, ["wallet", "reward", "points", "cashback"])
  ) {
    return "WALLET_REWARD_ISSUE";
  }

  if (
    ticket.category === "COUPON" ||
    hasKeyword(searchText, ["coupon", "discount", "promo"])
  ) {
    return "COUPON_ISSUE";
  }

  if (
    hasKeyword(searchText, [
      "order status",
      "timeline",
      "packed",
      "shipped",
      "fulfillment"
    ])
  ) {
    return "ORDER_TIMELINE_STALE";
  }

  return "GENERAL_ISSUE";
};

const getIssueLabel = (issueType: SupportInvestigationIssueType): string => {
  switch (issueType) {
    case "PAYMENT_ORDER_NOT_CREATED":
      return "Payment Successful / Order Not Created";

    case "PAYMENT_GENERAL":
      return "Payment Investigation";

    case "ORDER_TIMELINE_STALE":
      return "Order Timeline Investigation";

    case "DELIVERY_ISSUE":
      return "Delivery Investigation";

    case "REFUND_ISSUE":
      return "Refund / Return Investigation";

    case "WALLET_REWARD_ISSUE":
      return "Wallet / Rewards Investigation";

    case "COUPON_ISSUE":
      return "Coupon Investigation";

    case "GENERAL_ISSUE":
    default:
      return "General Support Investigation";
  }
};

const isOrderTimelineStale = (order: Order): boolean => {
  const hasTrackingEvents = Boolean(order.trackingEvents?.length);
  const hasTrackingSteps = Boolean(order.trackingSteps?.length);
  const isPendingFulfillment = order.fulfillmentStatus === "PENDING";

  return !hasTrackingEvents || !hasTrackingSteps || isPendingFulfillment;
};

const getPaymentFindings = ({
  issueType,
  paymentTransactions
}: {
  issueType: SupportInvestigationIssueType;
  paymentTransactions: PaymentTransaction[];
}): {
  findings: SupportInvestigationFinding[];
  successfulUnlinkedPayments: PaymentTransaction[];
  refundedPayments: PaymentTransaction[];
} => {
  const findings: SupportInvestigationFinding[] = [];

  const successfulUnlinkedPayments = paymentTransactions.filter(
    (transaction) =>
      transaction.status === "SUCCESS" &&
      (!transaction.orderId ||
        transaction.issueFlag === "ORDER_NOT_CREATED" ||
        transaction.issueFlag === "DUPLICATE_DEBIT")
  );

  const pendingPayments = paymentTransactions.filter(
    (transaction) => transaction.status === "PENDING"
  );

  const failedPayments = paymentTransactions.filter(
    (transaction) => transaction.status === "FAILED"
  );

  const refundedPayments = paymentTransactions.filter(
    (transaction) => transaction.status === "REFUNDED"
  );

  if (
    issueType === "PAYMENT_ORDER_NOT_CREATED" ||
    issueType === "PAYMENT_GENERAL" ||
    issueType === "REFUND_ISSUE"
  ) {
    if (successfulUnlinkedPayments.length > 0) {
      findings.push({
        id: "successful-payment-without-order",
        title: "Successful payment without linked order",
        description:
          "A successful payment exists without a linked order. Escalate to payment or finance team.",
        severity: "DANGER"
      });
    }

    if (pendingPayments.length > 0) {
      findings.push({
        id: "pending-payment",
        title: "Pending payment found",
        description:
          "Payment transaction is still pending. Keep the ticket on hold until gateway confirmation.",
        severity: "WARNING"
      });
    }

    if (failedPayments.length > 0) {
      findings.push({
        id: "failed-payment",
        title: "Failed payment found",
        description:
          "Payment transaction failed. Customer may need to retry or wait for bank reversal.",
        severity: "INFO"
      });
    }

    if (refundedPayments.length > 0) {
      findings.push({
        id: "refund-payment-record",
        title: "Refunded payment found",
        description:
          "A payment transaction is marked refunded. Verify wallet or bank credit timeline with customer.",
        severity: "SUCCESS"
      });
    }

    if (paymentTransactions.length === 0) {
      findings.push({
        id: "no-payment-record",
        title: "No payment record found",
        description:
          "No payment transaction found for this customer/order in mock payment records.",
        severity: "WARNING"
      });
    }
  }

  return {
    findings,
    successfulUnlinkedPayments,
    refundedPayments
  };
};

export const buildSupportInvestigation = ({
  ticket,
  relatedOrder,
  paymentTransactions,
  walletTransactions,
  rewardTransactions,
  couponRedemptions
}: {
  ticket: CustomerSupportTicket;
  relatedOrder?: Order | null;
  paymentTransactions: PaymentTransaction[];
  walletTransactions: WalletTransaction[];
  rewardTransactions: RewardTransaction[];
  couponRedemptions: CouponRedemption[];
}): SupportInvestigationResult => {
  const issueType = detectSupportInvestigationIssueType(ticket);
  const findings: SupportInvestigationFinding[] = [];

  if (ticket.orderId) {
    if (relatedOrder) {
      findings.push({
        id: "order-found",
        title: "Order found",
        description: `Order ${ticket.orderId} exists in the system.`,
        severity: "SUCCESS"
      });
    } else {
      findings.push({
        id: "order-not-found",
        title: "Order not found",
        description: `No order record found for ${ticket.orderId}. Verify if payment was captured without order creation.`,
        severity: "DANGER"
      });
    }
  } else {
    findings.push({
      id: "order-id-missing",
      title: "Order ID missing",
      description:
        "Customer did not provide an order ID. Ask for order ID, payment reference, or screenshot.",
      severity: "WARNING"
    });
  }

  const {
    findings: paymentFindings,
    successfulUnlinkedPayments,
    refundedPayments
  } = getPaymentFindings({
    issueType,
    paymentTransactions
  });

  findings.push(...paymentFindings);

  if (relatedOrder) {
    if (isOrderTimelineStale(relatedOrder)) {
      findings.push({
        id: "timeline-stale",
        title: "Order timeline may be stale",
        description:
          "Order exists but tracking events/steps are missing or fulfillment is still pending.",
        severity: "WARNING"
      });
    } else {
      findings.push({
        id: "timeline-healthy",
        title: "Order timeline available",
        description: `Tracking events found: ${
          relatedOrder.trackingEvents?.length ?? 0
        }.`,
        severity: "SUCCESS"
      });
    }

    if (relatedOrder.orderStatus === "Delivered") {
      findings.push({
        id: "order-delivered",
        title: "Order marked delivered",
        description:
          "Order is marked delivered. For non-receipt complaints, ask customer for delivery proof/address confirmation.",
        severity: "INFO"
      });
    }

    if (relatedOrder.orderStatus === "Return Requested") {
      findings.push({
        id: "return-requested",
        title: "Return requested",
        description:
          "Return request exists for this order. Check refund/payment status before resolving.",
        severity: "INFO"
      });
    }

    if (relatedOrder.orderStatus === "Cancelled") {
      findings.push({
        id: "order-cancelled",
        title: "Order cancelled",
        description:
          "Order is cancelled. Verify refund or wallet credit before marking ticket resolved.",
        severity: "INFO"
      });
    }
  }

  if (walletTransactions.length > 0) {
    findings.push({
      id: "wallet-transactions",
      title: "Wallet transactions found",
      description: `${walletTransactions.length} wallet transaction(s) found for this customer/order.`,
      severity: "INFO"
    });
  }

  if (rewardTransactions.length > 0) {
    findings.push({
      id: "reward-transactions",
      title: "Reward transactions found",
      description: `${rewardTransactions.length} reward transaction(s) found for this customer/order.`,
      severity: "INFO"
    });
  }

  if (couponRedemptions.length > 0) {
    findings.push({
      id: "coupon-redemptions",
      title: "Coupon redemption found",
      description: `${couponRedemptions.length} coupon redemption record(s) found.`,
      severity: "INFO"
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: "no-critical-findings",
      title: "No critical issue detected",
      description:
        "No immediate mismatch was detected from available order/payment data.",
      severity: "SUCCESS"
    });
  }

  let recommendedAction =
    "Review the customer message and attachments, then add an internal note before replying.";

  if (successfulUnlinkedPayments.length > 0) {
    recommendedAction =
      "Escalate to payment/finance team. Ask customer for payment reference screenshot if not already attached.";
  } else if (relatedOrder?.fulfillmentStatus === "PENDING") {
    recommendedAction =
      "Follow up with seller/warehouse team and update the customer with latest fulfillment status.";
  } else if (issueType === "REFUND_ISSUE") {
    recommendedAction =
      refundedPayments.length > 0
        ? "Inform customer that refund appears processed. Ask them to verify bank/wallet credit timeline."
        : "Check refund/payment/wallet records. Keep ticket on hold if finance confirmation is pending.";
  } else if (issueType === "COUPON_ISSUE" && couponRedemptions.length === 0) {
    recommendedAction =
      "Verify coupon code, cart eligibility, and redemption limits before replying.";
  } else if (
    issueType === "WALLET_REWARD_ISSUE" &&
    walletTransactions.length === 0 &&
    rewardTransactions.length === 0
  ) {
    recommendedAction =
      "Ask customer for wallet/reward screenshot and verify transactions before resolving.";
  }

  return {
    issueType,
    issueLabel: getIssueLabel(issueType),
    findings,
    recommendedAction
  };
};