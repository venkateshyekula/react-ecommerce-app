import { useCallback, useEffect, useMemo, useState } from "react";
import ProductReturnQualityCharts from "../../components/admin/ProductReturnQualityCharts";
import ProductReturnQualitySummaryCards from "../../components/admin/ProductReturnQualitySummaryCards";
import ProductReturnQualityTable from "../../components/admin/ProductReturnQualityTable";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { productReturnQualityService } from "../../services/productReturnQualityService";
import type {
  ProductQualityRiskLevel,
  ProductReturnQualityDashboardData,
  ProductReturnQualityRow
} from "../../types/productReturnQuality";

type RiskFilter = "ALL" | ProductQualityRiskLevel;

const AdminProductReturnQualityPage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<ProductReturnQualityDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const data = await productReturnQualityService.getDashboardData();

      setDashboardData(data);
    } catch {
      showToast(
        "Product return quality failed",
        "Unable to load product return quality intelligence dashboard.",
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

    return rows.filter((row: ProductReturnQualityRow) => {
      const matchesRisk =
        riskFilter === "ALL" || row.riskLevel === riskFilter;

      if (!matchesRisk) return false;
      if (!normalizedSearch) return true;

      const fieldsToSearch = [
        row.productId,
        row.productName,
        row.brand,
        row.category,
        row.sellerId,
        row.sellerName,
        row.topReturnReason,
        row.riskLevel,
        ...row.repeatedReasons,
        ...row.qualitySignals
      ];

      return fieldsToSearch.some((field) =>
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
      <main className="admin-product-return-quality-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading product return quality dashboard..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-product-return-quality-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Product return quality unavailable"
            message="Product return quality intelligence dashboard could not be loaded."
            iconClassName="bi bi-box-seam text-primary"
          />
        </section>
      </main>
    );
  }

  return (
    <main className="admin-product-return-quality-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div>
            <span className="badge rounded-pill text-bg-primary mb-2">
              Phase 12P.2
            </span>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <h1 className="fw-bold mb-1">
                Product Return Quality Intelligence
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
              Detect high-return products, repeated quality complaints, QC
              failures, damaged inventory impact, and product-level risk.
            </p>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <ProductReturnQualitySummaryCards summary={dashboardData.summary} />

        <ProductReturnQualityCharts
          summary={dashboardData.summary}
          reasonMetrics={dashboardData.reasonMetrics}
        />

        <div className="bg-white border rounded-3 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-7">
              <label
                htmlFor="product-search-input"
                className="form-label fw-semibold"
              >
                Search
              </label>

              <input
                id="product-search-input"
                type="search"
                className="form-control"
                value={searchText}
                placeholder="Search product, brand, category, seller, reason, signal, risk..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-md-6 col-lg-3">
              <label
                htmlFor="product-risk-filter"
                className="form-label fw-semibold"
              >
                Risk Level
              </label>

              <select
                id="product-risk-filter"
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

            <div className="col-md-6 col-lg-2 d-flex justify-content-lg-end">
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

        <ProductReturnQualityTable rows={filteredRows} />
      </section>
    </main>
  );
};

export default AdminProductReturnQualityPage;