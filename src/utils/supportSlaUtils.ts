import type {
  CustomerSupportTicket,
  SupportTicketPriority,
  SupportTicketStatus
} from "../types/customerSupport";

export type SupportSlaState =
  | "RESOLVED"
  | "CLOSED"
  | "OVERDUE"
  | "DUE_TODAY"
  | "BREACH_SOON"
  | "ON_TRACK";

export interface SupportSlaSummary {
  totalActive: number;
  overdue: number;
  dueToday: number;
  breachSoon: number;
  escalated: number;
  urgent: number;
}

const SLA_HOURS_BY_PRIORITY: Record<SupportTicketPriority, number> = {
  URGENT: 4,
  HIGH: 12,
  MEDIUM: 24,
  LOW: 48
};

const CLOSED_STATUSES: SupportTicketStatus[] = ["RESOLVED", "CLOSED"];

export const getSlaHoursByPriority = (
  priority: SupportTicketPriority
): number => {
  return SLA_HOURS_BY_PRIORITY[priority];
};

export const calculateSlaDueAt = ({
  createdAt,
  priority
}: {
  createdAt: string;
  priority: SupportTicketPriority;
}): string => {
  const createdDate = new Date(createdAt);
  const slaHours = getSlaHoursByPriority(priority);

  createdDate.setHours(createdDate.getHours() + slaHours);

  return createdDate.toISOString();
};

export const isTicketClosedForSla = (
  status: SupportTicketStatus
): boolean => {
  return CLOSED_STATUSES.includes(status);
};

export const getTicketSlaDueAt = (
  ticket: CustomerSupportTicket
): string => {
  return (
    ticket.slaDueAt ??
    calculateSlaDueAt({
      createdAt: ticket.createdAt,
      priority: ticket.priority
    })
  );
};

export const getSupportSlaState = (
  ticket: CustomerSupportTicket,
  now = new Date()
): SupportSlaState => {
  if (ticket.status === "RESOLVED") {
    return "RESOLVED";
  }

  if (ticket.status === "CLOSED") {
    return "CLOSED";
  }

  const dueAt = new Date(getTicketSlaDueAt(ticket));
  const diffMs = dueAt.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    return "OVERDUE";
  }

  const isDueToday = dueAt.toDateString() === now.toDateString();

  if (isDueToday) {
    return "DUE_TODAY";
  }

  if (diffHours <= 4) {
    return "BREACH_SOON";
  }

  return "ON_TRACK";
};

export const shouldAutoEscalateTicket = (
  ticket: CustomerSupportTicket
): boolean => {
  if (isTicketClosedForSla(ticket.status)) {
    return false;
  }

  const slaState = getSupportSlaState(ticket);

  return ticket.priority === "URGENT" || slaState === "OVERDUE";
};

export const getSlaBadgeClass = (state: SupportSlaState): string => {
  switch (state) {
    case "OVERDUE":
      return "text-bg-danger";

    case "DUE_TODAY":
      return "text-bg-warning";

    case "BREACH_SOON":
      return "text-bg-info";

    case "RESOLVED":
      return "text-bg-success";

    case "CLOSED":
      return "text-bg-dark";

    case "ON_TRACK":
    default:
      return "text-bg-light border";
  }
};

export const getSlaLabel = (state: SupportSlaState): string => {
  switch (state) {
    case "OVERDUE":
      return "Overdue";

    case "DUE_TODAY":
      return "Due Today";

    case "BREACH_SOON":
      return "Breach Soon";

    case "RESOLVED":
      return "Resolved";

    case "CLOSED":
      return "Closed";

    case "ON_TRACK":
    default:
      return "On Track";
  }
};

export const normalizeSupportTicketSla = (
  ticket: CustomerSupportTicket
): CustomerSupportTicket => {
  const slaDueAt =
    ticket.slaDueAt ??
    calculateSlaDueAt({
      createdAt: ticket.createdAt,
      priority: ticket.priority
    });

  const normalizedTicket: CustomerSupportTicket = {
    ...ticket,
    slaDueAt
  };

  const slaState = getSupportSlaState(normalizedTicket);
  const shouldEscalate = shouldAutoEscalateTicket(normalizedTicket);

  return {
    ...normalizedTicket,
    slaBreached: slaState === "OVERDUE",
    escalated: ticket.escalated ?? shouldEscalate,
    escalatedAt:
      ticket.escalatedAt ??
      (shouldEscalate ? new Date().toISOString() : undefined),
    escalationReason:
      ticket.escalationReason ??
      (shouldEscalate
        ? ticket.priority === "URGENT"
          ? "Urgent priority ticket requires immediate attention."
          : "Ticket has breached SLA."
        : undefined)
  };
};

export const buildSupportSlaSummary = (
  tickets: CustomerSupportTicket[]
): SupportSlaSummary => {
  const activeTickets = tickets.filter(
    (ticket) => !isTicketClosedForSla(ticket.status)
  );

  return {
    totalActive: activeTickets.length,
    overdue: activeTickets.filter(
      (ticket) => getSupportSlaState(ticket) === "OVERDUE"
    ).length,
    dueToday: activeTickets.filter(
      (ticket) => getSupportSlaState(ticket) === "DUE_TODAY"
    ).length,
    breachSoon: activeTickets.filter(
      (ticket) => getSupportSlaState(ticket) === "BREACH_SOON"
    ).length,
    escalated: activeTickets.filter((ticket) => ticket.escalated).length,
    urgent: activeTickets.filter((ticket) => ticket.priority === "URGENT")
      .length
  };
};