import { useCallback, useEffect, useMemo, useState } from "react";
import CustomerReturnAbuseRiskCharts from "../../components/admin/CustomerReturnAbuseRiskCharts";
import CustomerReturnAbuseSummaryCards from "../../components/admin/CustomerReturnAbuseSummaryCards";
import CustomerReturnAbuseTable from "../../components/admin/CustomerReturnAbuseTable";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { customerReturnAbuseService } from "../../services/customerReturnAbuseService";
import type {
  CustomerAbuseRiskLevel,
  CustomerReturnAbuseDashboardData,
  CustomerReturnAbuseRow
} from "../../types/customerReturnAbuse";

type RiskFilter = "ALL" | CustomerAbuseRiskLevel;

const AdminCustomerReturnAbusePage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<CustomerReturnAbuseDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const data = await customerReturnAbuseService.getDashboardData();

      setDashboardData(data);
    } catch {
      showToast(
        "Customer abuse detection failed",
        "Unable to load customer return abuse dashboard.",
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

    return rows.filter((row: CustomerReturnAbuseRow) => {
      const matchesRisk =
        riskFilter === "ALL" || row.riskLevel === riskFilter;

      if (!matchesRisk) return false;
      if (!normalizedSearch) return true;

      const fieldsToSearch = [
        row.customerId,
        row.customerName,
        row.customerEmail,
        row.customerPhone,
        row.topReturnReason,
        row.riskLevel,
        ...row.repeatedReasons
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
      <main className="admin-customer-return-abuse-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading customer return abuse dashboard..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-customer-return-abuse-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Customer abuse dashboard unavailable"
            message="Customer return abuse dashboard could not be loaded."
            iconClassName="bi bi-person-exclamation text-primary"
          />
        </section>
      </main>
    );
  }

  return (
    <main className="admin-customer-return-abuse-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div>
            <span className="badge rounded-pill text-bg-primary mb-2">
              Phase 12P.1
            </span>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <h1 className="fw-bold mb-1">
                Customer Return Abuse Detection
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
              Detect suspicious return patterns using return frequency, refund
              value, repeated reasons, QC failures, failed pickup attempts, and
              rejected proof records.
            </p>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <CustomerReturnAbuseSummaryCards summary={dashboardData.summary} />

        <CustomerReturnAbuseRiskCharts
          summary={dashboardData.summary}
          reasonMetrics={dashboardData.reasonMetrics}
        />

        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-7">
              <label
                htmlFor="abuse-search-input"
                className="form-label fw-semibold"
              >
                Search
              </label>

              <input
                id="abuse-search-input"
                type="search"
                className="form-control"
                value={searchText}
                placeholder="Search customer name, email, phone, reason, risk..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-md-6 col-lg-3">
              <label
                htmlFor="abuse-risk-filter"
                className="form-label fw-semibold"
              >
                Risk Level
              </label>

              <select
                id="abuse-risk-filter"
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

        <CustomerReturnAbuseTable rows={filteredRows} />
      </section>
    </main>
  );
};

export default AdminCustomerReturnAbusePage;