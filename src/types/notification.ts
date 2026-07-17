export type NotificationType =
  | "ORDER"
  | "PROMOTION"
  | "SYSTEM"
  | "SUPPORT"
  | "REVIEW"
  | "INVENTORY";

export type NotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "DANGER";

export type NotificationEntityType =
  | "ORDER"
  | "SUPPORT_TICKET"
  | "WALLET"
  | "REWARD"
  | "COUPON"
  | "PRODUCT"
  | "REVIEW"
  | "INVENTORY"
  | "SYSTEM";

export type NotificationAudienceRole =
  | "CUSTOMER"
  | "ADMIN"
  | "SELLER"
  | "SUPPORT";

export interface AppNotification {
  id: string;
  userId?: string;
  audienceRole?: NotificationAudienceRole;

  title: string;
  message: string;

  type: NotificationSeverity;
  category?: NotificationType;

  isRead: boolean;
  createdAt: string;

  link?: string;
  route?: string;

  referenceId?: string;
  entityId?: string;
  entityType?: NotificationEntityType;

  metadata?: Record<string, string | number | boolean | null>;
}

export interface CreateNotificationPayload {
  userId?: string;
  audienceRole?: NotificationAudienceRole;

  title: string;
  message: string;

  type: NotificationSeverity;
  category?: NotificationType;

  link?: string;
  route?: string;

  referenceId?: string;
  entityId?: string;
  entityType?: NotificationEntityType;

  metadata?: Record<string, string | number | boolean | null>;
}

export interface UpdateNotificationPayload {
  isRead?: boolean;
}