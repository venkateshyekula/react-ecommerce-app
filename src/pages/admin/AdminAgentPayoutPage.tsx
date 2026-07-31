import { useCallback, useEffect, useMemo, useState } from "react";
import AgentPayoutSummaryCards from "../../components/admin/AgentPayoutSummaryCards";
import AgentPayoutTable from "../../components/admin/AgentPayoutTable";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { agentPayoutService } from "../../services/agentPayoutService";
import type {
  AgentPayoutDashboardData,
  AgentPayoutRiskLevel,
  AgentPayoutRow,
} from "../../types/agentPayout";
import type { AgentType } from "../../types/agentAssignment";

type AgentTypeFilter = "ALL" | AgentType | "UNKNOWN";
type RiskFilter = "ALL" | AgentPayoutRiskLevel;

const AdminAgentPayoutPage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<AgentPayoutDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savingAgentId, setSavingAgentId] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [agentTypeFilter, setAgentTypeFilter] =
    useState<AgentTypeFilter>("ALL");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const data = await agentPayoutService.getDashboardData();

      setDashboardData(data);
    } catch {
      showToast(
        "Agent payout dashboard failed",
        "Unable to load agent payout and incentive calculation.",
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
    const rows = dashboardData?.rows ?? [];
    const normalizedSearch = searchText.trim().toLowerCase();

    return rows.filter((row) => {
      const searchableText = [
        row.agentId,
        row.agentName,
        row.agentPhone ?? "",
        row.agentEmail ?? "",
        row.agentType,
        row.riskLevel,
        row.payoutStatus,
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
  }, [dashboardData, searchText, agentTypeFilter, riskFilter]);

  const handleGeneratePayout = async (row: AgentPayoutRow): Promise<void> => {
    try {
      setSavingAgentId(row.agentId);

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const payout = await agentPayoutService.createPayoutRecord({
        row,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        remarks: "Generated from Phase 12O.9 agent payout dashboard.",
      });

      showToast(
        "Payout generated",
        `Payout ${payout.payoutId} generated for ${row.agentName}.`,
        "success",
      );
    } catch {
      showToast(
        "Payout generation failed",
        "Unable to generate payout record for selected agent.",
        "danger",
      );
    } finally {
      setSavingAgentId("");
    }
  };

  const hasActiveFilters =
    Boolean(searchText.trim()) ||
    agentTypeFilter !== "ALL" ||
    riskFilter !== "ALL";

  if (isLoading) {
    return (
      <main className="admin-agent-payout-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading agent payout dashboard..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-agent-payout-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Payout dashboard unavailable"
            message="Agent payout dashboard data could not be loaded."
            iconClassName="bi bi-wallet2 text-primary"
          />
        </section>
      </main>
    );
  }

  return (
    <main className="admin-agent-payout-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1 fs-3">
                Agent Payout + Incentive Calculation
              </h1>
              <p className="text-muted mb-0">
                Calculate payout for pickup, delivery, and logistics agents
                based on completed tasks, SLA bonus, proof verification, and
                penalties.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mb-1 align-self-lg-start"
              onClick={() => void loadDashboard()}
            >
              <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <div className="alert alert-light border small shadow-sm mb-4">
          <strong>Active Incentive Rule:</strong>{" "}
          {dashboardData.activeRule.name} · Pickup{" "}
          {agentPayoutService.formatCurrency(
            dashboardData.activeRule.pickupCompletionAmount,
          )}{" "}
          · Delivery{" "}
          {agentPayoutService.formatCurrency(
            dashboardData.activeRule.deliveryCompletionAmount,
          )}{" "}
          · SLA Bonus{" "}
          {agentPayoutService.formatCurrency(
            dashboardData.activeRule.slaBonusAmount,
          )}{" "}
          · Proof Bonus{" "}
          {agentPayoutService.formatCurrency(
            dashboardData.activeRule.proofVerifiedBonusAmount,
          )}{" "}
          · Rejection Penalty{" "}
          {agentPayoutService.formatCurrency(
            dashboardData.activeRule.proofRejectedPenaltyAmount,
          )}
        </div>

        <AgentPayoutSummaryCards summary={dashboardData.summary} />

        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-5">
              <label
                htmlFor="payout-search-input"
                className="form-label fw-semibold"
              >
                Search
              </label>
              <input
                id="payout-search-input"
                className="form-control"
                value={searchText}
                placeholder="Search agent name, ID, phone, email..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-md-6 col-lg-3">
              <label
                htmlFor="agent-type-filter"
                className="form-label fw-semibold"
              >
                Agent Type
              </label>
              <select
                id="agent-type-filter"
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
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>

            <div className="col-md-6 col-lg-3">
              <label
                htmlFor="risk-level-filter"
                className="form-label fw-semibold"
              >
                Risk Level
              </label>
              <select
                id="risk-level-filter"
                className="form-select"
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(event.target.value as RiskFilter)
                }
              >
                <option value="ALL">All</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="col-lg-1 d-flex justify-content-lg-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100 w-lg-auto"
                aria-label="Reset filters"
                disabled={!hasActiveFilters}
                onClick={() => {
                  setSearchText("");
                  setAgentTypeFilter("ALL");
                  setRiskFilter("ALL");
                }}
              >
                <i className="bi bi-x-circle" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <AgentPayoutTable
          rows={filteredRows}
          isSavingAgentId={savingAgentId}
          onGeneratePayout={handleGeneratePayout}
        />
      </section>
    </main>
  );
};

export default AdminAgentPayoutPage;
