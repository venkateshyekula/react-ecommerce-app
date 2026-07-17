import type { SupportEscalationTeam } from "../types/supportEscalation";

export interface SupportResolutionPlaybook {
  team: SupportEscalationTeam;
  title: string;
  summary: string;
  checklist: string[];
  recommendedOutcomes: string[];
  resolutionNoteHint: string;
}

export const getSupportResolutionPlaybook = (
  team: SupportEscalationTeam
): SupportResolutionPlaybook => {
  switch (team) {
    case "PAYMENT_FINANCE":
      return {
        team,
        title: "Payment / Finance Investigation",
        summary:
          "Use this playbook for payment captured but order missing, duplicate debit, pending gateway confirmation, and payment mismatch issues.",
        checklist: [
          "Check whether an order record exists for the provided order ID.",
          "Check payment transaction status: SUCCESS, PENDING, FAILED, or REFUNDED.",
          "Verify gateway status and gateway reference ID.",
          "Check whether the payment transaction is linked to an order ID.",
          "Check if wallet or reward redemption was also used.",
          "If payment is captured but no order is linked, mark refund/manual order correction required."
        ],
        recommendedOutcomes: [
          "If payment is SUCCESS/CAPTURED and order is missing, initiate refund or manual order review.",
          "If payment is PENDING, keep escalation in progress or waiting for external team.",
          "If payment FAILED, ask support to inform the customer about retry or bank reversal."
        ],
        resolutionNoteHint:
          "Mention payment ID, gateway reference, payment status, amount, and whether order linkage was found."
      };

    case "REFUND_TEAM":
      return {
        team,
        title: "Refund Investigation",
        summary:
          "Use this playbook for refund not credited, return completed but refund pending, cancelled order refund, and wallet/bank refund cases.",
        checklist: [
          "Check the order status: Cancelled, Return Requested, Returned, or Delivered.",
          "Check payment transaction status for REFUNDED or REFUND_PENDING.",
          "Check wallet transactions for refund credits.",
          "Verify refund mode: bank, UPI, card, or wallet.",
          "Check whether refund reference or settlement date exists.",
          "If refund is missing, mark refund initiation required."
        ],
        recommendedOutcomes: [
          "If refund is already processed, add refund reference and expected credit timeline.",
          "If refund is pending, keep escalation waiting for finance/refund settlement.",
          "If wallet credit is missing, route or coordinate with Wallet / Rewards team."
        ],
        resolutionNoteHint:
          "Mention refund status, refund reference, refund mode, amount, and expected credit date."
      };

    case "DELIVERY_TEAM":
      return {
        team,
        title: "Delivery Investigation",
        summary:
          "Use this playbook for delivered-not-received, courier delay, tracking stuck, and failed delivery attempts.",
        checklist: [
          "Check order status and delivery status.",
          "Review tracking events and latest delivery scan.",
          "Check whether order is marked Delivered.",
          "If delivered, verify proof of delivery or delivery confirmation.",
          "If shipment is stuck, follow up with courier or delivery partner.",
          "Check delivery address and customer-provided evidence."
        ],
        recommendedOutcomes: [
          "If delivered, request proof of delivery verification.",
          "If shipment is delayed, update courier follow-up status.",
          "If delivery attempt failed, ask support to confirm customer availability/address."
        ],
        resolutionNoteHint:
          "Mention latest tracking event, delivery status, courier finding, and next delivery action."
      };

    case "SELLER_FULFILLMENT":
      return {
        team,
        title: "Seller Fulfillment Investigation",
        summary:
          "Use this playbook for order stuck at placed, packing delay, shipment handoff delay, and missing tracking updates.",
        checklist: [
          "Check fulfillment status.",
          "Check order tracking steps and tracking events.",
          "Verify seller or warehouse processing status.",
          "If fulfillment is PENDING, follow up with seller/warehouse.",
          "If packed but not shipped, check shipment handoff.",
          "If tracking is missing, request seller/warehouse tracking update."
        ],
        recommendedOutcomes: [
          "If fulfillment is pending, keep escalation in progress and add seller follow-up note.",
          "If shipment handoff is pending, coordinate with warehouse.",
          "If already shipped, update support with tracking details."
        ],
        resolutionNoteHint:
          "Mention fulfillment status, seller/warehouse action, and expected tracking update."
      };

    case "COUPON_PROMOTIONS":
      return {
        team,
        title: "Coupon / Promotions Investigation",
        summary:
          "Use this playbook for coupon not applied, discount mismatch, promo code failure, and redemption limit issues.",
        checklist: [
          "Check coupon code and redemption record.",
          "Verify coupon eligibility rules.",
          "Check minimum cart value and expiry.",
          "Check per-user usage limit and total usage limit.",
          "Verify whether discount was applied to order/invoice.",
          "If eligible discount was missed, recommend wallet adjustment or promo credit."
        ],
        recommendedOutcomes: [
          "If coupon was not eligible, add exact rule failure reason.",
          "If coupon was eligible but not applied, recommend adjustment.",
          "If coupon was already redeemed, explain redemption limit."
        ],
        resolutionNoteHint:
          "Mention coupon code, eligibility result, redemption status, and discount decision."
      };

    case "WALLET_REWARDS":
      return {
        team,
        title: "Wallet / Rewards Investigation",
        summary:
          "Use this playbook for wallet debit, wallet refund, cashback missing, reward points not credited, and reward redemption issues.",
        checklist: [
          "Check wallet transactions for debit and credit records.",
          "Check reward transactions for earn/redeem records.",
          "Verify transaction linkage with order ID.",
          "If order failed but wallet was debited, restore wallet balance.",
          "If order failed but rewards were redeemed, restore reward points.",
          "If cashback is missing, verify cashback eligibility and credit status."
        ],
        recommendedOutcomes: [
          "If wallet debit happened for failed order, add wallet credit/reversal.",
          "If reward points were deducted incorrectly, restore points.",
          "If cashback is pending, update expected credit timeline."
        ],
        resolutionNoteHint:
          "Mention wallet/reward transaction IDs, debit/credit amount, and correction action."
      };

    case "TECH_SUPPORT":
      return {
        team,
        title: "Technical Support Investigation",
        summary:
          "Use this playbook for technical errors, account issues, invoice/download failures, and system workflow problems.",
        checklist: [
          "Review customer message and attachments.",
          "Identify affected module: payment, order, invoice, account, support, or checkout.",
          "Check related order/payment data if available.",
          "Check whether issue is reproducible.",
          "If data related, route to correct business team.",
          "If system issue, add engineering follow-up note."
        ],
        recommendedOutcomes: [
          "If reproducible technical issue exists, mark engineering follow-up required.",
          "If issue belongs to another team, reassign escalation.",
          "If workaround exists, add workaround in resolution note."
        ],
        resolutionNoteHint:
          "Mention module, observed issue, reproducibility, and workaround or engineering action."
      };

    case "CUSTOMER_OPERATIONS":
    default:
      return {
        team,
        title: "Customer Operations Triage",
        summary:
          "Use this playbook for unclear issues, wrong category, missing information, and general support triage.",
        checklist: [
          "Review customer message, category, priority, and attachments.",
          "Check whether order ID or payment reference is available.",
          "Identify the correct issue type.",
          "If information is missing, ask support agent to request details.",
          "If issue belongs to a dedicated team, reassign escalation.",
          "Add internal triage decision."
        ],
        recommendedOutcomes: [
          "If category is wrong, reassign to correct team.",
          "If customer details are missing, ask support to collect evidence.",
          "If issue is valid but unclear, keep escalation in progress."
        ],
        resolutionNoteHint:
          "Mention triage decision, missing information, and next assigned team if applicable."
      };
  }
};