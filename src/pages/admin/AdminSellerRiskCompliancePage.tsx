import { useCallback, useEffect, useMemo, useState } from "react";
import SellerRiskComplianceCharts from "../../components/admin/SellerRiskComplianceCharts";
import SellerRiskComplianceSummaryCards from "../../components/admin/SellerRiskComplianceSummaryCards";
import SellerRiskComplianceTable from "../../components/admin/SellerRiskComplianceTable";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { sellerRiskComplianceService } from "../../services/sellerRiskComplianceService";
import type {
  SellerComplianceRiskLevel,
  SellerComplianceStatus,
  SellerRiskComplianceDashboardData
} from "../../types/sellerRiskCompliance";

type RiskFilter = "ALL" | SellerComplianceRiskLevel;
type ComplianceFilter = "ALL" | SellerComplianceStatus;

const AdminSellerRiskCompliancePage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<SellerRiskComplianceDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [complianceFilter, setComplianceFilter] =
    useState<ComplianceFilter>("ALL");

  const loadDashboard = useCallback(
    async (isManualRefresh = false): Promise<void> => {
      try {
        if (isManualRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const data = await sellerRiskComplianceService.getDashboardData();
        setDashboardData(data);
      } catch {
        showToast(
          "Seller risk dashboard failed",
          "Unable to load seller risk and compliance score dashboard.",
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

  const filteredRows = useMemo(() => {
    const rows = dashboardData?.rows ?? [];
    const normalizedSearch = searchText.trim().toLowerCase();

    return rows.filter((row) => {
      const searchableText = [
        row.sellerId,
        row.sellerName,
        row.sellerEmail ?? "",
        row.sellerPhone ?? "",
        row.topReturnReason ?? "",
        row.repeatedReturnReasons.join(" "),
        row.riskLevel,
        row.complianceStatus
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesRisk =
        riskFilter === "ALL" || row.riskLevel === riskFilter;

      const matchesCompliance =
        complianceFilter === "ALL" ||
        row.complianceStatus === complianceFilter;

      return matchesSearch && matchesRisk && matchesCompliance;
    });
  }, [dashboardData, searchText, riskFilter, complianceFilter]);

  const isFiltered =
    Boolean(searchText) || riskFilter !== "ALL" || complianceFilter !== "ALL";

  const handleResetFilters = () => {
    setSearchText("");
    setRiskFilter("ALL");
    setComplianceFilter("ALL");
  };

  if (isLoading) {
    return (
      <main className="admin-seller-risk-compliance-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading seller risk compliance dashboard..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-seller-risk-compliance-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <div className="card border-0 shadow-sm rounded-3 p-4 text-center">
            <EmptyState
              title="Seller risk dashboard unavailable"
              message="Seller risk and compliance dashboard could not be loaded."
              iconClassName="bi bi-shop-window text-primary"
            />
            <div className="mt-3">
              <button
                type="button"
                className="btn btn-primary rounded-pill px-4"
                onClick={() => void loadDashboard()}
              >
                <i className="bi bi-arrow-clockwise me-2" />
                Retry Loading
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-seller-risk-compliance-page bg-light min-vh-100">
      {/* Header Section */}
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div>
            <span className="badge rounded-pill text-bg-primary mb-2">
              Phase 12P.3
            </span>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <h1 className="fw-bold mb-1">
                Seller Risk + Compliance Score
              </h1>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm mb-1"
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

            <p className="text-muted mb-0">
              Score sellers using return volume, QC failures, seller disputes,
              refund liability, damaged inventory value, and compliance signals.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="container-fluid py-4">
        {/* KPI Cards */}
        <SellerRiskComplianceSummaryCards summary={dashboardData.summary} />

        {/* Charts & Distributions */}
        <SellerRiskComplianceCharts
          summary={dashboardData.summary}
          reasonMetrics={dashboardData.reasonMetrics}
        />

        {/* Filters Controls */}
        <div className="bg-white border rounded-3 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-5">
              <label htmlFor="seller-search" className="form-label fw-semibold">
                Search
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted" />
                </span>
                <input
                  id="seller-search"
                  type="text"
                  className="form-control border-start-0 ps-0"
                  value={searchText}
                  placeholder="Search seller, email, phone, reason, status..."
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <label htmlFor="risk-filter" className="form-label fw-semibold">
                Risk Level
              </label>
              <select
                id="risk-filter"
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
              <label
                htmlFor="compliance-filter"
                className="form-label fw-semibold"
              >
                Compliance Status
              </label>
              <select
                id="compliance-filter"
                className="form-select"
                value={complianceFilter}
                onChange={(event) =>
                  setComplianceFilter(
                    event.target.value as ComplianceFilter
                  )
                }
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLIANT">Compliant</option>
                <option value="WATCHLIST">Watchlist</option>
                <option value="HIGH_RISK">High Risk</option>
                <option value="RESTRICTED">Restricted</option>
              </select>
            </div>

            <div className="col-lg-1 d-flex justify-content-lg-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                disabled={!isFiltered}
                onClick={handleResetFilters}
                aria-label="Reset all search and filter options"
                title="Reset filters"
              >
                <i className="bi bi-x-circle me-lg-0 me-1" />
                <span className="d-lg-none"> Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <SellerRiskComplianceTable rows={filteredRows} />
      </section>
    </main>
  );
};

export default AdminSellerRiskCompliancePage;