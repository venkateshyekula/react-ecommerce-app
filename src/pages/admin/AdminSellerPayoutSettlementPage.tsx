import { useCallback, useEffect, useMemo, useState } from "react";
import SellerPayoutSettlementCharts from "../../components/admin/SellerPayoutSettlementCharts";
import SellerPayoutSettlementSummaryCards from "../../components/admin/SellerPayoutSettlementSummaryCards";
import SellerPayoutSettlementTable from "../../components/admin/SellerPayoutSettlementTable";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { sellerPayoutSettlementService } from "../../services/sellerPayoutSettlementService";
import type {
  SellerPayoutRiskLevel,
  SellerPayoutSettlementAction,
  SellerPayoutSettlementDashboardData,
  SellerPayoutSettlementRow,
  SellerPayoutSettlementStatus
} from "../../types/sellerPayoutSettlement";

type RiskFilter = "ALL" | SellerPayoutRiskLevel;
type SettlementStatusFilter = "ALL" | SellerPayoutSettlementStatus;

const AdminSellerPayoutSettlementPage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<SellerPayoutSettlementDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchText, setSearchText] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [settlementStatusFilter, setSettlementStatusFilter] =
    useState<SettlementStatusFilter>("ALL");

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const data = await sellerPayoutSettlementService.getDashboardData();

      setDashboardData(data);
    } catch {
      showToast(
        "Seller payout settlement failed",
        "Unable to load seller payout settlement dashboard.",
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
      const searchableText = [
        row.sellerId,
        row.sellerName,
        row.sellerEmail ?? "",
        row.sellerPhone ?? "",
        row.storeName ?? "",
        row.adjustmentType,
        row.settlementStatus,
        row.riskLevel,
        row.settlementReasons.join(" "),
        row.recommendedActions.join(" ")
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesRisk =
        riskFilter === "ALL" || row.riskLevel === riskFilter;

      const matchesStatus =
        settlementStatusFilter === "ALL" ||
        row.settlementStatus === settlementStatusFilter;

      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [dashboardData, searchText, riskFilter, settlementStatusFilter]);

  const handleSettlementAction = async (
    row: SellerPayoutSettlementRow,
    action: SellerPayoutSettlementAction
  ): Promise<void> => {
    try {
      await sellerPayoutSettlementService.createAdjustmentRecord({
        sellerId: row.sellerId,
        sellerName: row.sellerName,
        action,
        reason: `${action.replace(/_/g, " ")} performed by Admin.`,
        payoutBaseAmount: row.payoutBaseAmount,
        payoutHoldAmount:
          action === "HOLD_PAYOUT" ? row.payoutBaseAmount : row.payoutHoldAmount,
        payoutDeductionAmount: row.payoutDeductionAmount,
        payoutCreditAmount: row.payoutCreditAmount,
        finalPayableAmount:
          action === "HOLD_PAYOUT" ? 0 : row.finalPayableAmount
      });

      await loadDashboard();

      showToast(
        "Settlement updated",
        `${row.sellerName} settlement action completed.`,
        "success"
      );
    } catch {
      showToast(
        "Settlement action failed",
        "Unable to update settlement action.",
        "danger"
      );
    }
  };

  const hasActiveFilters =
    Boolean(searchText) ||
    riskFilter !== "ALL" ||
    settlementStatusFilter !== "ALL";

  if (isLoading) {
    return (
      <main className="admin-seller-payout-settlement-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading seller payout settlement dashboard..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-seller-payout-settlement-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Seller payout settlement unavailable"
            message="Seller payout settlement dashboard could not be loaded."
            iconClassName="bi bi-wallet2 text-primary"
          />
        </section>
      </main>
    );
  }

  return (
    <main className="admin-seller-payout-settlement-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div>
            <span className="badge rounded-pill text-bg-primary mb-2">
              Phase 12R
            </span>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <h1 className="fw-bold mb-1">
                Seller Payout Adjustment + Liability Settlement
              </h1>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm mb-1"
                onClick={() => void loadDashboard()}
              >
                <i className="bi bi-arrow-clockwise me-2" />
                Refresh
              </button>
            </div>

            <p className="text-muted mb-0">
              Adjust seller payouts using return outcomes, dispute decisions,
              damaged inventory value, refund liability, and seller risk score.
            </p>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <SellerPayoutSettlementSummaryCards summary={dashboardData.summary} />

        <SellerPayoutSettlementCharts summary={dashboardData.summary} />

        {/* Filters Toolbar */}
        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-5">
              <label htmlFor="seller-search-input" className="form-label fw-semibold">
                Search
              </label>
              <input
                id="seller-search-input"
                className="form-control"
                value={searchText}
                placeholder="Search seller, status, risk, settlement reason..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-md-6 col-lg-3">
              <label htmlFor="risk-level-select" className="form-label fw-semibold">
                Risk Level
              </label>
              <select
                id="risk-level-select"
                className="form-select"
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(event.target.value as RiskFilter)
                }
              >
                <option value="ALL">All Risk Levels</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="col-md-6 col-lg-3">
              <label htmlFor="settlement-status-select" className="form-label fw-semibold">
                Settlement Status
              </label>
              <select
                id="settlement-status-select"
                className="form-select"
                value={settlementStatusFilter}
                onChange={(event) =>
                  setSettlementStatusFilter(
                    event.target.value as SettlementStatusFilter
                  )
                }
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="SETTLED">Settled</option>
                <option value="REJECTED">Rejected</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>

            <div className="col-lg-1 d-flex justify-content-lg-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                aria-label="Clear filters"
                title="Reset all filters"
                disabled={!hasActiveFilters}
                onClick={() => {
                  setSearchText("");
                  setRiskFilter("ALL");
                  setSettlementStatusFilter("ALL");
                }}
              >
                <i className="bi bi-x-circle" />
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <SellerPayoutSettlementTable
          rows={filteredRows}
          onSettlementAction={(row, action) =>
            void handleSettlementAction(row, action)
          }
        />
      </section>
    </main>
  );
};

export default AdminSellerPayoutSettlementPage;