import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { notificationService } from "../../services/notificationService";
import type {
  AppNotification,
  NotificationAudienceRole,
  NotificationType,
} from "../../types/notification";
import {
  confirmBulkDelete,
  confirmDelete
} from "../../utils/deleteConfirmationUtils";

const getNotificationIcon = (category?: NotificationType): string => {
  switch (category) {
    case "ORDER":
      return "bi bi-receipt";

    case "PROMOTION":
      return "bi bi-tags";

    case "SUPPORT":
      return "bi bi-headset";

    case "REVIEW":
      return "bi bi-star";

    case "INVENTORY":
      return "bi bi-box-seam";

    case "SYSTEM":
    default:
      return "bi bi-bell";
  }
};

const getSeverityClass = (type: AppNotification["type"]): string => {
  switch (type) {
    case "SUCCESS":
      return "notification-success";

    case "WARNING":
      return "notification-warning";

    case "DANGER":
      return "notification-danger";

    case "INFO":
    default:
      return "notification-info";
  }
};

const getNotificationRoute = (notification: AppNotification): string | null => {
  return notification.route ?? notification.link ?? null;
};

const getCurrentUserRole = (
  role?: string,
): NotificationAudienceRole | undefined => {
  if (
    role === "CUSTOMER" ||
    role === "ADMIN" ||
    role === "SELLER" ||
    role === "SUPPORT"
  ) {
    return role;
  }

  return undefined;
};

const NotificationCenter = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.isRead).length;
  }, [notifications]);

  const loadNotifications = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      if (!currentUser) {
        setNotifications([]);
        return;
      }

      try {
        setIsLoading(true);

        const result = await notificationService.getVisibleNotificationsForUser(
          {
            userId: currentUser.id,
            role: getCurrentUserRole(currentUser.role),
          },
        );

        if (signal?.aborted) {
          return;
        }

        setNotifications(result);
      } catch {
        if (signal?.aborted) {
          return;
        }

        showToast(
          "Notifications unavailable",
          "Unable to load notifications right now.",
          "danger",
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [currentUser, showToast],
  );

  useEffect(() => {
    const controller = new AbortController();

    if (isAuthenticated) {
      void loadNotifications(controller.signal);
    } else {
      setNotifications([]);
      setIsOpen(false);
    }

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, loadNotifications]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent): void => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleToggle = (): void => {
    const nextOpenState = !isOpen;

    setIsOpen(nextOpenState);

    if (nextOpenState) {
      void loadNotifications();
    }
  };

  const handleNotificationClick = async (
    notification: AppNotification,
  ): Promise<void> => {
    try {
      if (!notification.isRead) {
        const updatedNotification = await notificationService.markAsRead(
          notification.id,
        );

        setNotifications((previousNotifications) =>
          previousNotifications.map((existingNotification) =>
            existingNotification.id === updatedNotification.id
              ? updatedNotification
              : existingNotification,
          ),
        );
      }

      setIsOpen(false);

      const route = getNotificationRoute(notification);

      if (route) {
        navigate(route);
      }
    } catch {
      showToast("Unable to update notification", "Please try again.", "danger");
    }
  };

  const handleMarkAllAsRead = async (): Promise<void> => {
    try {
      await notificationService.markAllAsRead(notifications);

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      showToast(
        "Notifications updated",
        "All notifications marked as read.",
        "success",
      );
    } catch {
      showToast(
        "Unable to update notifications",
        "Please try again.",
        "danger",
      );
    }
  };
  

const handleDeleteNotification = async (
  notificationId: string
): Promise<void> => {
  const confirmed = confirmDelete({
    entityLabel: "Notification",
    entityId: notificationId
  });

  if (!confirmed) {
    return;
  }

  try {
    await notificationService.deleteNotification(notificationId);

    setNotifications((previousNotifications) =>
      previousNotifications.filter(
        (notification) => notification.id !== notificationId
      )
    );

    showToast(
      "Notification deleted",
      "The notification has been removed successfully.",
      "success"
    );
  } catch {
    showToast(
      "Unable to delete notification",
      "Please make sure JSON Server is running and try again.",
      "danger"
    );
  }
};

  const handleClearAll = async (): Promise<void> => {
  if (!currentUser) {
    return;
  }

  const confirmed = confirmBulkDelete({
    entityLabel: "notifications",
    count: notifications.length
  });

  if (!confirmed) {
    return;
  }

  try {
    await notificationService.deleteAllVisibleForUser({
      userId: currentUser.id,
      role: getCurrentUserRole(currentUser.role)
    });

    setNotifications([]);

    showToast(
      "Notifications cleared",
      "All notifications were removed.",
      "success"
    );
  } catch {
    showToast("Unable to clear notifications", "Please try again.", "danger");
  }
};

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="notification-center" ref={wrapperRef}>
      <button
        type="button"
        className="notification-toggle-btn"
        onClick={handleToggle}
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <i className="bi bi-bell" />

        {unreadCount > 0 ? (
          <span className="notification-count-badge">{unreadCount}</span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="notification-dropdown bg-white rounded-3">
          <div className="notification-dropdown-header border-bottom">
            <div>
              <h6 className="fw-bold mb-1">Notifications</h6>

              <p className="small text-muted mb-0">
                {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-link btn-sm text-decoration-none p-0"
              disabled={notifications.length === 0 || isLoading}
              onClick={() => void handleMarkAllAsRead()}
            >
              Mark all read
            </button>
          </div>

          <div className="notification-dropdown-body">
            {isLoading ? (
              <div className="text-center text-muted py-4">
                <div
                  className="spinner-border spinner-border-sm text-primary me-2"
                  role="status"
                />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty-state text-center py-4">
                <i className="bi bi-bell-slash text-muted" />
                <p className="text-muted mb-0 mt-2">No notifications found.</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const route = getNotificationRoute(notification);

                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${
                      notification.isRead ? "" : "unread"
                    }`}
                  >
                    <button
                      type="button"
                      className="notification-item-main"
                      onClick={() => void handleNotificationClick(notification)}
                    >
                      <span
                        className={`notification-item-icon ${getSeverityClass(
                          notification.type,
                        )}`}
                      >
                        <i
                          className={getNotificationIcon(notification.category)}
                        />
                      </span>

                      <span className="flex-grow-1">
                        <strong>{notification.title}</strong>

                        <small>{notification.message}</small>

                        <span className="notification-time">
                          {new Intl.DateTimeFormat("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(notification.createdAt))}
                        </span>

                        {notification.category ? (
                          <span className="notification-category-badge">
                            {notification.category.replace(/_/g, " ")}
                          </span>
                        ) : null}

                        {route ? (
                          <span className="visually-hidden">Opens {route}</span>
                        ) : null}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="notification-delete-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeleteNotification(notification.id);
                      }}
                      aria-label="Delete notification"
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && !isLoading ? (
            <div className="notification-dropdown-footer border-top">
              <button
                type="button"
                className="btn btn-link text-danger text-decoration-none p-0 fw-bold"
                onClick={() => void handleClearAll()}
              >
                Clear all notifications
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default NotificationCenter;
