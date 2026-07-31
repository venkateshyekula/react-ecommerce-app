export type NotificationType =
  | "ORDER"
  | "PAYMENT"
  | "PROMOTION"
  | "SYSTEM"
  | "REFUND"
  | "RETURN"
  | "SUPPORT"
  | "REVIEW"
  | "INVENTORY";

export type NotificationSeverity =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "DANGER";

export type NotificationEntityType =
  | "ORDER"
  | "RETURN"
  | "RETURN_REQUEST"
  | "REFUND"
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

  /**
   * For user-specific notifications.
   * Example: customer return/refund notification.
   */
  userId?: string;

  /**
   * For role-wide notifications.
   * Example: notify support team or admin team.
   */
  audienceRole?: NotificationAudienceRole;

  title: string;
  message: string;

  /**
   * Severity controls UI style.
   * Example: INFO, SUCCESS, WARNING, DANGER.
   */
  type: NotificationSeverity;

  /**
   * Category controls module grouping.
   * Example: RETURN, SUPPORT, ORDER, REFUND.
   */
  category?: NotificationType;

  isRead: boolean;
  createdAt: string;

  /**
   * Either link or route can be used by your notification center.
   */
  link?: string;
  route?: string;

  /**
   * Generic reference values.
   */
  referenceId?: string;
  referenceType?: string;

  /**
   * Return-specific mapping.
   * Optional because non-return notifications do not need this.
   */
  returnRequestId?: string;
  orderId?: string;

  /**
   * Entity mapping for generic notification routing.
   */
  entityId?: string;
  entityType?: NotificationEntityType;

  /**
   * Extra contextual information.
   */
  metadata?: Record<string, string | number | boolean | null>;

  /**
   * Workflow event name.
   * Example: REFUND_COMPLETED, PICKUP_ASSIGNED, QC_FAILED.
   */
  eventType?: string;
}

export interface CreateNotificationPayload {
  userId?: string;
  audienceRole?: NotificationAudienceRole;

  title: string;
  message: string;

  /**
   * Severity controls UI style.
   */
  type: NotificationSeverity;

  /**
   * Category controls module grouping.
   */
  category?: NotificationType;

  link?: string;
  route?: string;

  referenceId?: string;
  referenceType?: string;

  /**
   * Return-specific mapping.
   */
  returnRequestId?: string;
  orderId?: string;

  entityId?: string;
  entityType?: NotificationEntityType;

  metadata?: Record<string, string | number | boolean | null>;

  eventType?: string;
}

export interface UpdateNotificationPayload {
  isRead?: boolean;
}