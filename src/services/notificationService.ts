import { apiClient } from "./apiClient";
import type {
  AppNotification,
  CreateNotificationPayload,
  NotificationAudienceRole,
  NotificationSeverity,
  UpdateNotificationPayload
} from "../types/notification";
import { assertValidDeleteId } from "../utils/deleteSafetyUtils";

const NOTIFICATIONS_ENDPOINT = "/notifications";

const sortNotificationsByLatest = (
  notifications: AppNotification[]
): AppNotification[] => {
  return [...notifications].sort(
    (firstNotification, secondNotification) =>
      new Date(secondNotification.createdAt).getTime() -
      new Date(firstNotification.createdAt).getTime()
  );
};

const generateNotificationId = (): string => {
  return `notification-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

export interface ReturnNotificationContext {
  userId: string;
  orderId: string;
  returnRequestId: string;
  returnRequestDbId?: string;
  actorName?: string;
  route?: string;
}

export interface ReturnSupportNotificationContext
  extends ReturnNotificationContext {
  ticketId?: string;
  supportTicketDbId?: string;
}

const buildReturnNotificationRoute = (
  context: ReturnNotificationContext
): string => {
  if (context.route) {
    return context.route;
  }

  return `/my-returns?returnRequestId=${encodeURIComponent(
    context.returnRequestId
  )}&orderId=${encodeURIComponent(context.orderId)}`;
};

const buildSupportTicketRoute = (
  context: ReturnSupportNotificationContext
): string => {
  const params = new URLSearchParams();

  params.set("orderId", context.orderId);
  params.set("returnRequestId", context.returnRequestId);

  if (context.ticketId) {
    params.set("ticketId", context.ticketId);
  }

  return `/support-tickets?${params.toString()}`;
};

const buildReturnNotificationPayload = ({
  context,
  title,
  message,
  eventType,
  severity = "INFO",
  audienceRole,
  route
}: {
  context: ReturnNotificationContext;
  title: string;
  message: string;
  eventType: string;
  severity?: NotificationSeverity;
  audienceRole?: NotificationAudienceRole;
  route?: string;
}): CreateNotificationPayload => {
  const finalRoute = route ?? buildReturnNotificationRoute(context);

  return {
    userId: audienceRole ? undefined : context.userId,
    audienceRole,
    title,
    message,

    /**
     * IMPORTANT:
     * type is NotificationSeverity.
     * Do not assign eventType here.
     */
    type: severity,

    /**
     * Module category.
     */
    category: "RETURN",

    referenceType: "RETURN_REQUEST",
    referenceId: context.returnRequestId,
    entityId: context.returnRequestDbId ?? context.returnRequestId,
    entityType: "RETURN_REQUEST",

    orderId: context.orderId,
    returnRequestId: context.returnRequestId,
    route: finalRoute,
    link: finalRoute,

    /**
     * Workflow-specific event.
     */
    eventType,

    metadata: {
      orderId: context.orderId,
      returnRequestId: context.returnRequestId,
      returnRequestDbId: context.returnRequestDbId ?? null,
      actorName: context.actorName ?? null,
      eventType
    }
  };
};

export const notificationService = {
  getNotifications: async (): Promise<AppNotification[]> => {
    const notifications = await apiClient.get<AppNotification[]>(
      NOTIFICATIONS_ENDPOINT
    );

    return sortNotificationsByLatest(notifications);
  },

  getNotificationsByUserId: async (
    userId: string
  ): Promise<AppNotification[]> => {
    const notifications = await apiClient.get<AppNotification[]>(
      `${NOTIFICATIONS_ENDPOINT}?userId=${encodeURIComponent(userId)}`
    );

    return sortNotificationsByLatest(notifications);
  },

  getNotificationsByAudienceRole: async (
    audienceRole: NotificationAudienceRole
  ): Promise<AppNotification[]> => {
    const notifications = await apiClient.get<AppNotification[]>(
      `${NOTIFICATIONS_ENDPOINT}?audienceRole=${encodeURIComponent(
        audienceRole
      )}`
    );

    return sortNotificationsByLatest(notifications);
  },

  getVisibleNotificationsForUser: async ({
    userId,
    role
  }: {
    userId: string;
    role?: NotificationAudienceRole;
  }): Promise<AppNotification[]> => {
    const notifications = await notificationService.getNotifications();

    const visibleNotifications = notifications.filter((notification) => {
      const matchesUser = notification.userId === userId;
      const matchesRole =
        Boolean(role) && notification.audienceRole === role;

      return matchesUser || matchesRole;
    });

    return sortNotificationsByLatest(visibleNotifications);
  },

  getNotificationsByReferenceId: async (
    referenceId: string
  ): Promise<AppNotification[]> => {
    const notifications = await apiClient.get<AppNotification[]>(
      `${NOTIFICATIONS_ENDPOINT}?referenceId=${encodeURIComponent(referenceId)}`
    );

    return sortNotificationsByLatest(notifications);
  },

  getNotificationsByEntityId: async (
    entityId: string
  ): Promise<AppNotification[]> => {
    const notifications = await apiClient.get<AppNotification[]>(
      `${NOTIFICATIONS_ENDPOINT}?entityId=${encodeURIComponent(entityId)}`
    );

    return sortNotificationsByLatest(notifications);
  },

  getNotificationsByUserIdAndReferenceId: async (
    userId: string,
    referenceId: string
  ): Promise<AppNotification[]> => {
    const notifications = await apiClient.get<AppNotification[]>(
      `${NOTIFICATIONS_ENDPOINT}?userId=${encodeURIComponent(
        userId
      )}&referenceId=${encodeURIComponent(referenceId)}`
    );

    return sortNotificationsByLatest(notifications);
  },

  createNotification: async (
    payload: CreateNotificationPayload
  ): Promise<AppNotification> => {
    const createdAt = new Date().toISOString();
    const notificationId = generateNotificationId();

    // Explicit fallback resolution for route/link to ensure clean strings
    const route = payload.route ?? payload.link ?? "";
    const link = payload.link ?? payload.route ?? "";

    const notification: AppNotification = {
      ...payload,
      // Placed after ...payload so payload.id can never overwrite the server/generated ID
      id: notificationId,
      isRead: false,
      createdAt,
      route,
      link
    };

    return apiClient.post<AppNotification, AppNotification>(
      NOTIFICATIONS_ENDPOINT,
      notification
    );
  },

  createNotifications: async (
    payloads: CreateNotificationPayload[]
  ): Promise<AppNotification[]> => {
    return Promise.all(
      payloads.map((payload) =>
        notificationService.createNotification(payload)
      )
    );
  },

  createReturnNotification: async ({
    context,
    title,
    message,
    eventType,
    severity = "INFO",
    audienceRole,
    route
  }: {
    context: ReturnNotificationContext;
    title: string;
    message: string;
    eventType: string;
    severity?: NotificationSeverity;
    audienceRole?: NotificationAudienceRole;
    route?: string;
  }): Promise<AppNotification> => {
    return notificationService.createNotification(
      buildReturnNotificationPayload({
        context,
        title,
        message,
        eventType,
        severity,
        audienceRole,
        route
      })
    );
  },

  notifyReturnRequested: async (
    context: ReturnNotificationContext
  ): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_REQUESTED",
      severity: "INFO",
      title: "Return request submitted",
      message: `Your return request ${context.returnRequestId} has been submitted successfully.`
    });
  },

  notifyReturnApproved: async (
    context: ReturnNotificationContext
  ): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_APPROVED",
      severity: "SUCCESS",
      title: "Return request approved",
      message: `Your return request ${context.returnRequestId} has been approved. Pickup will be scheduled soon.`
    });
  },

  notifyReturnRejected: async ({
    context,
    reason
  }: {
    context: ReturnNotificationContext;
    reason?: string;
  }): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_REJECTED",
      severity: "DANGER",
      title: "Return request rejected",
      message: reason
        ? `Your return request ${context.returnRequestId} was rejected. Reason: ${reason}`
        : `Your return request ${context.returnRequestId} was rejected. Please contact support if you need help.`
    });
  },

  notifyReturnPickupAssigned: async (
    context: ReturnNotificationContext
  ): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_PICKUP_ASSIGNED",
      severity: "INFO",
      title: "Return pickup assigned",
      message: `Pickup has been assigned for return ${context.returnRequestId}.`
    });
  },

  notifyReturnPickupOutForPickup: async (
    context: ReturnNotificationContext
  ): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_PICKUP_OUT_FOR_PICKUP",
      severity: "INFO",
      title: "Pickup agent is on the way",
      message: `Pickup agent is out for pickup for return ${context.returnRequestId}.`
    });
  },

  notifyReturnPickupFailed: async ({
    context,
    reason
  }: {
    context: ReturnNotificationContext;
    reason?: string;
  }): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_PICKUP_FAILED",
      severity: "WARNING",
      title: "Return pickup attempt failed",
      message: reason
        ? `Pickup attempt failed for return ${context.returnRequestId}. Reason: ${reason}`
        : `Pickup attempt failed for return ${context.returnRequestId}. Please check pickup details.`
    });
  },

  notifyReturnPickedUp: async (
    context: ReturnNotificationContext
  ): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_PICKED_UP",
      severity: "SUCCESS",
      title: "Return package picked up",
      message: `Your return package ${context.returnRequestId} has been picked up successfully.`
    });
  },

  notifyReturnWarehouseReceived: async (
    context: ReturnNotificationContext
  ): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_WAREHOUSE_RECEIVED",
      severity: "INFO",
      title: "Return reached warehouse",
      message: `Your return ${context.returnRequestId} has reached the warehouse for quality check.`
    });
  },

  notifyReturnQcStarted: async (
    context: ReturnNotificationContext
  ): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_QC_STARTED",
      severity: "INFO",
      title: "Quality check started",
      message: `Quality check has started for return ${context.returnRequestId}.`
    });
  },

  notifyReturnQcPassed: async (
    context: ReturnNotificationContext
  ): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_QC_PASSED",
      severity: "SUCCESS",
      title: "Quality check passed",
      message: `Quality check passed for return ${context.returnRequestId}. Refund processing will begin shortly.`
    });
  },

  notifyReturnQcFailed: async ({
    context,
    reason
  }: {
    context: ReturnNotificationContext;
    reason?: string;
  }): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_QC_FAILED",
      severity: "DANGER",
      title: "Quality check failed",
      message: reason
        ? `Quality check failed for return ${context.returnRequestId}. Reason: ${reason}`
        : `Quality check failed for return ${context.returnRequestId}. Please contact support for more details.`
    });
  },

  notifyReturnRefundInitiated: async (
    context: ReturnNotificationContext
  ): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_REFUND_INITIATED",
      severity: "INFO",
      title: "Refund initiated",
      message: `Refund has been initiated for return ${context.returnRequestId}.`
    });
  },

  notifyReturnRefundCompleted: async ({
    context,
    referenceId
  }: {
    context: ReturnNotificationContext;
    referenceId?: string;
  }): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_REFUND_COMPLETED",
      severity: "SUCCESS",
      title: "Refund completed",
      message: referenceId
        ? `Refund completed for return ${context.returnRequestId}. Reference ID: ${referenceId}`
        : `Refund completed for return ${context.returnRequestId}.`
    });
  },

  notifyReturnWalletCreditAdded: async ({
    context,
    amount
  }: {
    context: ReturnNotificationContext;
    amount: number;
  }): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_WALLET_CREDIT_ADDED",
      severity: "SUCCESS",
      title: "Wallet credit added",
      message: `Wallet credit of ₹${amount.toLocaleString(
        "en-IN"
      )} has been added for return ${context.returnRequestId}.`
    });
  },

  notifyReturnCouponAdded: async ({
    context,
    couponCode
  }: {
    context: ReturnNotificationContext;
    couponCode: string;
  }): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_COUPON_ADDED",
      severity: "SUCCESS",
      title: "Return compensation coupon added",
      message: `Coupon ${couponCode} has been added for return ${context.returnRequestId}.`
    });
  },

  notifyReturnCancelled: async (
    context: ReturnNotificationContext
  ): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_CANCELLED",
      severity: "WARNING",
      title: "Return request cancelled",
      message: `Your return request ${context.returnRequestId} has been cancelled.`
    });
  },

  notifyReturnClosed: async (
    context: ReturnNotificationContext
  ): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_CLOSED",
      severity: "INFO",
      title: "Return case closed",
      message: `Your return case ${context.returnRequestId} has been closed.`
    });
  },

  notifyReturnSupportTicketCreated: async (
    context: ReturnSupportNotificationContext
  ): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_SUPPORT_TICKET_CREATED",
      severity: "INFO",
      title: "Return support ticket created",
      message: context.ticketId
        ? `Support ticket ${context.ticketId} has been created for return ${context.returnRequestId}.`
        : `A support ticket has been created for return ${context.returnRequestId}.`,
      route: buildSupportTicketRoute(context)
    });
  },

  notifyReturnSupportReplyAdded: async (
    context: ReturnSupportNotificationContext
  ): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_SUPPORT_REPLY_ADDED",
      severity: "INFO",
      title: "Support replied to your return issue",
      message: context.ticketId
        ? `Support has replied to ticket ${context.ticketId} for return ${context.returnRequestId}.`
        : `Support has replied to your return issue ${context.returnRequestId}.`,
      route: buildSupportTicketRoute(context)
    });
  },

  notifyReturnSupportStatusUpdated: async ({
    context,
    status
  }: {
    context: ReturnSupportNotificationContext;
    status: string;
  }): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      eventType: "RETURN_SUPPORT_STATUS_UPDATED",
      severity: "INFO",
      title: "Return support ticket updated",
      message: context.ticketId
        ? `Support ticket ${context.ticketId} status changed to ${status}.`
        : `Return support ticket status changed to ${status}.`,
      route: buildSupportTicketRoute(context)
    });
  },

  notifySupportTeamForCustomerReturnReply: async ({
    context,
    audienceRole
  }: {
    context: ReturnSupportNotificationContext;
    audienceRole: NotificationAudienceRole;
  }): Promise<AppNotification> => {
    return notificationService.createReturnNotification({
      context,
      audienceRole,
      eventType: "CUSTOMER_REPLIED_RETURN_SUPPORT_TICKET",
      severity: "INFO",
      title: "Customer replied to return support ticket",
      message: context.ticketId
        ? `Customer replied to ticket ${context.ticketId} for return ${context.returnRequestId}.`
        : `Customer replied to a return support ticket for ${context.returnRequestId}.`,
      route: buildSupportTicketRoute(context)
    });
  },

  markAsRead: async (
    notificationId: string
  ): Promise<AppNotification> => {
    return apiClient.patch<AppNotification, UpdateNotificationPayload>(
      `${NOTIFICATIONS_ENDPOINT}/${encodeURIComponent(notificationId)}`,
      { isRead: true }
    );
  },

  markAsUnread: async (
    notificationId: string
  ): Promise<AppNotification> => {
    return apiClient.patch<AppNotification, UpdateNotificationPayload>(
      `${NOTIFICATIONS_ENDPOINT}/${encodeURIComponent(notificationId)}`,
      { isRead: false }
    );
  },

  updateNotification: async (
    notificationId: string,
    payload: UpdateNotificationPayload
  ): Promise<AppNotification> => {
    return apiClient.patch<AppNotification, UpdateNotificationPayload>(
      `${NOTIFICATIONS_ENDPOINT}/${encodeURIComponent(notificationId)}`,
      payload
    );
  },

  markAllAsRead: async (
    notifications: AppNotification[]
  ): Promise<AppNotification[]> => {
    const unreadNotifications = notifications.filter(
      (notification) => !notification.isRead
    );

    return Promise.all(
      unreadNotifications.map((notification) =>
        notificationService.markAsRead(notification.id)
      )
    );
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    assertValidDeleteId({
      entityType: "notification",
      id: notificationId
    });

    await apiClient.delete<void>(
      `${NOTIFICATIONS_ENDPOINT}/${encodeURIComponent(notificationId)}`
    );
  },

  deleteAllByUserId: async (userId: string): Promise<void> => {
    const notifications =
      await notificationService.getNotificationsByUserId(userId);

    await Promise.all(
      notifications.map((notification) =>
        notificationService.deleteNotification(notification.id)
      )
    );
  },

  deleteAllVisibleForUser: async ({
    userId,
    role
  }: {
    userId: string;
    role?: NotificationAudienceRole;
  }): Promise<void> => {
    const notifications =
      await notificationService.getVisibleNotificationsForUser({
        userId,
        role
      });

    await Promise.all(
      notifications.map((notification) =>
        notificationService.deleteNotification(notification.id)
      )
    );
  }
};