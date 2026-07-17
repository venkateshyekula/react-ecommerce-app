export type SupportEscalationStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_FOR_EXTERNAL_TEAM"
  | "RESOLVED"
  | "CANCELLED";

export type SupportEscalationTeam =
  | "PAYMENT_FINANCE"
  | "REFUND_TEAM"
  | "DELIVERY_TEAM"
  | "SELLER_FULFILLMENT"
  | "WAREHOUSE_TEAM"
  | "COUPON_PROMOTIONS"
  | "WALLET_REWARDS"
  | "TECH_SUPPORT"
  | "CUSTOMER_OPERATIONS";

export type SupportEscalationPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export interface SupportEscalationActivity {
  id: string;
  label: string;
  description: string;
  createdByName: string;
  createdAt: string;
}

export interface SupportEscalation {
  id: string;
  escalationId: string;

  ticketDbId: string;
  ticketNumber: string;

  orderId?: string;
  userId: string;
  userName: string;

  team: SupportEscalationTeam;
  status: SupportEscalationStatus;
  priority: SupportEscalationPriority;

  reason: string;

  assignedToUserId?: string | null;
  assignedToName?: string | null;

  createdByUserId: string;
  createdByName: string;

  createdAt: string;
  updatedAt: string;

  resolvedAt?: string | null;
  resolutionNote?: string | null;

  activities: SupportEscalationActivity[];
}

export interface CreateSupportEscalationPayload {
  ticketDbId: string;
  ticketNumber: string;

  orderId?: string;
  userId: string;
  userName: string;

  team: SupportEscalationTeam;
  priority: SupportEscalationPriority;
  reason: string;

  createdByUserId: string;
  createdByName: string;
}

export interface UpdateSupportEscalationPayload {
  status?: SupportEscalationStatus;
  team?: SupportEscalationTeam;
  priority?: SupportEscalationPriority;
  reason?: string;

  assignedToUserId?: string | null;
  assignedToName?: string | null;

  resolvedAt?: string | null;
  resolutionNote?: string | null;

  activities?: SupportEscalationActivity[];

  updatedAt?: string;
}