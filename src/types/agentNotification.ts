export type AgentNotificationRecipientRole =
  | "ADMIN"
  | "PICKUP_AGENT"
  | "DELIVERY_AGENT"
  | "LOGISTICS_AGENT";

export type AgentNotificationSeverity =
  | "info"
  | "success"
  | "warning"
  | "danger";

export type AgentNotificationEntityType =
  | "AGENT_ASSIGNMENT"
  | "RETURN_PICKUP"
  | "ORDER_DELIVERY"
  | "PICKUP_PROOF"
  | "DELIVERY_PROOF"
  | "SLA_ALERT";

export interface AgentNotification {
  id: string;
  notificationId: string;

  recipientUserId?: string;
  recipientRole: AgentNotificationRecipientRole;
  recipientPartnerId?: string;

  title: string;
  message: string;
  severity: AgentNotificationSeverity;

  entityType: AgentNotificationEntityType;
  entityId: string;
  entityDbId?: string;

  actionUrl?: string;

  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentNotificationPayload {
  recipientUserId?: string;
  recipientRole: AgentNotificationRecipientRole;
  recipientPartnerId?: string;

  title: string;
  message: string;
  severity: AgentNotificationSeverity;

  entityType: AgentNotificationEntityType;
  entityId: string;
  entityDbId?: string;

  actionUrl?: string;
}