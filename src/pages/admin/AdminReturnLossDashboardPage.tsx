import { useCallback, useEffect, useMemo, useState } from "react";
import AdminReturnLossBreakdownCards from "../../components/admin/AdminReturnLossBreakdownCards";
import AdminReturnLossSummaryCards from "../../components/admin/AdminReturnLossSummaryCards";
import AdminSellerLiabilityTable from "../../components/admin/AdminSellerLiabilityTable";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { returnLossDashboardService } from "../../services/returnLossDashboardService";
import type {
  ReturnLossDashboardData,
  ReturnLossSeverity
} from "../../types/returnLossDashboard";

type RiskFilter = "ALL" | ReturnLossSeverity;

const AdminReturnLossDashboardPage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<ReturnLossDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [searchText, setSearchText] = useState<string>("");

  const loadDashboard = useCallback(
    async (isManualRefresh = false): Promise<void> => {
      try {
        if (isManualRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const data = await returnLossDashboardService.getDashboardData();
        setDashboardData(data);
      } catch {
        showToast(
          "Return loss dashboard failed",
          "Unable to load return loss and seller liability dashboard.",
          "danger"
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredSellers = useMemo(() => {
    const sellers = dashboardData?.sellerSummaries ?? [];
    const normalizedSearch = searchText.trim().toLowerCase();

    return sellers.filter((seller) => {
      const sellerId = seller?.sellerId?.toLowerCase() ?? "";
      const sellerName = seller?.sellerName?.toLowerCase() ?? "";

      const matchesSearch =
        !normalizedSearch ||
        sellerId.includes(normalizedSearch) ||
        sellerName.includes(normalizedSearch);

      const matchesRisk =
        riskFilter === "ALL" || seller.riskLevel === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [dashboardData, searchText, riskFilter]);

  if (isLoading) {
    return (
      <main className="admin-return-loss-dashboard-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading return loss dashboard..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-return-loss-dashboard-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Dashboard unavailable"
            message="Return loss dashboard data could not be loaded."
            iconClassName="bi bi-graph-down-arrow text-primary"
          />
        </section>
      </main>
    );
  }

  const isFilterActive = Boolean(searchText) || riskFilter !== "ALL";

  return (
    <main className="admin-return-loss-dashboard-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">
                Return Loss + Seller Liability Dashboard
              </h1>

              <p className="text-muted mb-0">
                Track return financial impact, restock recovery, damaged losses,
                seller disputes, and seller-wise risk.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary align-self-start align-self-lg-center"
              disabled={isRefreshing}
              onClick={() => void loadDashboard(true)}
            >
              <i
                className={`bi bi-arrow-clockwise me-2 ${
                  isRefreshing ? "spin" : ""
                }`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <AdminReturnLossSummaryCards summary={dashboardData.summary} />

        <AdminReturnLossBreakdownCards breakdown={dashboardData.breakdown} />

        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-md-6">
              <label htmlFor="sellerSearch" className="form-label fw-semibold">
                Search Seller
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <i className="bi bi-search" />
                </span>
                <input
                  id="sellerSearch"
                  type="text"
                  className="form-control border-start-0"
                  value={searchText}
                  placeholder="Search seller ID or seller name..."
                  onChange={(e) => setSearchText(e.target.value)}
                />
                {searchText && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setSearchText("")}
                    aria-label="Clear search text"
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-3">
              <label htmlFor="riskFilterSelect" className="form-label fw-semibold">
                Risk Filter
              </label>
              <select
                id="riskFilterSelect"
                className="form-select"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
              >
                <option value="ALL">All Levels</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="col-md-3 d-flex justify-content-md-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100 w-md-auto"
                disabled={!isFilterActive}
                onClick={() => {
                  setSearchText("");
                  setRiskFilter("ALL");
                }}
              >
                <i className="bi bi-x-circle me-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <AdminSellerLiabilityTable sellers={filteredSellers} />
      </section>
    </main>
  );
};

export default AdminReturnLossDashboardPage;