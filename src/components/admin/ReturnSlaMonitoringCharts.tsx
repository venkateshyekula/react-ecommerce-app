import type {
  ReturnSlaMonitoringSummary,
  ReturnSlaRiskLevel,
  ReturnSlaStatus
} from "../../types/returnSlaMonitoring";

type ReturnSlaMonitoringChartsProps = {
  summary: ReturnSlaMonitoringSummary;
};

const getRiskBadgeClass = (riskLevel: ReturnSlaRiskLevel): string => {
  switch (riskLevel) {
    case "CRITICAL":
      return "text-bg-danger";
    case "HIGH":
      return "text-bg-warning text-dark";
    case "MEDIUM":
      return "text-bg-info text-dark";
    case "LOW":
    default:
      return "text-bg-success";
  }
};

const getStatusBadgeClass = (status: ReturnSlaStatus): string => {
  switch (status) {
    case "BREACHED":
    case "ESCALATED":
      return "text-bg-danger";
    case "WARNING":
      return "text-bg-warning text-dark";
    case "COMPLETED":
      return "text-bg-secondary";
    case "WITHIN_SLA":
    default:
      return "text-bg-success";
  }
};

const ReturnSlaMonitoringCharts = ({
  summary
}: ReturnSlaMonitoringChartsProps) => {
  const riskCards: Array<{
    label: ReturnSlaRiskLevel;
    count: number;
  }> = [
    { label: "LOW", count: summary.lowRiskCount },
    { label: "MEDIUM", count: summary.mediumRiskCount },
    { label: "HIGH", count: summary.highRiskCount },
    { label: "CRITICAL", count: summary.criticalRiskCount }
  ];

  const statusCards: Array<{
    label: ReturnSlaStatus;
    count: number;
  }> = [
    { label: "WITHIN_SLA", count: summary.withinSlaCount },
    { label: "WARNING", count: summary.warningCount },
    { label: "BREACHED", count: summary.breachedCount },
    { label: "ESCALATED", count: summary.escalatedCount },
    { label: "COMPLETED", count: summary.completedCount }
  ];

  return (
    <div className="row g-3 mb-4">
      {/* Risk Distribution Card */}
      <div className="col-12 col-xl-5">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold mb-1">SLA Risk Distribution</h5>
              <p className="small text-muted mb-3">
                Return SLA records grouped by risk level.
              </p>

              <div className="row row-cols-2 g-2">
                {riskCards.map((risk) => (
                  <div className="col" key={risk.label}>
                    <div className="border rounded-4 p-3 bg-light h-100 d-flex flex-column justify-content-between">
                      <div>
                        <span
                          className={`badge ${getRiskBadgeClass(risk.label)}`}
                        >
                          {risk.label}
                        </span>
                      </div>
                      <div>
                        <strong className="d-block fs-4 mt-2">
                          {risk.count.toLocaleString()}
                        </strong>
                        <span className="text-muted small">Records</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview Card */}
      <div className="col-12 col-xl-7">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold mb-1">SLA Status Overview</h5>
              <p className="small text-muted mb-3">
                Current SLA state across return operations.
              </p>

              <div className="row row-cols-2 row-cols-sm-3 row-cols-md-5 g-2">
                {statusCards.map((status) => (
                  <div className="col" key={status.label}>
                    <div className="border rounded-4 p-3 bg-light h-100 d-flex flex-column justify-content-between">
                      <div>
                        <span
                          className={`badge ${getStatusBadgeClass(status.label)} text-truncate mw-100`}
                        >
                          {status.label.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div>
                        <strong className="d-block fs-4 mt-2">
                          {status.count.toLocaleString()}
                        </strong>
                        <span className="text-muted small">Records</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-top d-flex align-items-center gap-2 text-muted small">
              <i className="bi bi-speedometer2 text-primary fs-6" />
              <span>
                Average elapsed hours across operational returns:{" "}
                <strong className="text-dark">
                  {summary.averageElapsedHours} hrs
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnSlaMonitoringCharts;