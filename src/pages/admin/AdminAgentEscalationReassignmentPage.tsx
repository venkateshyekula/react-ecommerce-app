import { useCallback, useEffect, useMemo, useState } from "react";
import AgentEscalationCharts from "../../components/admin/AgentEscalationCharts";
import AgentEscalationSummaryCards from "../../components/admin/AgentEscalationSummaryCards";
import AgentEscalationTable from "../../components/admin/AgentEscalationTable";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { agentEscalationReassignmentService } from "../../services/agentEscalationReassignmentService";
import type {
  AgentEscalationAction,
  AgentEscalationDashboardData,
  AgentEscalationRiskLevel,
  AgentEscalationSource,
  AgentEscalationStatus,
  AgentEscalationWorkflowRow
} from "../../types/agentEscalationReassignment";

type SourceFilter = "ALL" | AgentEscalationSource;
type StatusFilter = "ALL" | AgentEscalationStatus;
type RiskFilter = "ALL" | AgentEscalationRiskLevel;

const sourceOptions: AgentEscalationSource[] = [
  "RETURN_PICKUP",
  "DELIVERY",
  "PROOF_VERIFICATION",
  "SLA_BREACH",
  "SUPPORT_ESCALATION",
  "MANUAL_ADMIN_REVIEW"
];

const statusOptions: AgentEscalationStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "REASSIGNED",
  "ESCALATED",
  "RESOLVED",
  "CANCELLED"
];

const riskOptions: AgentEscalationRiskLevel[] = [
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

const AdminAgentEscalationReassignmentPage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<AgentEscalationDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [searchText, setSearchText] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const data =
        await agentEscalationReassignmentService.getDashboardData();
      setDashboardData(data);
    } catch {
      showToast(
        "Agent escalation failed",
        "Unable to load agent escalation dashboard.",
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
      const matchesSource =
        sourceFilter === "ALL" || row.source === sourceFilter;
      const matchesStatus =
        statusFilter === "ALL" || row.status === statusFilter;
      const matchesRisk =
        riskFilter === "ALL" || row.riskLevel === riskFilter;

      if (!matchesSource || !matchesStatus || !matchesRisk) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        row.escalationId,
        row.taskId,
        row.assignmentId,
        row.returnRequestId,
        row.orderId,
        row.currentAgentId,
        row.currentAgentName,
        row.suggestedAgentId,
        row.suggestedAgentName,
        row.customerName,
        row.customerPhone,
        row.city,
        row.pincode,
        row.issueTitle,
        row.issueDetails,
        row.source,
        row.status,
        row.riskLevel,
        row.reassignmentReasons?.join(" "),
        row.recommendedActions?.join(" ")
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [dashboardData, searchText, sourceFilter, statusFilter, riskFilter]);

  const handleAction = async (
    row: AgentEscalationWorkflowRow,
    action: AgentEscalationAction,
    newAgentId?: string
  ): Promise<void> => {
    if (isSaving) return;

    if (action === "REASSIGN_AGENT" && !newAgentId) {
      showToast(
        "Reassignment failed",
        "Please select an available agent before reassignment.",
        "warning"
      );
      return;
    }

    try {
      setIsSaving(true);

      await agentEscalationReassignmentService.createEscalationAction({
        row,
        action,
        newAgentId,
        reason: `${formatLabel(action)} completed for ${row.issueTitle}.`
      });

      await loadDashboard();

      showToast(
        "Agent workflow updated",
        `${formatLabel(action)} completed successfully.`,
        "success"
      );
    } catch {
      showToast(
        "Agent workflow failed",
        "Unable to complete agent escalation action.",
        "danger"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const hasActiveFilters =
    Boolean(searchText) ||
    sourceFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    riskFilter !== "ALL";

  if (isLoading) {
    return (
      <main className="admin-agent-escalation-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading agent escalation workflow..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-agent-escalation-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Agent escalation dashboard unavailable"
            message="Advanced agent escalation workflow could not be loaded."
            iconClassName="bi bi-diagram-3 text-primary"
          />
        </section>
      </main>
    );
  }

  const totalRowCount = dashboardData.rows?.length ?? 0;

  return (
    <main className="admin-agent-escalation-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <span className="badge rounded-pill text-bg-primary mb-2">
            Phase 12V
          </span>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <h1 className="fw-bold mb-1 fs-3">
              Advanced Agent Escalation + Reassignment Workflow
            </h1>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={isSaving || isLoading}
              onClick={() => void loadDashboard()}
            >
              <i
                className={`bi bi-arrow-clockwise me-2 ${
                  isSaving ? "spin" : ""
                }`}
                aria-hidden="true"
              />
              Refresh Dashboard
            </button>
          </div>

          <p className="text-muted mb-0 small">
            Escalate delayed agent tasks, reassign unavailable or overloaded
            agents, resolve breached workflows, and monitor reassignment
            recommendations.
          </p>
        </div>
      </section>

      <section className="container-fluid py-4">
        <AgentEscalationSummaryCards summary={dashboardData.summary} />

        <AgentEscalationCharts summary={dashboardData.summary} />

        {/* Filter Toolbar */}
        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">Filter Escalation Queue</h6>
            <span className="badge text-bg-light border text-muted">
              Showing {filteredRows.length} of {totalRowCount} rows
            </span>
          </div>

          <div className="row g-3 align-items-end">
            <div className="col-lg-4">
              <label htmlFor="filter-search" className="form-label fw-semibold small">
                Search
              </label>
              <input
                id="filter-search"
                className="form-control"
                value={searchText}
                placeholder="Search task, return, agent, customer, reason..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-md-6 col-lg-2">
              <label htmlFor="filter-source" className="form-label fw-semibold small">
                Source
              </label>
              <select
                id="filter-source"
                className="form-select"
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(event.target.value as SourceFilter)
                }
              >
                <option value="ALL">All Sources</option>
                {sourceOptions.map((source) => (
                  <option value={source} key={source}>
                    {formatLabel(source)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 col-lg-2">
              <label htmlFor="filter-status" className="form-label fw-semibold small">
                Status
              </label>
              <select
                id="filter-status"
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
              <label htmlFor="filter-risk" className="form-label fw-semibold small">
                Risk Level
              </label>
              <select
                id="filter-risk"
                className="form-select"
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(event.target.value as RiskFilter)
                }
              >
                <option value="ALL">All Risk Levels</option>
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
                disabled={!hasActiveFilters}
                onClick={() => {
                  setSearchText("");
                  setSourceFilter("ALL");
                  setStatusFilter("ALL");
                  setRiskFilter("ALL");
                }}
              >
                <i className="bi bi-x-circle me-2" aria-hidden="true" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <AgentEscalationTable
          rows={filteredRows}
          agents={dashboardData.agents}
          onAction={(row, action, newAgentId) =>
            void handleAction(row, action, newAgentId)
          }
        />
      </section>
    </main>
  );
};

export default AdminAgentEscalationReassignmentPage;