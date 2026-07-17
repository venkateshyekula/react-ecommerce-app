import { apiClient } from "./apiClient";
import type {
  AppNotification,
  CreateNotificationPayload,
  NotificationAudienceRole,
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

    const notification: AppNotification = {
      ...payload,
      id: generateNotificationId(),
      isRead: false,
      createdAt,
      route: payload.route ?? payload.link ?? "",
      link: payload.link ?? payload.route ?? ""
    };

    return apiClient.post<AppNotification, AppNotification>(
      NOTIFICATIONS_ENDPOINT,
      notification
    );
  },

  markAsRead: async (
    notificationId: string
  ): Promise<AppNotification> => {
    const patchPayload: UpdateNotificationPayload = { isRead: true };
    return apiClient.patch<AppNotification, AppNotification>(
      `${NOTIFICATIONS_ENDPOINT}/${notificationId}`,
      patchPayload as unknown as AppNotification
    );
  },

  markAsUnread: async (
    notificationId: string
  ): Promise<AppNotification> => {
    const patchPayload: UpdateNotificationPayload = { isRead: false };
    return apiClient.patch<AppNotification, AppNotification>(
      `${NOTIFICATIONS_ENDPOINT}/${notificationId}`,
      patchPayload as unknown as AppNotification
    );
  },

  updateNotification: async (
    notificationId: string,
    payload: UpdateNotificationPayload
  ): Promise<AppNotification> => {
    return apiClient.patch<AppNotification, AppNotification>(
      `${NOTIFICATIONS_ENDPOINT}/${notificationId}`,
      payload as unknown as AppNotification
    );
  },

  /**
   * Safe batch operation updating all unread states while properly
   * preserving the full list array length context upon execution return.
   */
  markAllAsRead: async (
    notifications: AppNotification[]
  ): Promise<AppNotification[]> => {
    const updatedNotificationsPromises = notifications.map((notification) => {
      if (!notification.isRead) {
        return notificationService.markAsRead(notification.id);
      }
      return Promise.resolve(notification);
    });

    return Promise.all(updatedNotificationsPromises);
  },

  /*deleteNotification: async (notificationId: string): Promise<void> => {
    await apiClient.delete<void>(
      `${NOTIFICATIONS_ENDPOINT}/${notificationId}`
    );
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
  if (!notificationId.startsWith("notification-")) {
    throw new Error(
      `Invalid notification id "${notificationId}". Notification delete only accepts notification ids.`
    );
  }

  await apiClient.delete<void>(
    `${NOTIFICATIONS_ENDPOINT}/${encodeURIComponent(notificationId)}`
  );
},*/

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