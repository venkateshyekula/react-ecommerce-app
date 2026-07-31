import { useCallback, useEffect, useMemo, useState } from "react";
import AgentSlaBreachTable from "../../components/admin/AgentSlaBreachTable";
import AgentSlaSummaryCards from "../../components/admin/AgentSlaSummaryCards";
import AgentWorkloadByAgentTable from "../../components/admin/AgentWorkloadByAgentTable";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { agentSlaDashboardService } from "../../services/agentSlaDashboardService";
import type {
  AgentSlaDashboardData,
  AgentSlaStatus,
} from "../../types/agentSla";
import type { AgentTaskType } from "../../types/agentAssignment";

type TaskFilter = "ALL" | AgentTaskType;
type SlaFilter = "ALL" | AgentSlaStatus;

const AdminAgentWorkloadDashboardPage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<AgentSlaDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL");
  const [slaFilter, setSlaFilter] = useState<SlaFilter>("ALL");

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const data = await agentSlaDashboardService.getDashboardData();

      setDashboardData(data);
    } catch {
      showToast(
        "Agent SLA dashboard failed",
        "Unable to load agent workload and SLA dashboard.",
        "danger",
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredTasks = useMemo(() => {
    const tasks = dashboardData?.taskRows ?? [];
    const normalizedSearch = searchText.trim().toLowerCase();

    return tasks.filter((task) => {
      const searchableText = [
        task.assignmentId ?? "",
        task.taskId ?? "",
        task.orderId ?? "",
        task.returnRequestId ?? "",
        task.customerName ?? "",
        task.agentId ?? "",
        task.agentName ?? "",
        task.pincode ?? "",
        task.city ?? "",
        task.status ?? "",
        task.slaStatus ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesTask = taskFilter === "ALL" || task.taskType === taskFilter;

      const matchesSla = slaFilter === "ALL" || task.slaStatus === slaFilter;

      return matchesSearch && matchesTask && matchesSla;
    });
  }, [dashboardData, searchText, taskFilter, slaFilter]);

  const visibleRiskTasks = useMemo(() => {
    return filteredTasks.filter((task) =>
      ["BREACHED", "AT_RISK", "ON_TRACK"].includes(task.slaStatus),
    );
  }, [filteredTasks]);

  const handleResetFilters = () => {
    setSearchText("");
    setTaskFilter("ALL");
    setSlaFilter("ALL");
  };

  const isFilterActive =
    Boolean(searchText.trim()) || taskFilter !== "ALL" || slaFilter !== "ALL";

  if (isLoading) {
    return (
      <main className="admin-agent-workload-dashboard-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading agent workload SLA dashboard..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-agent-workload-dashboard-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Dashboard unavailable"
            message="Agent workload dashboard could not be loaded."
            iconClassName="bi bi-speedometer2 text-primary"
          />
        </section>
      </main>
    );
  }

  return (
    <main className="admin-agent-workload-dashboard-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">Agent Workload + SLA Dashboard</h1>
              <p className="text-muted mb-0">
                Monitor agent workload, capacity, delayed tasks, SLA risk, and
                breached pickup or delivery tasks.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mb-1 align-self-lg-start"
              onClick={() => void loadDashboard()}
              title="Refresh Dashboard Data"
            >
              <i className="bi bi-arrow-clockwise me-1" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        {/* Metric Summary Cards */}
        <AgentSlaSummaryCards summary={dashboardData.summary} />

        {/* Agent Capacity & Workload Table */}
        <AgentWorkloadByAgentTable agents={dashboardData.agentRows} />

        {/* Task Search & Filtering Controls */}
        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-4">
              <label className="form-label fw-semibold">Search</label>
              <input
                className="form-control"
                value={searchText}
                placeholder="Search task, order, return, customer, agent, pincode..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold">Task Type</label>
              <select
                className="form-select"
                value={taskFilter}
                onChange={(event) =>
                  setTaskFilter(event.target.value as TaskFilter)
                }
              >
                <option value="ALL">All Tasks</option>
                <option value="RETURN_PICKUP">Return Pickup</option>
                <option value="ORDER_DELIVERY">Order Delivery</option>
              </select>
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold">SLA Status</label>
              <select
                className="form-select"
                value={slaFilter}
                onChange={(event) =>
                  setSlaFilter(event.target.value as SlaFilter)
                }
              >
                <option value="ALL">All Statuses</option>
                <option value="ON_TRACK">On Track</option>
                <option value="AT_RISK">At Risk</option>
                <option value="BREACHED">Breached</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="col-lg-2 d-flex justify-content-lg-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                disabled={!isFilterActive}
                onClick={handleResetFilters}
              >
                <i className="bi bi-x-circle me-1" />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* SLA Breach & Task Queue Table */}
        <AgentSlaBreachTable tasks={visibleRiskTasks} />
      </section>
    </main>
  );
};

export default AdminAgentWorkloadDashboardPage;