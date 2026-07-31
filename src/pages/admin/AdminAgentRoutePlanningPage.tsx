import { useCallback, useEffect, useMemo, useState } from "react";
import AgentRouteClusterCard from "../../components/admin/AgentRouteClusterCard";
import AgentRoutePlanningSummaryCards from "../../components/admin/AgentRoutePlanningSummaryCards";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { agentRoutePlanningService } from "../../services/agentRoutePlanningService";
import type { AgentRoutePlanningDashboardData } from "../../types/agentRoutePlanning";
import type { AgentTaskType } from "../../types/agentAssignment";

type TaskTypeFilter = "ALL" | AgentTaskType | "MIXED";
type AssignmentFilter = "ALL" | "UNASSIGNED" | "ASSIGNED";

const AdminAgentRoutePlanningPage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<AgentRoutePlanningDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskTypeFilter>("ALL");
  const [assignmentFilter, setAssignmentFilter] =
    useState<AssignmentFilter>("ALL");

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const data = await agentRoutePlanningService.getDashboardData();

      setDashboardData(data);
    } catch {
      showToast(
        "Route planning dashboard failed",
        "Unable to load agent route planning data.",
        "danger",
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredClusters = useMemo(() => {
    const clusters = dashboardData?.clusters ?? [];
    const normalizedSearch = searchText.trim().toLowerCase();

    return clusters.filter((cluster) => {
      const searchableText = [
        cluster.clusterId,
        cluster.pincode,
        cluster.city ?? "",
        cluster.taskType,
        ...(cluster.tasks ?? []).flatMap((task) => [
          task.taskId ?? "",
          task.customerName ?? "",
          task.address ?? "",
          task.agentName ?? "",
          task.agentId ?? "",
          task.status ?? "",
        ]),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesTaskType =
        taskTypeFilter === "ALL" || cluster.taskType === taskTypeFilter;

      const matchesAssignment =
        assignmentFilter === "ALL" ||
        (assignmentFilter === "UNASSIGNED" && cluster.unassignedTasks > 0) ||
        (assignmentFilter === "ASSIGNED" && cluster.assignedTasks > 0);

      return matchesSearch && matchesTaskType && matchesAssignment;
    });
  }, [dashboardData, searchText, taskTypeFilter, assignmentFilter]);

  if (isLoading) {
    return (
      <main className="admin-agent-route-planning-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading route planning dashboard..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-agent-route-planning-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Route planning unavailable"
            message="Agent route planning data could not be loaded."
            iconClassName="bi bi-diagram-3 text-primary"
          />
        </section>
      </main>
    );
  }

  const isFilterActive =
    Boolean(searchText) ||
    taskTypeFilter !== "ALL" ||
    assignmentFilter !== "ALL";

  return (
    <main className="admin-agent-route-planning-page bg-light min-vh-100">
      {/* Header Section */}
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
            <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                <div>
            <h1 className="fw-bold mb-1">
              Agent Route Planning + Pincode Clustering
            </h1>
            <p className="text-muted mb-0">
              Group pickup and delivery tasks by pincode, identify nearby tasks,
              and suggest best-fit agents based on capacity and service area.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm mb-1 support-agent-header-btn align-self-lg-start"
            onClick={() => void loadDashboard()}
          >
            <i className="bi bi-arrow-clockwise me-2" />
            Refresh
          </button>
                
            </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container-fluid py-4">
        <AgentRoutePlanningSummaryCards summary={dashboardData.summary} />

        {/* Filters Bar */}
        <div className="bg-white border rounded-3 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-lg-5">
              <label className="form-label fw-semibold">Search</label>
              <input
                className="form-control"
                value={searchText}
                placeholder="Search pincode, city, task, customer, agent..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-12 col-md-5 col-lg-3">
              <label className="form-label fw-semibold">Task Type</label>
              <select
                className="form-select"
                value={taskTypeFilter}
                onChange={(event) =>
                  setTaskTypeFilter(event.target.value as TaskTypeFilter)
                }
              >
                <option value="ALL">All Types</option>
                <option value="RETURN_PICKUP">Return Pickup</option>
                <option value="ORDER_DELIVERY">Order Delivery</option>
                <option value="MIXED">Mixed</option>
              </select>
            </div>

            <div className="col-12 col-md-5 col-lg-3">
              <label className="form-label fw-semibold">Assignment</label>
              <select
                className="form-select"
                value={assignmentFilter}
                onChange={(event) =>
                  setAssignmentFilter(event.target.value as AssignmentFilter)
                }
              >
                <option value="ALL">All Tasks</option>
                <option value="UNASSIGNED">Has Unassigned Tasks</option>
                <option value="ASSIGNED">Has Assigned Tasks</option>
              </select>
            </div>

            <div className="col-12 col-md-2 col-lg-1 d-flex justify-content-md-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                disabled={!isFilterActive}
                title="Reset Filters"
                aria-label="Reset Filters"
                onClick={() => {
                  setSearchText("");
                  setTaskTypeFilter("ALL");
                  setAssignmentFilter("ALL");
                }}
              >
                <i className="bi bi-x-circle" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Clusters List */}
        {filteredClusters.length === 0 ? (
          <EmptyState
            title="No route clusters found"
            message="No pickup or delivery clusters match the selected filters."
            iconClassName="bi bi-diagram-3 text-primary"
          />
        ) : (
          <div className="row g-3">
            {filteredClusters.map((cluster) => (
              <div className="col-12 col-xl-6" key={cluster.clusterId}>
                <AgentRouteClusterCard cluster={cluster} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminAgentRoutePlanningPage;