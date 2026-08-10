import { useCallback, useEffect, useMemo, useState } from "react";
import AgentMobileSummaryCards from "../../components/agent/AgentMobileSummaryCards";
import AgentMobileTaskCard from "../../components/agent/AgentMobileTaskCard";
import AgentMobileTaskFilters from "../../components/agent/AgentMobileTaskFilters";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import {
  agentMobileExperienceService,
  requestNotificationPermission,
  showLocalNotification,
} from "../../services/agentMobileExperienceService";
import type {
  AgentMobileDashboardData,
  AgentMobileFilters,
  AgentMobileTaskUpdatePayload,
} from "../../types/agentMobileExperience";

const defaultFilters: AgentMobileFilters = {
  searchText: "",
  status: "ALL",
  taskType: "ALL",
  priority: "ALL",
};

interface AgentAuthUser {
  id?: string;
  name?: string;
  role?: string;
  partnerId?: string;
  pickupPartnerId?: string;
  deliveryPartnerId?: string;
}

const getAuthenticatedAgentId = (user?: AgentAuthUser | null): string => {
  if (!user) {
    return "";
  }

  if (user.role === "PICKUP_AGENT") {
    return user.pickupPartnerId ?? user.partnerId ?? "";
  }

  if (user.role === "DELIVERY_AGENT") {
    return user.deliveryPartnerId ?? user.partnerId ?? "";
  }

  return "";
};

const AgentMobileExperiencePage = () => {
  const { showToast } = useToast();
  const auth = useAuth();

  // Guard against null/undefined auth context
  const authenticatedUser = (
    auth && typeof auth === "object"
      ? "user" in auth
        ? auth.user
        : "currentUser" in auth
          ? auth.currentUser
          : null
      : null
  ) as AgentAuthUser | null;

  const authenticatedAgentId = getAuthenticatedAgentId(authenticatedUser);

  const isFieldAgent =
    authenticatedUser?.role === "PICKUP_AGENT" ||
    authenticatedUser?.role === "DELIVERY_AGENT";

  const [dashboardData, setDashboardData] =
    useState<AgentMobileDashboardData | null>(null);

  const [filters, setFilters] = useState<AgentMobileFilters>(defaultFilters);

  const [agentIdInput, setAgentIdInput] = useState<string>(
    authenticatedAgentId ||
      agentMobileExperienceService.getCurrentAgentId() ||
      "",
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savingTaskId, setSavingTaskId] = useState<string>("");

  // Safe lazy initialization for SSR / browser environments
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await agentMobileExperienceService.getDashboardData();
      setDashboardData(response);
    } catch (caughtError) {
      showToast(
        "Agent mobile dashboard failed",
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load assigned agent tasks.",
        "danger",
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Synchronize authenticated agent ID and trigger reload when auth resolves
  useEffect(() => {
    if (!authenticatedAgentId) {
      return;
    }

    agentMobileExperienceService.setCurrentAgentId(authenticatedAgentId);
    setAgentIdInput(authenticatedAgentId);
    void loadDashboard();
  }, [authenticatedAgentId, loadDashboard]);

  // Initial dashboard load
  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredTasks = useMemo(() => {
    const tasks = dashboardData?.tasks ?? [];
    const search = filters.searchText.trim().toLowerCase();

    return tasks.filter((task) => {
      const searchableText = [
        task.taskId,
        task.id,
        task.assignmentId ?? "",
        task.returnRequestId ?? "",
        task.orderId ?? "",
        task.trackingId ?? "",
        task.customer?.customerName ?? "",
        task.customer?.customerPhone ?? "",
        task.address?.city ?? "",
        task.address?.state ?? "",
        task.address?.pincode ?? "",
        task.productName ?? "",
        task.status,
        task.priority,
        task.taskType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!search || searchableText.includes(search)) &&
        (filters.status === "ALL" || task.status === filters.status) &&
        (filters.taskType === "ALL" || task.taskType === filters.taskType) &&
        (filters.priority === "ALL" || task.priority === filters.priority)
      );
    });
  }, [dashboardData, filters]);

  const handleAgentFilterApply = async (): Promise<void> => {
    const normalizedAgentId = agentIdInput.trim();

    if (normalizedAgentId) {
      agentMobileExperienceService.setCurrentAgentId(normalizedAgentId);
    } else {
      agentMobileExperienceService.clearCurrentAgentId();
    }

    await loadDashboard();
  };

  const handleEnableNotifications = async (): Promise<void> => {
    try {
      const isGranted = await requestNotificationPermission();

      // Map boolean to NotificationPermission
      const permissionState: NotificationPermission = isGranted
        ? "granted"
        : "denied";
      setNotificationPermission(permissionState);

      if (isGranted) {
        showToast(
          "Notifications enabled",
          "Task status notifications are now enabled.",
          "success",
        );

        showLocalNotification("ShopEase notifications enabled", {
          body: "Agent task updates will appear here.",
          tag: "agent-mobile-notifications-enabled",
        });
        return;
      }

      showToast(
        "Notifications not enabled",
        "Browser notification permission was not granted.",
        "warning",
      );
    } catch {
      showToast(
        "Notifications unavailable",
        "Unable to enable browser notifications.",
        "warning",
      );
    }
  };

  const handleTaskUpdate = async (
    payload: AgentMobileTaskUpdatePayload,
  ): Promise<void> => {
    const { task, nextStatus } = payload;

    try {
      setSavingTaskId(task.id);

      await agentMobileExperienceService.updateTaskStatus(payload);
      await loadDashboard();

      const formattedStatus = nextStatus.replace(/_/g, " ");

      showToast(
        "Task updated",
        `Task ${task.taskId} updated to ${formattedStatus}.`,
        "success",
      );

      showLocalNotification("Task Status Updated", {
        body: `Task ${task.taskId} marked as ${formattedStatus}.`,
        tag: task.taskId,
      });
    } catch (caughtError) {
      showToast(
        "Task update failed",
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update the agent task.",
        "danger",
      );

      throw caughtError;
    } finally {
      setSavingTaskId("");
    }
  };

  if (isLoading) {
    return (
      <main className="agent-mobile-experience-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading mobile agent tasks..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="agent-mobile-experience-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Agent mobile dashboard unavailable"
            message="Assigned agent tasks could not be loaded."
            iconClassName="bi bi-phone text-primary"
          />
        </section>
      </main>
    );
  }

  return (
    <main className="agent-mobile-experience-page bg-light min-vh-100">
      <section className="bg-white border-bottom sticky-top z-1">
        <div className="container-fluid py-3">
          <span className="badge rounded-pill text-bg-primary mb-2">
            Phase 12X.1
          </span>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <h1 className="h4 fw-bold mb-1">Agent Mobile Experience</h1>
              <p className="text-muted small mb-0">
                Mobile-first task workflow with coordinates, proof uploads, OTP,
                failure reporting, and notifications.
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2">
              {notificationPermission !== "unsupported" &&
                notificationPermission !== "granted" && (
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    disabled={Boolean(savingTaskId)}
                    onClick={() => void handleEnableNotifications()}
                  >
                    <i className="bi bi-bell me-2" aria-hidden="true" />
                    Enable Notifications
                  </button>
                )}

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={Boolean(savingTaskId)}
                onClick={() => void loadDashboard()}
              >
                <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="container-fluid py-3">
        {isFieldAgent ? (
          <div className="bg-white border rounded-4 p-3 mb-3 shadow-sm">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <div className="small text-muted">Logged-in agent</div>
                <div className="fw-semibold">
                  {authenticatedUser?.name || "Field Agent"}
                </div>
              </div>

              <span className="badge text-bg-light border font-monospace">
                {authenticatedAgentId || "Agent ID unavailable"}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white border rounded-4 p-3 mb-3 shadow-sm">
            <label
              htmlFor="agentIdFilterInput"
              className="form-label fw-semibold"
            >
              Agent ID Filter
            </label>

            <div className="input-group">
              <input
                id="agentIdFilterInput"
                className="form-control"
                value={agentIdInput}
                placeholder="Example: RPP-001 or DLA-001"
                disabled={Boolean(savingTaskId)}
                onChange={(event) => setAgentIdInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleAgentFilterApply();
                  }
                }}
              />

              <button
                type="button"
                className="btn btn-primary"
                disabled={Boolean(savingTaskId)}
                onClick={() => void handleAgentFilterApply()}
              >
                Apply
              </button>
            </div>

            <div className="form-text">
              Leave blank to show all tasks. Manual filtering is available only
              for non-field-agent roles.
            </div>
          </div>
        )}

        <AgentMobileSummaryCards summary={dashboardData.summary} />

        <AgentMobileTaskFilters filters={filters} onChange={setFilters} />

        {filteredTasks.length === 0 ? (
          <EmptyState
            title="No mobile tasks found"
            message="No assigned tasks match the selected filters."
            iconClassName="bi bi-phone text-primary"
          />
        ) : (
          <div className="row">
            <div className="col-12 col-xl-8 mx-auto">
              {filteredTasks.map((task) => (
                <AgentMobileTaskCard
                  key={task.id || task.taskId}
                  task={task}
                  disabled={Boolean(savingTaskId) && savingTaskId !== task.id}
                  onUpdateStatus={handleTaskUpdate}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default AgentMobileExperiencePage;