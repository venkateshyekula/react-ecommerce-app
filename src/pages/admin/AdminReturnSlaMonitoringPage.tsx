import { useCallback, useEffect, useMemo, useState } from "react";
import ReturnSlaMonitoringCharts from "../../components/admin/ReturnSlaMonitoringCharts";
import ReturnSlaMonitoringTable from "../../components/admin/ReturnSlaMonitoringTable";
import ReturnSlaSummaryCards from "../../components/admin/ReturnSlaSummaryCards";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { returnSlaMonitoringService } from "../../services/returnSlaMonitoringService";
import type {
  ReturnSlaEscalationAction,
  ReturnSlaMonitoringDashboardData,
  ReturnSlaMonitoringRow,
  ReturnSlaRiskLevel,
  ReturnSlaStage,
  ReturnSlaStatus
} from "../../types/returnSlaMonitoring";

type StageFilter = "ALL" | ReturnSlaStage;
type StatusFilter = "ALL" | ReturnSlaStatus;
type RiskFilter = "ALL" | ReturnSlaRiskLevel;

const stageOptions: ReturnSlaStage[] = [
  "RETURN_REQUEST",
  "PICKUP",
  "QC",
  "REFUND",
  "SELLER_DISPUTE",
  "SUPPORT_ESCALATION"
];

const statusOptions: ReturnSlaStatus[] = [
  "WITHIN_SLA",
  "WARNING",
  "BREACHED",
  "ESCALATED",
  "COMPLETED"
];

const riskOptions: ReturnSlaRiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const formatLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const AdminReturnSlaMonitoringPage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<ReturnSlaMonitoringDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [searchText, setSearchText] = useState<string>("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const data = await returnSlaMonitoringService.getDashboardData();
      setDashboardData(data);
    } catch {
      showToast(
        "SLA dashboard failed",
        "Unable to load return SLA monitoring dashboard.",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredRows = useMemo(() => {
    const rows = dashboardData?.rows ?? [];
    const normalizedSearch = searchText.trim().toLowerCase();

    return rows.filter((row) => {
      // 1. Filter by Stage
      if (stageFilter !== "ALL" && row.stage !== stageFilter) {
        return false;
      }

      // 2. Filter by Status
      if (statusFilter !== "ALL" && row.status !== statusFilter) {
        return false;
      }

      // 3. Filter by Risk
      if (riskFilter !== "ALL" && row.riskLevel !== riskFilter) {
        return false;
      }

      // 4. Search Filter (Exit early if no search query provided)
      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        row.returnRequestId,
        row.orderId ?? "",
        row.customerId ?? "",
        row.customerName ?? "",
        row.customerEmail ?? "",
        row.sellerId ?? "",
        row.sellerName ?? "",
        row.stage,
        row.stageLabel,
        row.status,
        row.riskLevel,
        row.escalationStatus ?? "",
        row.assignedTeam ?? "",
        ...row.slaReasons,
        ...row.recommendedActions
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [dashboardData, searchText, stageFilter, statusFilter, riskFilter]);

  const handleEscalation = async (
    row: ReturnSlaMonitoringRow,
    action: ReturnSlaEscalationAction
  ): Promise<void> => {
    try {
      setIsSaving(true);

      await returnSlaMonitoringService.createEscalation({
        row,
        action,
        reason: `${formatLabel(action)} for ${row.stageLabel}.`
      });

      await loadDashboard();

      showToast(
        "SLA escalation updated",
        `${row.returnRequestId} escalation action completed.`,
        "success"
      );
    } catch {
      showToast(
        "Escalation failed",
        "Unable to create SLA escalation.",
        "danger"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isFilterActive =
    Boolean(searchText.trim()) ||
    stageFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    riskFilter !== "ALL";

  if (isLoading) {
    return (
      <main className="admin-return-sla-monitoring-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading return SLA monitoring dashboard..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-return-sla-monitoring-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Return SLA monitoring unavailable"
            message="Return SLA monitoring dashboard could not be loaded."
            iconClassName="bi bi-clock-history text-primary"
          />
        </section>
      </main>
    );
  }

  return (
    <main className="admin-return-sla-monitoring-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div>
            <span className="badge rounded-pill text-bg-primary mb-2">
              Phase 12T
            </span>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <h1 className="fw-bold mb-1">
                Return SLA Monitoring + Escalation Workflow
              </h1>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm mb-1"
                disabled={isLoading || isSaving}
                onClick={() => void loadDashboard()}
              >
                <i className={`bi bi-arrow-clockwise me-2 ${isLoading ? "spin" : ""}`} />
                Refresh
              </button>
            </div>

            <p className="text-muted mb-0">
              Track SLA status across return request review, pickup, QC, refund,
              seller dispute review, and support escalation workflows.
            </p>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        {/* Global Operational Cards */}
        <ReturnSlaSummaryCards summary={dashboardData.summary} />

        {/* Global Operational Charts */}
        <ReturnSlaMonitoringCharts summary={dashboardData.summary} />

        {/* Filter Toolbar */}
        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-4">
              <label className="form-label fw-semibold">Search</label>
              <input
                className="form-control"
                value={searchText}
                placeholder="Search return, customer, seller, SLA reason..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-md-6 col-lg-2">
              <label className="form-label fw-semibold">Stage</label>
              <select
                className="form-select"
                value={stageFilter}
                onChange={(event) =>
                  setStageFilter(event.target.value as StageFilter)
                }
              >
                <option value="ALL">All Stages</option>
                {stageOptions.map((stage) => (
                  <option value={stage} key={stage}>
                    {formatLabel(stage)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 col-lg-2">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
              >
                <option value="ALL">All Statuses</option>
                {statusOptions.map((status) => (
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
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(event.target.value as RiskFilter)
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

            <div className="col-md-6 col-lg-2 d-flex justify-content-lg-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                disabled={!isFilterActive}
                onClick={() => {
                  setSearchText("");
                  setStageFilter("ALL");
                  setStatusFilter("ALL");
                  setRiskFilter("ALL");
                }}
              >
                <i className="bi bi-x-circle me-2" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Paginated Data Table */}
        <ReturnSlaMonitoringTable
          rows={filteredRows}
          onEscalate={(row, action) => void handleEscalation(row, action)}
        />
      </section>
    </main>
  );
};

export default AdminReturnSlaMonitoringPage;