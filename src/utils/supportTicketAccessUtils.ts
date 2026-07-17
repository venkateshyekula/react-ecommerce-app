import type { SupportEscalationTeam } from "../types/supportEscalation";
import type { SupportTeamMember } from "../types/supportTeam";

export interface SupportTicketAccessPolicy {
  isAdmin: boolean;
  isGeneralSupportAgent: boolean;
  isSupportTeamMember: boolean;
  canViewFullDashboard: boolean;
  canViewOrders: boolean;
  canViewConversationThread: boolean;
  canViewTicketActivity: boolean;
  canChangeTicketStatus: boolean;
  canSendCustomerReply: boolean;
  canAddSuggestedCustomerReply: boolean;
  canAddInternalNote: boolean;
  canUploadInternalEvidence: boolean;
  canUseEscalationWorkflow: boolean;
}

export interface SupportTeamTextGuidance {
  supportReplyPlaceholder: string;
  suggestedReplyPlaceholder: string;
  internalNotePlaceholder: string;
  resolutionNotePlaceholder: string;
  evidenceUploadHint: string;
}

interface CurrentSupportUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
  supportTeamCode?: SupportEscalationTeam;
  supportTeamRole?: string;
}

export const getSupportTicketAccessPolicy = ({
  currentUser,
  currentTeamMember,
}: {
  currentUser: CurrentSupportUser | null | undefined;
  currentTeamMember: SupportTeamMember | null;
}): SupportTicketAccessPolicy => {
  const isAdmin = currentUser?.role === "ADMIN";
  const isSupport = currentUser?.role === "SUPPORT";
  const isSupportTeamMember =
    isSupport && Boolean(currentTeamMember ?? currentUser?.supportTeamCode);
  const isGeneralSupportAgent = isSupport && !isSupportTeamMember;

  return {
    isAdmin,
    isGeneralSupportAgent,
    isSupportTeamMember,
    canViewFullDashboard: isAdmin || isGeneralSupportAgent,
    canViewOrders: isAdmin || isGeneralSupportAgent,
    canViewConversationThread: isAdmin || isGeneralSupportAgent,
    canViewTicketActivity: isAdmin || isGeneralSupportAgent,
    canChangeTicketStatus: isAdmin || isGeneralSupportAgent,
    canSendCustomerReply: isAdmin || isGeneralSupportAgent,
    canAddSuggestedCustomerReply: isSupportTeamMember,
    canAddInternalNote: isAdmin || isSupport,
    canUploadInternalEvidence: isAdmin || isSupport,
    canUseEscalationWorkflow: isAdmin || isSupport,
  };
};

export const getSupportTeamTextGuidance = (
  teamCode?: SupportEscalationTeam | null,
): SupportTeamTextGuidance => {
  switch (teamCode) {
    case "PAYMENT_FINANCE":
      return {
        supportReplyPlaceholder:
          "Write customer-facing payment update. Include refund/order correction status only after finance verification.",
        suggestedReplyPlaceholder:
          "Suggest a customer reply. Example: Payment was captured and finance team is validating refund/manual order correction.",
        internalNotePlaceholder:
          "Payment investigation note: mention payment ID, gateway reference, payment status, amount, linked orderId, and recommended action.",
        resolutionNotePlaceholder:
          "Example: Payment TXN-123 was SUCCESS/CAPTURED with no linked order. Refund/manual order correction recommended.",
        evidenceUploadHint:
          "Attach gateway confirmation, payment reference screenshots, refund proof, or transaction reconciliation evidence.",
      };

    case "REFUND_TEAM":
      return {
        supportReplyPlaceholder:
          "Write customer-facing refund update with refund reference and expected credit timeline.",
        suggestedReplyPlaceholder:
          "Suggest a refund reply. Example: Refund has been initiated and should reflect within the expected banking timeline.",
        internalNotePlaceholder:
          "Refund investigation note: mention refund status, payment mode, refund reference, amount, and expected credit date.",
        resolutionNotePlaceholder:
          "Example: Refund reference RFND-123 verified. Refund is processed to original payment mode.",
        evidenceUploadHint:
          "Attach refund reference, bank settlement proof, wallet credit proof, or refund transaction evidence.",
      };

    case "DELIVERY_TEAM":
      return {
        supportReplyPlaceholder:
          "Write customer-facing delivery update with latest courier/tracking status.",
        suggestedReplyPlaceholder:
          "Suggest a delivery reply. Example: Courier investigation is in progress and latest delivery update is being verified.",
        internalNotePlaceholder:
          "Delivery investigation note: mention tracking ID, latest scan, delivery status, proof of delivery, and next courier action.",
        resolutionNotePlaceholder:
          "Example: Courier tracking verified. Package is delayed at hub and delivery partner follow-up is initiated.",
        evidenceUploadHint:
          "Attach courier proof, proof of delivery, tracking screenshot, or delivery partner update.",
      };

    case "SELLER_FULFILLMENT":
      return {
        supportReplyPlaceholder:
          "Write customer-facing fulfillment update with packing/shipping status.",
        suggestedReplyPlaceholder:
          "Suggest a fulfillment reply. Example: Seller/warehouse is being followed up for packing or shipment handoff.",
        internalNotePlaceholder:
          "Fulfillment note: mention seller, warehouse, fulfillment status, tracking step, and expected shipment update.",
        resolutionNotePlaceholder:
          "Example: Seller fulfillment pending. Warehouse follow-up initiated and tracking update expected shortly.",
        evidenceUploadHint:
          "Attach seller confirmation, warehouse update, packing proof, or shipment handoff evidence.",
      };

    case "COUPON_PROMOTIONS":
      return {
        supportReplyPlaceholder:
          "Write customer-facing coupon decision with eligibility reason or adjustment details.",
        suggestedReplyPlaceholder:
          "Suggest a coupon reply. Example: Coupon eligibility has been checked and discount adjustment is recommended/not applicable.",
        internalNotePlaceholder:
          "Coupon investigation note: mention coupon code, expiry, min cart value, usage limit, redemption record, and discount decision.",
        resolutionNotePlaceholder:
          "Example: Coupon SHOP10 was eligible but redemption was not recorded. Wallet adjustment recommended.",
        evidenceUploadHint:
          "Attach coupon rule snapshot, redemption proof, discount calculation, or promo eligibility evidence.",
      };

    case "WALLET_REWARDS":
      return {
        supportReplyPlaceholder:
          "Write customer-facing wallet/reward update with reversal or credit status.",
        suggestedReplyPlaceholder:
          "Suggest a wallet/reward reply. Example: Wallet/reward transaction was reviewed and correction is being processed.",
        internalNotePlaceholder:
          "Wallet/reward note: mention wallet transaction ID, reward transaction ID, debit/credit amount, and correction action.",
        resolutionNotePlaceholder:
          "Example: Wallet debit found for failed order. Wallet credit reversal recommended.",
        evidenceUploadHint:
          "Attach wallet ledger proof, reward ledger proof, cashback calculation, or reversal evidence.",
      };

    case "TECH_SUPPORT":
      return {
        supportReplyPlaceholder:
          "Write customer-facing technical update with workaround or fix status.",
        suggestedReplyPlaceholder:
          "Suggest a technical reply. Example: Issue is reproducible and technical team is validating the affected workflow.",
        internalNotePlaceholder:
          "Technical note: mention affected module, error, reproduction steps, screenshots, and workaround/fix recommendation.",
        resolutionNotePlaceholder:
          "Example: Checkout callback issue reproduced. Engineering follow-up required.",
        evidenceUploadHint:
          "Attach screenshots, error logs, reproduction steps, browser console details, or workflow evidence.",
      };

    case "CUSTOMER_OPERATIONS":
    default:
      return {
        supportReplyPlaceholder:
          "Write customer-facing update after verifying issue category and next action.",
        suggestedReplyPlaceholder:
          "Suggest a customer reply. Example: We are reviewing the issue and will route it to the correct team if needed.",
        internalNotePlaceholder:
          "Triage note: mention issue summary, missing details, correct team/category, and next action.",
        resolutionNotePlaceholder:
          "Example: Issue reviewed and routed to the correct team with required details.",
        evidenceUploadHint:
          "Attach customer screenshots, order/payment reference, or triage evidence.",
      };
  }
};
