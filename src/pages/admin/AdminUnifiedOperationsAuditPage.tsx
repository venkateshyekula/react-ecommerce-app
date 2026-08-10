import { useCallback, useEffect, useMemo, useState } from "react";
import UnifiedOperationsAuditCharts from "../../components/admin/UnifiedOperationsAuditCharts";
import UnifiedOperationsAuditSummaryCards from "../../components/admin/UnifiedOperationsAuditSummaryCards";
import UnifiedOperationsAuditTable from "../../components/admin/UnifiedOperationsAuditTable";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { unifiedOperationsAuditService } from "../../services/unifiedOperationsAuditService";
import type {
  UnifiedAuditAction,
  UnifiedAuditComplianceStatus,
  UnifiedAuditSeverity,
  UnifiedAuditSource,
  UnifiedOperationsAuditDashboardData
} from "../../types/unifiedOperationsAudit";

type SourceFilter = "ALL" | UnifiedAuditSource;
type ActionFilter = "ALL" | UnifiedAuditAction;
type SeverityFilter = "ALL" | UnifiedAuditSeverity;
type ComplianceFilter = "ALL" | UnifiedAuditComplianceStatus;

const sourceOptions: UnifiedAuditSource[] = [
  "RETURN_REQUEST",
  "REFUND",
  "PICKUP_PROOF",
  "DELIVERY_PROOF",
  "RETURN_AUTOMATION_RULE",
  "RETURN_LOGISTICS_RULE",
  "RETURN_SLA_ESCALATION",
  "AGENT_ESCALATION",
  "SELLER_PAYOUT_ADJUSTMENT",
  "SUPPORT_ESCALATION",
  "SYSTEM_EXPORT"
];

const severityOptions: UnifiedAuditSeverity[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL"
];

const complianceOptions: UnifiedAuditComplianceStatus[] = [
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

const AdminUnifiedOperationsAuditPage = () => {
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<UnifiedOperationsAuditDashboardData | null>(null);
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

      const data = await unifiedOperationsAuditService.getDashboardData();

      setDashboardData(data);
    } catch {
      showToast(
        "Unified audit failed",
        "Unable to load unified operations audit log.",
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
        record.agentName ?? "",
        record.ruleName ?? "",
        record.actorName,
        record.actorRole,
        record.summary,
        record.details ?? "",
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

      await unifiedOperationsAuditService.exportCsv(filteredRecords);

      showToast(
        "CSV export generated",
        `${filteredRecords.length} unified audit records exported.`,
        "success"
      );
    } catch {
      showToast(
        "Export failed",
        "Unable to export unified CSV audit log.",
        "danger"
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = async (): Promise<void> => {
    try {
      setIsExporting(true);

      await unifiedOperationsAuditService.exportJson(filteredRecords);

      showToast(
        "JSON export generated",
        `${filteredRecords.length} unified audit records exported.`,
        "success"
      );
    } catch {
      showToast(
        "Export failed",
        "Unable to export unified JSON audit log.",
        "danger"
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="admin-unified-operations-audit-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading unified operations audit log..." />
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="admin-unified-operations-audit-page bg-light min-vh-100">
        <section className="container-fluid py-5">
          <EmptyState
            title="Unified audit unavailable"
            message="Unified operations audit dashboard could not be loaded."
            iconClassName="bi bi-journal-text text-primary"
          />
        </section>
      </main>
    );
  }

  const hasActiveFilters =
    searchText !== "" ||
    sourceFilter !== "ALL" ||
    actionFilter !== "ALL" ||
    severityFilter !== "ALL" ||
    complianceFilter !== "ALL";

  return (
    <main className="admin-unified-operations-audit-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <span className="badge rounded-pill text-bg-primary mb-2">
            Phase 12W
          </span>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <h1 className="fw-bold mb-1">
              Unified Operations Audit Log + Compliance Export
            </h1>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mb-1"
              onClick={() => void loadDashboard()}
              disabled={isExporting}
            >
              <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />
              Refresh
            </button>

            <button
              type="button"
              className="btn btn-outline-primary btn-sm mb-1"
              disabled={isExporting || filteredRecords.length === 0}
              onClick={() => void handleExportCsv()}
            >
              {isExporting ? (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
              ) : (
                <i className="bi bi-filetype-csv me-2" aria-hidden="true" />
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
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
              ) : (
                <i className="bi bi-filetype-json me-2" aria-hidden="true" />
              )}
              Export JSON
            </button>
          </div>

          <p className="text-muted mb-0">
            Review and export a unified audit trail across returns, logistics,
            SLA, agent escalation, support, seller payout, automation, and
            compliance operations.
          </p>
        </div>
      </section>

      <section className="container-fluid py-4">
        <UnifiedOperationsAuditSummaryCards summary={dashboardData.summary} />

        <UnifiedOperationsAuditCharts summary={dashboardData.summary} />

        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-xl-4">
              <label htmlFor="auditSearchInput" className="form-label fw-semibold">
                Search
              </label>
              <input
                id="auditSearchInput"
                className="form-control"
                value={searchText}
                placeholder="Search audit, return, order, seller, agent, rule, actor..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-6 col-md-3 col-xl-2">
              <label htmlFor="sourceFilterSelect" className="form-label fw-semibold">
                Source
              </label>
              <select
                id="sourceFilterSelect"
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

            <div className="col-6 col-md-3 col-xl-2">
              <label htmlFor="actionFilterSelect" className="form-label fw-semibold">
                Action
              </label>
              <select
                id="actionFilterSelect"
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

            <div className="col-6 col-md-3 col-xl-2">
              <label htmlFor="severityFilterSelect" className="form-label fw-semibold">
                Severity
              </label>
              <select
                id="severityFilterSelect"
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

            <div className="col-6 col-md-3 col-xl-2">
              <label htmlFor="complianceFilterSelect" className="form-label fw-semibold">
                Compliance
              </label>
              <select
                id="complianceFilterSelect"
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

            <div className="col-12 d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={!hasActiveFilters}
                onClick={() => {
                  setSearchText("");
                  setSourceFilter("ALL");
                  setActionFilter("ALL");
                  setSeverityFilter("ALL");
                  setComplianceFilter("ALL");
                }}
              >
                <i className="bi bi-x-circle me-2" aria-hidden="true" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <UnifiedOperationsAuditTable records={filteredRecords} />
      </section>
    </main>
  );
};

export default AdminUnifiedOperationsAuditPage;