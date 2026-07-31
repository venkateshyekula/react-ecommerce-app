import { useCallback, useEffect, useMemo, useState } from "react";
import ReturnAnalyticsCharts from "../../components/admin/ReturnRiskDistributionCharts";
import ReturnAnalyticsRiskTables from "../../components/admin/ReturnRiskIntelligenceTable";
import ReturnAnalyticsSummaryCards from "../../components/admin/ReturnAnalyticsSummaryCards";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { returnAnalyticsService } from "../../services/returnAnalyticsRiskService";
import type {
  CustomerReturnRiskRow,
  ProductReturnRiskRow,
  ReturnAnalyticsDashboardData,
  ReturnAnalyticsRiskLevel,
  SellerReturnRiskRow
} from "../../types/returnAnalyticsRisk";

type RiskFilter = "ALL" | ReturnAnalyticsRiskLevel;

const AdminReturnAnalyticsPage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<ReturnAnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const data = await returnAnalyticsService.getDashboardData();

      setDashboardData(data);
    } catch {
      showToast(
        "Return analytics failed",
        "Unable to load return analytics and fraud risk dashboard.",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredCustomerRows = useMemo(() => {
    const rows: CustomerReturnRiskRow[] = dashboardData?.customerRiskRows ?? [];
    const normalizedSearch = searchText.trim().toLowerCase();

    return rows.filter((row: CustomerReturnRiskRow) => {
      const matchesRisk = riskFilter === "ALL" || row.riskLevel === riskFilter;

      if (!matchesRisk) return false;
      if (!normalizedSearch) return true;

      const fields = [
        row.userId,
        row.customerName,
        row.customerEmail,
        row.riskLevel
      ];

      return fields.some((field) =>
        field ? field.toLowerCase().includes(normalizedSearch) : false
      );
    });
  }, [dashboardData, searchText, riskFilter]);

  const filteredProductRows = useMemo(() => {
    const rows: ProductReturnRiskRow[] = dashboardData?.productRiskRows ?? [];
    const normalizedSearch = searchText.trim().toLowerCase();

    return rows.filter((row: ProductReturnRiskRow) => {
      const matchesRisk = riskFilter === "ALL" || row.riskLevel === riskFilter;

      if (!matchesRisk) return false;
      if (!normalizedSearch) return true;

      const fields = [
        row.productId,
        row.productName,
        row.brand,
        row.category,
        row.sellerId,
        row.sellerName,
        row.riskLevel
      ];

      return fields.some((field) =>
        field ? field.toLowerCase().includes(normalizedSearch) : false
      );
    });
  }, [dashboardData, searchText, riskFilter]);

  const filteredSellerRows = useMemo(() => {
    const rows: SellerReturnRiskRow[] = dashboardData?.sellerRiskRows ?? [];
    const normalizedSearch = searchText.trim().toLowerCase();

    return rows.filter((row: SellerReturnRiskRow) => {
      const matchesRisk = riskFilter === "ALL" || row.riskLevel === riskFilter;

      if (!matchesRisk) return false;
      if (!normalizedSearch) return true;

      const fields = [row.sellerId, row.sellerName, row.riskLevel];

      return fields.some((field) =>
        field ? field.toLowerCase().includes(normalizedSearch) : false
      );
    });
  }, [dashboardData, searchText, riskFilter]);

  const handleClearFilters = (): void => {
    setSearchText("");
    setRiskFilter("ALL");
  };

  if (isLoading) {
    return (
      <main className="admin-return-analytics-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading return analytics dashboard..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-return-analytics-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Return analytics unavailable"
            message="Return analytics dashboard could not be loaded."
            iconClassName="bi bi-graph-up-arrow text-primary"
          />
        </section>
      </main>
    );
  }

  return (
    <main className="admin-return-analytics-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div>
            <span className="badge rounded-pill text-bg-primary mb-2">
              Phase 12P
            </span>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <h1 className="fw-bold mb-1">
                Return Analytics + Fraud Risk Intelligence
              </h1>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm mb-1"
                disabled={isLoading}
                onClick={() => void loadDashboard()}
              >
                <i className="bi bi-arrow-clockwise me-2" />
                Refresh
              </button>
            </div>

            <p className="text-muted mb-0">
              Monitor return trends, refund exposure, QC failures, seller risk,
              product quality risk, and customer return abuse signals.
            </p>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <ReturnAnalyticsSummaryCards summary={dashboardData.summary} />

        <ReturnAnalyticsCharts reasonTrends={dashboardData.reasonTrends} />

        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-7">
              <label
                htmlFor="analytics-search-input"
                className="form-label fw-semibold"
              >
                Search
              </label>

              <input
                id="analytics-search-input"
                type="search"
                className="form-control"
                value={searchText}
                placeholder="Search customer, product, seller, brand, category..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-md-4 col-lg-3">
              <label
                htmlFor="analytics-risk-filter"
                className="form-label fw-semibold"
              >
                Risk Level
              </label>

              <select
                id="analytics-risk-filter"
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
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="col-md-2 col-lg-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                disabled={!searchText && riskFilter === "ALL"}
                onClick={handleClearFilters}
              >
                <i className="bi bi-x-circle me-2" />
                Clear
              </button>
            </div>
          </div>
        </div>

        <ReturnAnalyticsRiskTables
          customerRows={filteredCustomerRows}
          productRows={filteredProductRows}
          sellerRows={filteredSellerRows}
        />
      </section>
    </main>
  );
};

export default AdminReturnAnalyticsPage;