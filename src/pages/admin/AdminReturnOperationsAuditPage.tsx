import { useCallback, useEffect, useMemo, useState } from "react";
import ReturnOperationsAuditCharts from "../../components/admin/ReturnOperationsAuditCharts";
import ReturnOperationsAuditSummaryCards from "../../components/admin/ReturnOperationsAuditSummaryCards";
import ReturnOperationsAuditTable from "../../components/admin/ReturnOperationsAuditTable";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { returnOperationsAuditService } from "../../services/returnOperationsAuditService";
import type {
  ReturnAuditAction,
  ReturnAuditComplianceStatus,
  ReturnAuditSeverity,
  ReturnAuditSource,
  ReturnOperationsAuditDashboardData
} from "../../types/returnOperationsAudit";

type SourceFilter = "ALL" | ReturnAuditSource;
type ActionFilter = "ALL" | ReturnAuditAction;
type SeverityFilter = "ALL" | ReturnAuditSeverity;
type ComplianceFilter = "ALL" | ReturnAuditComplianceStatus;

const sourceOptions: ReturnAuditSource[] = [
  "RETURN_REQUEST",
  "REFUND",
  "PICKUP_PROOF",
  "DELIVERY_PROOF",
  "SELLER_DISPUTE",
  "DAMAGED_INVENTORY",
  "AUTOMATION_RULE",
  "SYSTEM"
];

const severityOptions: ReturnAuditSeverity[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL"
];

const complianceOptions: ReturnAuditComplianceStatus[] = [
  "COMPLIANT",
  "REVIEW_REQUIRED",
  "NON_COMPLIANT"
];

const formatLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const AdminReturnOperationsAuditPage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<ReturnOperationsAuditDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [searchText, setSearchText] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [complianceFilter, setComplianceFilter] =
    useState<ComplianceFilter>("ALL");

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const data = await returnOperationsAuditService.getDashboardData();
      setDashboardData(data);
    } catch {
      showToast(
        "Audit dashboard failed",
        "Unable to load return operations audit log.",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const actionOptions = useMemo(() => {
    const records = dashboardData?.records ?? [];
    return Array.from(new Set(records.map((record) => record.action))).sort();
  }, [dashboardData]);

  const filteredRecords = useMemo(() => {
    const records = dashboardData?.records ?? [];
    const normalizedSearch = searchText.trim().toLowerCase();

    return records.filter((record) => {
      const searchableText = [
        record.auditId,
        record.source,
        record.action,
        record.entityId,
        record.entityType,
        record.returnRequestId ?? "",
        record.orderId ?? "",
        record.customerName ?? "",
        record.customerEmail ?? "",
        record.sellerName ?? "",
        record.ruleName ?? "",
        record.actorName,
        record.actorRole,
        record.summary,
        record.details,
        record.severity,
        record.complianceStatus
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesSource =
        sourceFilter === "ALL" || record.source === sourceFilter;

      const matchesAction =
        actionFilter === "ALL" || record.action === actionFilter;

      const matchesSeverity =
        severityFilter === "ALL" || record.severity === severityFilter;

      const matchesCompliance =
        complianceFilter === "ALL" ||
        record.complianceStatus === complianceFilter;

      return (
        matchesSearch &&
        matchesSource &&
        matchesAction &&
        matchesSeverity &&
        matchesCompliance
      );
    });
  }, [
    dashboardData,
    searchText,
    sourceFilter,
    actionFilter,
    severityFilter,
    complianceFilter
  ]);

  const handleExportCsv = async (): Promise<void> => {
    try {
      setIsExporting(true);
      await returnOperationsAuditService.exportCsv(filteredRecords);

      showToast(
        "CSV export generated",
        `${filteredRecords.length} audit records exported.`,
        "success"
      );
    } catch {
      showToast("Export failed", "Unable to export CSV audit log.", "danger");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = async (): Promise<void> => {
    try {
      setIsExporting(true);
      await returnOperationsAuditService.exportJson(filteredRecords);

      showToast(
        "JSON export generated",
        `${filteredRecords.length} audit records exported.`,
        "success"
      );
    } catch {
      showToast("Export failed", "Unable to export JSON audit log.", "danger");
    } finally {
      setIsExporting(false);
    }
  };

  const isFilterActive =
    Boolean(searchText) ||
    sourceFilter !== "ALL" ||
    actionFilter !== "ALL" ||
    severityFilter !== "ALL" ||
    complianceFilter !== "ALL";

  const totalRecordCount = dashboardData?.records.length ?? 0;

  if (isLoading) {
    return (
      <main className="admin-return-operations-audit-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading return operations audit log..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-return-operations-audit-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Audit dashboard unavailable"
            message="Return operations audit log could not be loaded."
            iconClassName="bi bi-journal-text text-primary"
          />
        </section>
      </main>
    );
  }

  return (
    <main className="admin-return-operations-audit-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div>
            <span className="badge rounded-pill text-bg-primary mb-2">
              Phase 12S
            </span>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <h1 className="fw-bold mb-1">
                Return Operations Audit Log + Compliance Export
              </h1>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm mb-1 ms-auto ms-md-2"
                onClick={() => void loadDashboard()}
              >
                <i className="bi bi-arrow-clockwise me-2" />
                Refresh
              </button>

              <button
                type="button"
                className="btn btn-outline-primary btn-sm mb-1"
                disabled={isExporting || filteredRecords.length === 0}
                onClick={() => void handleExportCsv()}
              >
                {isExporting ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                ) : (
                  <i className="bi bi-filetype-csv me-2" />
                )}
                Export CSV
              </button>

              <button
                type="button"
                className="btn btn-outline-success btn-sm mb-1"
                disabled={isExporting || filteredRecords.length === 0}
                onClick={() => void handleExportJson()}
              >
                {isExporting ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                ) : (
                  <i className="bi bi-filetype-json me-2" />
                )}
                Export JSON
              </button>
            </div>

            <p className="text-muted mb-0">
              Review return operation events, compliance status, audit severity,
              automation rule changes, and export filtered records for audit
              review.
            </p>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <ReturnOperationsAuditSummaryCards summary={dashboardData.summary} />

        <ReturnOperationsAuditCharts summary={dashboardData.summary} />

        {/* Filter Control Bar */}
        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-4">
              <label className="form-label fw-semibold">Search</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted" />
                </span>
                <input
                  className="form-control border-start-0 ps-0"
                  value={searchText}
                  placeholder="Search audit ID, customer, seller, rule, actor, detail..."
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </div>
            </div>

            <div className="col-md-6 col-lg-2">
              <label className="form-label fw-semibold">Source</label>
              <select
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
              <label className="form-label fw-semibold">Action</label>
              <select
                className="form-select"
                value={actionFilter}
                onChange={(event) =>
                  setActionFilter(event.target.value as ActionFilter)
                }
              >
                <option value="ALL">All Actions</option>
                {actionOptions.map((action) => (
                  <option value={action} key={action}>
                    {formatLabel(action)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 col-lg-2">
              <label className="form-label fw-semibold">Severity</label>
              <select
                className="form-select"
                value={severityFilter}
                onChange={(event) =>
                  setSeverityFilter(event.target.value as SeverityFilter)
                }
              >
                <option value="ALL">All Severity</option>
                {severityOptions.map((severity) => (
                  <option value={severity} key={severity}>
                    {formatLabel(severity)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 col-lg-2">
              <label className="form-label fw-semibold">Compliance</label>
              <select
                className="form-select"
                value={complianceFilter}
                onChange={(event) =>
                  setComplianceFilter(event.target.value as ComplianceFilter)
                }
              >
                <option value="ALL">All Compliance</option>
                {complianceOptions.map((status) => (
                  <option value={status} key={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Action Status Row */}
            <div className="col-12 d-flex align-items-center justify-content-between pt-2 border-top mt-3">
              <span className="small text-muted">
                Showing <strong>{filteredRecords.length.toLocaleString()}</strong> of{" "}
                <strong>{totalRecordCount.toLocaleString()}</strong> total audit records
              </span>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={!isFilterActive}
                onClick={() => {
                  setSearchText("");
                  setSourceFilter("ALL");
                  setActionFilter("ALL");
                  setSeverityFilter("ALL");
                  setComplianceFilter("ALL");
                }}
              >
                <i className="bi bi-x-circle me-1" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <ReturnOperationsAuditTable records={filteredRecords} />
      </section>
    </main>
  );
};

export default AdminReturnOperationsAuditPage;