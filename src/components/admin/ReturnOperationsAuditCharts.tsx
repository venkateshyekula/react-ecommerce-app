import type {
  ReturnAuditComplianceStatus,
  ReturnAuditSeverity,
  ReturnOperationsAuditSummary
} from "../../types/returnOperationsAudit";

type ReturnOperationsAuditChartsProps = {
  summary: ReturnOperationsAuditSummary;
};

const getSeverityBadgeClass = (severity: ReturnAuditSeverity): string => {
  if (severity === "CRITICAL") {
    return "text-bg-danger";
  }

  if (severity === "HIGH") {
    return "text-bg-warning text-dark";
  }

  if (severity === "MEDIUM") {
    return "text-bg-info";
  }

  return "text-bg-success";
};

const getComplianceBadgeClass = (
  status: ReturnAuditComplianceStatus
): string => {
  if (status === "NON_COMPLIANT") {
    return "text-bg-danger";
  }

  if (status === "REVIEW_REQUIRED") {
    return "text-bg-warning text-dark";
  }

  return "text-bg-success";
};

const formatTimestamp = (dateString?: string): string => {
  if (!dateString) return "Not Available";
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? "Not Available" : date.toLocaleString();
};

const ReturnOperationsAuditCharts = ({
  summary
}: ReturnOperationsAuditChartsProps) => {
  const totalRecords = summary.totalAuditRecords || 1; // Prevent division by zero

  const severityRows: Array<{
    label: ReturnAuditSeverity;
    count: number;
    badgeClass: string;
  }> = [
    { label: "LOW", count: summary.lowSeverityEvents, badgeClass: "bg-success" },
    { label: "MEDIUM", count: summary.mediumSeverityEvents, badgeClass: "bg-info" },
    { label: "HIGH", count: summary.highSeverityEvents, badgeClass: "bg-warning" },
    { label: "CRITICAL", count: summary.criticalSeverityEvents, badgeClass: "bg-danger" }
  ];

  const complianceRows: Array<{
    label: ReturnAuditComplianceStatus;
    count: number;
    badgeClass: string;
  }> = [
    { label: "COMPLIANT", count: summary.compliantEvents, badgeClass: "bg-success" },
    { label: "REVIEW_REQUIRED", count: summary.reviewRequiredEvents, badgeClass: "bg-warning" },
    { label: "NON_COMPLIANT", count: summary.nonCompliantEvents, badgeClass: "bg-danger" }
  ];

  return (
    <div className="row g-3 mb-4">
      {/* Severity Distribution */}
      <div className="col-12 col-xl-6">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Severity Distribution</h5>
            <p className="small text-muted mb-3">
              Operational audit events grouped by severity level.
            </p>

            <div className="row g-2">
              {severityRows.map((row) => {
                const percentage = Math.round((row.count / totalRecords) * 100);

                return (
                  <div className="col-6" key={row.label}>
                    <div className="border rounded-4 p-3 bg-light h-100 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className={`badge ${getSeverityBadgeClass(row.label)}`}>
                            {row.label}
                          </span>
                          <span className="text-muted extra-small">{percentage}%</span>
                        </div>
                        <strong className="d-block fs-4 mt-2">{row.count.toLocaleString()}</strong>
                        <span className="text-muted small">Events</span>
                      </div>

                      {/* Visual progress bar */}
                      <div className="progress mt-2" style={{ height: "4px" }}>
                        <div
                          className={`progress-bar ${row.badgeClass}`}
                          role="progressbar"
                          style={{ width: `${percentage}%` }}
                          aria-valuenow={percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="col-12 col-xl-6">
        <div className="card border-0 shadow-sm rounded-4 h-100 d-flex flex-column justify-content-between">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Compliance Status</h5>
            <p className="small text-muted mb-3">
              Audit records grouped by compliance export status.
            </p>

            <div className="row g-2">
              {complianceRows.map((row) => {
                const percentage = Math.round((row.count / totalRecords) * 100);

                return (
                  <div className="col-12 col-md-4" key={row.label}>
                    <div className="border rounded-4 p-3 bg-light h-100 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className={`badge ${getComplianceBadgeClass(row.label)}`}>
                            {row.label.replace(/_/g, " ")}
                          </span>
                        </div>
                        <strong className="d-block fs-4 mt-2">{row.count.toLocaleString()}</strong>
                        <span className="text-muted small">Records ({percentage}%)</span>
                      </div>

                      {/* Visual progress bar */}
                      <div className="progress mt-2" style={{ height: "4px" }}>
                        <div
                          className={`progress-bar ${row.badgeClass}`}
                          role="progressbar"
                          style={{ width: `${percentage}%` }}
                          aria-valuenow={percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-footer bg-transparent border-0 px-4 pb-3 pt-0">
            <span className="small text-muted">
              <i className="bi bi-clock-history me-1" />
              Latest audit event: <strong>{formatTimestamp(summary.latestAuditAt)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnOperationsAuditCharts;