import { useCallback, useEffect, useMemo, useState } from "react";
import AgentPerformanceCharts from "../../components/admin/AgentPerformanceCharts";
import AgentPerformanceSummaryCards from "../../components/admin/AgentPerformanceSummaryCards";
import AgentPerformanceTable from "../../components/admin/AgentPerformanceTable";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { agentPerformanceReportService } from "../../services/agentPerformanceReportService";
import type {
  AgentPerformanceReportData,
  AgentPerformanceRiskLevel,
  AgentPerformanceRow,
} from "../../types/agentPerformance";
import type { AgentType } from "../../types/agentAssignment";

type AgentTypeFilter = "ALL" | AgentType | "UNKNOWN";
type RiskFilter = "ALL" | AgentPerformanceRiskLevel;

const csvHeaders = [
  "Agent ID",
  "Agent Name",
  "Agent Type",
  "Phone",
  "City",
  "Total Tasks",
  "Pickup Tasks",
  "Delivery Tasks",
  "Completed Tasks",
  "Completed Pickups",
  "Completed Deliveries",
  "Attempted Tasks",
  "Failed Tasks",
  "Cancelled Tasks",
  "Avg Speed (Hours)",
  "Total Proofs",
  "Pending Proofs",
  "Verified Proofs",
  "Rejected Proofs",
  "Completion Rate",
  "Proof Verification Rate",
  "Failure Rate",
  "Performance Score",
  "Risk Level",
];

const escapeCsvValue = (value: string | number | undefined): string => {
  const safeValue = value ?? "";
  const stringValue = String(safeValue);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

const buildCsv = (rows: AgentPerformanceRow[]): string => {
  const csvRows = rows.map((row) =>
    [
      row.agentId,
      row.agentName,
      row.agentType,
      row.agentPhone,
      row.city,
      row.totalTasks,
      row.pickupTasks,
      row.deliveryTasks,
      row.completedTasks,
      row.pickupCompleted,
      row.deliveriesCompleted,
      row.attemptedTasks,
      row.failedTasks,
      row.cancelledTasks,
      row.averageCompletionHours,
      row.totalProofs,
      row.pendingProofs,
      row.verifiedProofs,
      row.rejectedProofs,
      `${row.completionRate}%`,
      `${row.proofVerificationRate}%`,
      `${row.failureRate}%`,
      row.performanceScore,
      row.riskLevel,
    ]
      .map(escapeCsvValue)
      .join(","),
  );

  return [csvHeaders.map(escapeCsvValue).join(","), ...csvRows].join("\n");
};

const AdminAgentPerformanceReportPage = () => {
  const { showToast } = useToast();

  const [reportData, setReportData] =
    useState<AgentPerformanceReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [agentTypeFilter, setAgentTypeFilter] =
    useState<AgentTypeFilter>("ALL");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const data = await agentPerformanceReportService.getReportData();

      setReportData(data);
    } catch {
      showToast(
        "Agent performance report failed",
        "Unable to load agent performance report.",
        "danger",
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredRows = useMemo(() => {
    const rows = reportData?.agents ?? [];
    const normalizedSearch = searchText.trim().toLowerCase();

    return rows.filter((row) => {
      const searchableText = [
        row.agentId,
        row.agentName,
        row.agentPhone ?? "",
        row.agentType,
        row.city ?? "",
        row.riskLevel,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesType =
        agentTypeFilter === "ALL" || row.agentType === agentTypeFilter;

      const matchesRisk = riskFilter === "ALL" || row.riskLevel === riskFilter;

      return matchesSearch && matchesType && matchesRisk;
    });
  }, [reportData, searchText, agentTypeFilter, riskFilter]);

  const handleExportCsv = (): void => {
    if (filteredRows.length === 0) {
      showToast(
        "No data to export",
        "There are no filtered agent performance records to export.",
        "warning",
      );
      return;
    }

    const csvContent = buildCsv(filteredRows);
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateKey = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `agent-performance-report-${dateKey}.csv`;
    link.click();

    URL.revokeObjectURL(url);

    showToast(
      "CSV exported",
      `${filteredRows.length} agent performance records exported.`,
      "success",
    );
  };

  if (isLoading) {
    return (
      <main className="admin-agent-performance-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading agent performance report..." />
        </div>
      </main>
    );
  }

  if (!reportData) {
    return (
      <main className="admin-agent-performance-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Performance report unavailable"
            message="Agent performance report data could not be loaded."
            iconClassName="bi bi-bar-chart-line text-primary"
          />
        </section>
      </main>
    );
  }

  return (
    <main className="admin-agent-performance-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Agent Performance Report</h1>
              <p className="text-muted mb-0">
                Track pickup and delivery agent completion rate, turnaround
                time, failed attempts, proof verification, and performance
                score.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm align-self-lg-start support-agent-header-btn"
              onClick={() => void loadDashboard()}
            >
              <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <AgentPerformanceSummaryCards summary={reportData.summary} />

        <AgentPerformanceCharts rows={filteredRows} />

        <div className="bg-white border rounded-3 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-5">
              <label className="form-label fw-semibold">Search</label>
              <input
                className="form-control"
                value={searchText}
                placeholder="Search agent name, ID, phone, city..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold">Agent Type</label>
              <select
                className="form-select"
                value={agentTypeFilter}
                onChange={(event) =>
                  setAgentTypeFilter(event.target.value as AgentTypeFilter)
                }
              >
                <option value="ALL">All</option>
                <option value="PICKUP_AGENT">Pickup Agent</option>
                <option value="DELIVERY_AGENT">Delivery Agent</option>
                <option value="LOGISTICS_AGENT">Logistics Agent</option>
                <option value="BOTH">Both</option>
              </select>
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold">Risk Level</label>
              <select
                className="form-select"
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(event.target.value as RiskFilter)
                }
              >
                <option value="ALL">All</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="AVERAGE">Average</option>
                <option value="POOR">Poor</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="col-lg-1 d-flex justify-content-lg-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={
                  !searchText &&
                  agentTypeFilter === "ALL" &&
                  riskFilter === "ALL"
                }
                onClick={() => {
                  setSearchText("");
                  setAgentTypeFilter("ALL");
                  setRiskFilter("ALL");
                }}
                title="Clear Filters"
              >
                <i className="bi bi-x-circle" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <AgentPerformanceTable
          rows={filteredRows}
          onExportCsv={handleExportCsv}
        />
      </section>
    </main>
  );
};

export default AdminAgentPerformanceReportPage;