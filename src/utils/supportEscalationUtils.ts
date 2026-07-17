import type { CustomerSupportTicket } from "../types/customerSupport";
import type {
  SupportEscalation,
  SupportEscalationPriority,
  SupportEscalationStatus,
  SupportEscalationTeam
} from "../types/supportEscalation";
import type { SupportInvestigationIssueType } from "./supportInvestigationUtils";

export const supportEscalationTeamOptions: Array<{
  label: string;
  value: SupportEscalationTeam;
}> = [
  {
    label: "Payment / Finance",
    value: "PAYMENT_FINANCE"
  },
  {
    label: "Refund Team",
    value: "REFUND_TEAM"
  },
  {
    label: "Delivery Team",
    value: "DELIVERY_TEAM"
  },
  {
    label: "Seller Fulfillment",
    value: "SELLER_FULFILLMENT"
  },
  {
    label: "Warehouse Team",
    value: "WAREHOUSE_TEAM"
  },
  {
    label: "Coupon / Promotions",
    value: "COUPON_PROMOTIONS"
  },
  {
    label: "Wallet / Rewards",
    value: "WALLET_REWARDS"
  },
  {
    label: "Tech Support",
    value: "TECH_SUPPORT"
  },
  {
    label: "Customer Operations",
    value: "CUSTOMER_OPERATIONS"
  }
];

export const supportEscalationStatusOptions: Array<{
  label: string;
  value: SupportEscalationStatus;
}> = [
  {
    label: "Open",
    value: "OPEN"
  },
  {
    label: "Assigned",
    value: "ASSIGNED"
  },
  {
    label: "In Progress",
    value: "IN_PROGRESS"
  },
  {
    label: "Waiting for External Team",
    value: "WAITING_FOR_EXTERNAL_TEAM"
  },
  {
    label: "Resolved",
    value: "RESOLVED"
  },
  {
    label: "Cancelled",
    value: "CANCELLED"
  }
];

export const supportEscalationPriorityOptions: Array<{
  label: string;
  value: SupportEscalationPriority;
}> = [
  {
    label: "Low",
    value: "LOW"
  },
  {
    label: "Medium",
    value: "MEDIUM"
  },
  {
    label: "High",
    value: "HIGH"
  },
  {
    label: "Urgent",
    value: "URGENT"
  }
];

export const formatEscalationLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const getEscalationStatusBadgeClass = (
  status: SupportEscalationStatus
): string => {
  switch (status) {
    case "OPEN":
      return "text-bg-warning";

    case "ASSIGNED":
      return "text-bg-info";

    case "IN_PROGRESS":
      return "text-bg-primary";

    case "WAITING_FOR_EXTERNAL_TEAM":
      return "text-bg-secondary";

    case "RESOLVED":
      return "text-bg-success";

    case "CANCELLED":
      return "text-bg-dark";

    default:
      return "text-bg-light border";
  }
};

export const getEscalationPriorityBadgeClass = (
  priority: SupportEscalationPriority
): string => {
  switch (priority) {
    case "URGENT":
      return "text-bg-danger";

    case "HIGH":
      return "text-bg-warning";

    case "MEDIUM":
      return "text-bg-info";

    case "LOW":
    default:
      return "text-bg-light border";
  }
};

export const isActiveEscalation = (
  escalation: SupportEscalation
): boolean => {
  return (
    escalation.status !== "RESOLVED" &&
    escalation.status !== "CANCELLED"
  );
};

export const hasActiveEscalation = (
  escalations: SupportEscalation[]
): boolean => {
  return escalations.some(isActiveEscalation);
};

export const mapTicketPriorityToEscalationPriority = (
  ticket: CustomerSupportTicket
): SupportEscalationPriority => {
  switch (ticket.priority) {
    case "URGENT":
      return "URGENT";

    case "HIGH":
      return "HIGH";

    case "LOW":
      return "LOW";

    case "MEDIUM":
    default:
      return "MEDIUM";
  }
};

export const suggestEscalationTeam = ({
  ticket,
  issueType
}: {
  ticket: CustomerSupportTicket;
  issueType?: SupportInvestigationIssueType;
}): SupportEscalationTeam => {
  if (issueType) {
    switch (issueType) {
      case "PAYMENT_ORDER_NOT_CREATED":
      case "PAYMENT_GENERAL":
        return "PAYMENT_FINANCE";

      case "REFUND_ISSUE":
        return "REFUND_TEAM";

      case "DELIVERY_ISSUE":
        return "DELIVERY_TEAM";

      case "COUPON_ISSUE":
        return "COUPON_PROMOTIONS";

      case "WALLET_REWARD_ISSUE":
        return "WALLET_REWARDS";

      case "ORDER_TIMELINE_STALE":
        return "SELLER_FULFILLMENT";

      case "GENERAL_ISSUE":
      default:
        return "CUSTOMER_OPERATIONS";
    }
  }

  switch (ticket.category) {
    case "PAYMENT":
      return "PAYMENT_FINANCE";

    case "RETURN_REFUND":
      return "REFUND_TEAM";

    case "DELIVERY":
      return "DELIVERY_TEAM";

    case "COUPON":
      return "COUPON_PROMOTIONS";

    case "WALLET_REWARDS":
      return "WALLET_REWARDS";

    case "ORDER":
      return "SELLER_FULFILLMENT";

    case "ACCOUNT":
      return "CUSTOMER_OPERATIONS";

    case "OTHER":
    default:
      return "CUSTOMER_OPERATIONS";
  }
};

export const buildDefaultEscalationReason = ({
  ticket,
  recommendedAction
}: {
  ticket: CustomerSupportTicket;
  recommendedAction?: string;
}): string => {
  if (recommendedAction) {
    return recommendedAction;
  }

  if (ticket.orderId) {
    return `Ticket ${ticket.ticketId} requires cross-team investigation for order ${ticket.orderId}.`;
  }

  return `Ticket ${ticket.ticketId} requires cross-team investigation.`;
};