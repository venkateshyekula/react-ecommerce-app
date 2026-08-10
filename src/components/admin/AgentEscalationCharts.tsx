import type {
  AgentEscalationRiskLevel,
  AgentEscalationStatus,
  AgentEscalationSummary
} from "../../types/agentEscalationReassignment";

type AgentEscalationChartsProps = {
  summary?: AgentEscalationSummary;
};

const getRiskBadgeClass = (risk: AgentEscalationRiskLevel): string => {
  switch (risk) {
    case "CRITICAL":
      return "text-bg-danger";
    case "HIGH":
      return "text-bg-warning text-dark";
    case "MEDIUM":
      return "text-bg-info text-dark";
    case "LOW":
      return "text-bg-success";
    default:
      return "text-bg-secondary";
  }
};

const getRiskBarClass = (risk: AgentEscalationRiskLevel): string => {
  switch (risk) {
    case "CRITICAL":
      return "bg-danger";
    case "HIGH":
      return "bg-warning";
    case "MEDIUM":
      return "bg-info";
    case "LOW":
      return "bg-success";
    default:
      return "bg-secondary";
  }
};

const getStatusBadgeClass = (status: AgentEscalationStatus): string => {
  switch (status) {
    case "OPEN":
      return "text-bg-warning text-dark";
    case "ESCALATED":
      return "text-bg-danger";
    case "REASSIGNED":
      return "text-bg-primary";
    case "RESOLVED":
      return "text-bg-success";
    case "CANCELLED":
      return "text-bg-secondary";
    default:
      return "text-bg-info text-dark";
  }
};

const AgentEscalationCharts = ({ summary }: AgentEscalationChartsProps) => {
  if (!summary) {
    return null;
  }

  const totalRows = summary.totalRows || 1; // Prevent division by zero

  const riskCards: Array<{ label: AgentEscalationRiskLevel; count: number }> = [
    { label: "CRITICAL", count: summary.criticalRiskCount },
    { label: "HIGH", count: summary.highRiskCount },
    { label: "MEDIUM", count: summary.mediumRiskCount },
    { label: "LOW", count: summary.lowRiskCount }
  ];

  const statusCards: Array<{ label: AgentEscalationStatus; count: number }> = [
    { label: "OPEN", count: summary.openEscalations },
    { label: "IN_PROGRESS", count: summary.inProgressEscalations },
    { label: "REASSIGNED", count: summary.reassignedEscalations },
    { label: "RESOLVED", count: summary.resolvedEscalations },
    { label: "CANCELLED", count: summary.cancelledEscalations }
  ];

  return (
    <div className="row g-3 mb-4">
      {/* Risk Level Distribution */}
      <div className="col-12 col-xl-5">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h5 className="fw-bold m-0">Agent Escalation Risk</h5>
                <span className="badge text-bg-light border text-muted">
                  Total: {summary.totalRows}
                </span>
              </div>
              <p className="small text-muted mb-3">
                Distribution of escalation items by priority level.
              </p>

              {/* Stacked Progress Bar */}
              <div
                className="progress rounded-pill mb-3"
                style={{ height: "10px" }}
              >
                {riskCards.map((risk) => {
                  const percent = Math.round((risk.count / totalRows) * 100);
                  if (percent === 0) return null;
                  return (
                    <div
                      key={risk.label}
                      className={`progress-bar ${getRiskBarClass(risk.label)}`}
                      role="progressbar"
                      style={{ width: `${percent}%` }}
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      title={`${risk.label}: ${risk.count} (${percent}%)`}
                    />
                  );
                })}
              </div>

              <div className="row g-2">
                {riskCards.map((risk) => {
                  const percent = Math.round((risk.count / totalRows) * 100);
                  return (
                    <div className="col-6" key={risk.label}>
                      <div className="border rounded-4 p-3 bg-light h-100 d-flex flex-column justify-content-between">
                        <div className="d-flex justify-content-between align-items-center">
                          <span
                            className={`badge ${getRiskBadgeClass(risk.label)}`}
                          >
                            {risk.label}
                          </span>
                          <span className="text-muted extra-small fw-semibold">
                            {percent}%
                          </span>
                        </div>
                        <div className="mt-2">
                          <strong className="fs-4 d-block lh-1">
                            {risk.count}
                          </strong>
                          <span className="text-muted small">Rows</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="col-12 col-xl-7">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h5 className="fw-bold m-0">Escalation Status Overview</h5>
                <span className="badge text-bg-light border text-muted">
                  Avg Time: {summary.averageElapsedHours} hrs
                </span>
              </div>
              <p className="small text-muted mb-3">
                Current status across reassignment and escalation workflows.
              </p>

              <div className="row g-2">
                {statusCards.map((status) => {
                  const percent = Math.round((status.count / totalRows) * 100);
                  return (
                    <div className="col-6 col-md-4" key={status.label}>
                      <div className="border rounded-4 p-3 bg-light h-100 d-flex flex-column justify-content-between">
                        <div className="d-flex justify-content-between align-items-center">
                          <span
                            className={`badge ${getStatusBadgeClass(status.label)}`}
                          >
                            {status.label.replace(/_/g, " ")}
                          </span>
                          <span className="text-muted extra-small fw-semibold">
                            {percent}%
                          </span>
                        </div>
                        <div className="mt-2">
                          <strong className="fs-4 d-block lh-1">
                            {status.count}
                          </strong>
                          <span className="text-muted small">Records</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 mt-3 border-top d-flex justify-content-between align-items-center text-muted small">
              <span>
                <i className="bi bi-clock-history me-1" aria-hidden="true" />
                Average elapsed time per task
              </span>
              <strong className="text-dark">
                {summary.averageElapsedHours} Hours
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentEscalationCharts;