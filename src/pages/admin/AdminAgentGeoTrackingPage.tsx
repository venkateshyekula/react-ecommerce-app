import { useCallback, useEffect, useMemo, useState } from "react";
import AgentGeoTrackingSummaryCards from "../../components/admin/AgentGeoTrackingSummaryCards";
import AgentGeoTrackingTable from "../../components/admin/AgentGeoTrackingTable";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { agentGeoTrackingService } from "../../services/agentGeoTrackingService";
import type {
  AgentGeoRiskLevel,
  AgentGeoTaskType,
  AgentGeoTrackingDashboardData,
  AgentGeoTrackingFilters,
  AgentGeoTrackingStatus
} from "../../types/agentGeoTracking";

const defaultFilters: AgentGeoTrackingFilters = {
  searchText: "",
  taskType: "ALL",
  trackingStatus: "ALL",
  riskLevel: "ALL"
};

const taskTypeOptions: AgentGeoTaskType[] = [
  "RETURN_PICKUP",
  "DELIVERY",
  "PROOF_VERIFICATION",
  "SUPPORT_VISIT"
];

const trackingStatusOptions: AgentGeoTrackingStatus[] = [
  "LIVE",
  "STALE",
  "NO_LOCATION",
  "COMPLETED",
  "FAILED"
];

const riskOptions: AgentGeoRiskLevel[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL"
];

const formatLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const AdminAgentGeoTrackingPage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<AgentGeoTrackingDashboardData | null>(null);

  const [filters, setFilters] =
    useState<AgentGeoTrackingFilters>(defaultFilters);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(
    new Date().toISOString()
  );

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const data = await agentGeoTrackingService.getDashboardData();

      setDashboardData(data);
      setLastRefreshedAt(new Date().toISOString());
    } catch {
      showToast(
        "Geo tracking failed",
        "Unable to load agent geo tracking dashboard.",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const refreshDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsRefreshing(true);

      const data = await agentGeoTrackingService.getDashboardData();

      setDashboardData(data);
      setLastRefreshedAt(new Date().toISOString());

      showToast(
        "Geo tracking refreshed",
        "Latest agent tracking data loaded.",
        "success"
      );
    } catch {
      showToast(
        "Refresh failed",
        "Unable to refresh agent geo tracking dashboard.",
        "danger"
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredRows = useMemo(() => {
    const rows = dashboardData?.rows ?? [];
    const search = filters.searchText.trim().toLowerCase();

    return rows.filter((row) => {
      const searchableText = [
        row.taskId,
        row.assignmentId ?? "",
        row.agentId,
        row.agentName,
        row.agentPhone ?? "",
        row.returnRequestId ?? "",
        row.orderId ?? "",
        row.customerName ?? "",
        row.customerPhone ?? "",
        row.city ?? "",
        row.state ?? "",
        row.pincode ?? "",
        row.taskType,
        row.taskStatus,
        row.trackingStatus,
        row.riskLevel,
        (row.issueFlags ?? []).join(" "),
        (row.recommendedActions ?? []).join(" ")
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);

      const matchesType =
        filters.taskType === "ALL" || row.taskType === filters.taskType;

      const matchesTracking =
        filters.trackingStatus === "ALL" ||
        row.trackingStatus === filters.trackingStatus;

      const matchesRisk =
        filters.riskLevel === "ALL" || row.riskLevel === filters.riskLevel;

      return matchesSearch && matchesType && matchesTracking && matchesRisk;
    });
  }, [dashboardData, filters]);

  const handleClearFilters = (): void => {
    setFilters(defaultFilters);
  };

  if (isLoading) {
    return (
      <main className="admin-agent-geo-tracking-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading agent geo tracking dashboard..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-agent-geo-tracking-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Agent geo tracking unavailable"
            message="Agent geo tracking dashboard could not be loaded."
            iconClassName="bi bi-geo-alt text-primary"
          />
        </section>
      </main>
    );
  }

  return (
    <main className="admin-agent-geo-tracking-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <span className="badge rounded-pill text-bg-primary mb-2">
            Phase 12Y
          </span>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <h1 className="fw-bold mb-1">
                Customer Live Tracking + Agent Geo Tracking
              </h1>

              <p className="text-muted mb-0">
                Monitor pickup and delivery agent locations, stale tracking,
                task progress, customer tracking status, and geo-risk indicators.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={isRefreshing}
              onClick={() => void refreshDashboard()}
            >
              <i className="bi bi-arrow-clockwise me-2" />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <AgentGeoTrackingSummaryCards summary={dashboardData.summary} />

        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-4">
              <label className="form-label fw-semibold">Search</label>
              <input
                className="form-control"
                value={filters.searchText}
                placeholder="Search task, agent, customer, order, city, pincode..."
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    searchText: event.target.value
                  }))
                }
              />
            </div>

            <div className="col-md-6 col-lg-2">
              <label className="form-label fw-semibold">Task Type</label>
              <select
                className="form-select"
                value={filters.taskType}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    taskType: event.target
                      .value as AgentGeoTrackingFilters["taskType"]
                  }))
                }
              >
                <option value="ALL">All Types</option>
                {taskTypeOptions.map((taskType) => (
                  <option value={taskType} key={taskType}>
                    {formatLabel(taskType)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 col-lg-2">
              <label className="form-label fw-semibold">Tracking</label>
              <select
                className="form-select"
                value={filters.trackingStatus}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    trackingStatus: event.target
                      .value as AgentGeoTrackingFilters["trackingStatus"]
                  }))
                }
              >
                <option value="ALL">All Tracking</option>
                {trackingStatusOptions.map((status) => (
                  <option value={status} key={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 col-lg-2">
              <label className="form-label fw-semibold">Risk</label>
              <select
                className="form-select"
                value={filters.riskLevel}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    riskLevel: event.target
                      .value as AgentGeoTrackingFilters["riskLevel"]
                  }))
                }
              >
                <option value="ALL">All Risk</option>
                {riskOptions.map((risk) => (
                  <option value={risk} key={risk}>
                    {formatLabel(risk)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 col-lg-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                disabled={
                  !filters.searchText &&
                  filters.taskType === "ALL" &&
                  filters.trackingStatus === "ALL" &&
                  filters.riskLevel === "ALL"
                }
                onClick={handleClearFilters}
              >
                <i className="bi bi-x-circle me-2" />
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12 col-xl-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-2">Live Tracking Control</h5>

                <p className="small text-muted mb-3">
                  This dashboard uses latest latitude and longitude captured from
                  agent task updates and activity logs.
                </p>

                <div className="d-grid gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isRefreshing}
                    onClick={() => void refreshDashboard()}
                  >
                    <i className="bi bi-broadcast-pin me-2" />
                    Refresh Live Positions
                  </button>
                </div>

                <hr />

                <div className="small text-muted">
                  <div>
                    Total rows shown: <strong>{filteredRows.length}</strong>
                  </div>
                  <div>
                    Last refresh:{" "}
                    <strong>
                      {agentGeoTrackingService.formatDateTime(lastRefreshedAt)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-8">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-2">Tracking Status Overview</h5>

                <div className="row g-2">
                  <div className="col-6 col-md-3">
                    <div className="border rounded-4 p-3 bg-light h-100">
                      <span className="badge text-bg-success">Live</span>
                      <strong className="d-block fs-4 mt-2">
                        {dashboardData.summary.liveTrackingRows ?? 0}
                      </strong>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="border rounded-4 p-3 bg-light h-100">
                      <span className="badge text-bg-warning text-dark">
                        Stale
                      </span>
                      <strong className="d-block fs-4 mt-2">
                        {dashboardData.summary.staleTrackingRows ?? 0}
                      </strong>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="border rounded-4 p-3 bg-light h-100">
                      <span className="badge text-bg-secondary">
                        No Location
                      </span>
                      <strong className="d-block fs-4 mt-2">
                        {dashboardData.summary.noLocationRows ?? 0}
                      </strong>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="border rounded-4 p-3 bg-light h-100">
                      <span className="badge text-bg-danger">Critical</span>
                      <strong className="d-block fs-4 mt-2">
                        {dashboardData.summary.criticalRiskRows ?? 0}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="small text-muted mt-3">
                  Stale tracking is calculated from old or missing agent
                  location updates.
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <EmptyState
            title="No tracking rows found"
            message="No agent geo tracking rows match the selected filters."
            iconClassName="bi bi-geo-alt text-primary"
          />
        ) : (
          <AgentGeoTrackingTable rows={filteredRows} />
        )}
      </section>
    </main>
  );
};

export default AdminAgentGeoTrackingPage;