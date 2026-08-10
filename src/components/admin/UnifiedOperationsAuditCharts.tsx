import type {
  UnifiedAuditComplianceStatus,
  UnifiedAuditSeverity,
  UnifiedOperationsAuditSummary
} from "../../types/unifiedOperationsAudit";

type UnifiedOperationsAuditChartsProps = {
  summary?: UnifiedOperationsAuditSummary;
};

const getSeverityBadgeClass = (severity: UnifiedAuditSeverity): string => {
  switch (severity) {
    case "CRITICAL":
      return "text-bg-danger";
    case "HIGH":
      return "text-bg-warning text-dark";
    case "MEDIUM":
      return "text-bg-info";
    case "LOW":
    default:
      return "text-bg-success";
  }
};

const getComplianceBadgeClass = (
  status: UnifiedAuditComplianceStatus
): string => {
  switch (status) {
    case "NON_COMPLIANT":
      return "text-bg-danger";
    case "REVIEW_REQUIRED":
      return "text-bg-warning text-dark";
    case "COMPLIANT":
    default:
      return "text-bg-success";
  }
};

// Formats ENUM strings like "REVIEW_REQUIRED" to "Review Required"
const formatLabel = (label: string): string =>
  label
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

// Human-readable date formatting
const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? dateStr : date.toLocaleString();
};

const UnifiedOperationsAuditCharts = ({
  summary
}: UnifiedOperationsAuditChartsProps) => {
  if (!summary) {
    return null;
  }

  const severityCards: Array<{
    label: UnifiedAuditSeverity;
    count: number;
  }> = [
    { label: "LOW", count: summary.lowSeverityEvents ?? 0 },
    { label: "MEDIUM", count: summary.mediumSeverityEvents ?? 0 },
    { label: "HIGH", count: summary.highSeverityEvents ?? 0 },
    { label: "CRITICAL", count: summary.criticalSeverityEvents ?? 0 }
  ];

  const complianceCards: Array<{
    label: UnifiedAuditComplianceStatus;
    count: number;
  }> = [
    { label: "COMPLIANT", count: summary.compliantEvents ?? 0 },
    { label: "REVIEW_REQUIRED", count: summary.reviewRequiredEvents ?? 0 },
    { label: "NON_COMPLIANT", count: summary.nonCompliantEvents ?? 0 }
  ];

  return (
    <div className="row g-3 mb-4">
      {/* Severity Distribution */}
      <div className="col-12 col-xl-6">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Severity Distribution</h5>
            <p className="small text-muted mb-3">
              Unified operations audit events grouped by severity.
            </p>

            <div className="row g-2">
              {severityCards.map((card) => (
                <div className="col-6" key={card.label}>
                  <div className="border rounded-4 p-3 bg-light h-100">
                    <span
                      className={`badge ${getSeverityBadgeClass(card.label)}`}
                    >
                      {formatLabel(card.label)}
                    </span>
                    <strong className="d-block fs-4 mt-2">
                      {card.count.toLocaleString()}
                    </strong>
                    <span className="text-muted small">Events</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="col-12 col-xl-6">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Compliance Status</h5>
            <p className="small text-muted mb-3">
              Unified audit records grouped by compliance review status.
            </p>

            <div className="row g-2">
              {complianceCards.map((card) => (
                <div className="col-12 col-md-4" key={card.label}>
                  <div className="border rounded-4 p-3 bg-light h-100">
                    <span
                      className={`badge ${getComplianceBadgeClass(card.label)}`}
                    >
                      {formatLabel(card.label)}
                    </span>
                    <strong className="d-block fs-4 mt-2">
                      {card.count.toLocaleString()}
                    </strong>
                    <span className="text-muted small">Records</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="small text-muted mt-3">
              Latest audit: {formatDate(summary.latestAuditAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedOperationsAuditCharts;