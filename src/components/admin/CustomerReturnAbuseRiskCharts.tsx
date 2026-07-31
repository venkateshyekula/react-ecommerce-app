import { customerReturnAbuseService } from "../../services/customerReturnAbuseService";
import type {
  CustomerAbuseRiskLevel,
  CustomerReturnAbuseReasonMetric,
  CustomerReturnAbuseSummary
} from "../../types/customerReturnAbuse";

type CustomerReturnAbuseRiskChartsProps = {
  summary: CustomerReturnAbuseSummary;
  reasonMetrics: CustomerReturnAbuseReasonMetric[];
};

const getRiskBadgeClass = (riskLevel: CustomerAbuseRiskLevel): string => {
  switch (riskLevel) {
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

const CustomerReturnAbuseRiskCharts = ({
  summary,
  reasonMetrics
}: CustomerReturnAbuseRiskChartsProps) => {
  const riskCards: Array<{
    label: CustomerAbuseRiskLevel;
    count: number;
  }> = [
    {
      label: "LOW",
      count: summary.lowRiskCustomers
    },
    {
      label: "MEDIUM",
      count: summary.mediumRiskCustomers
    },
    {
      label: "HIGH",
      count: summary.highRiskCustomers
    },
    {
      label: "CRITICAL",
      count: summary.criticalRiskCustomers
    }
  ];

  const topReasons = reasonMetrics.slice(0, 6);
  const maxCount = Math.max(...topReasons.map((reason) => reason.count), 1);

  return (
    <div className="row g-3 mb-4">
      {/* Customer Risk Distribution Card */}
      <div className="col-12 col-xl-5">
        <div className="card border-0 shadow-sm rounded-3 h-100">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Customer Risk Distribution</h5>
            <p className="small text-muted mb-3">
              Customer return abuse risk grouped by calculated risk score.
            </p>

            <div className="row g-2">
              {riskCards.map((risk) => (
                <div className="col-6" key={risk.label}>
                  <div className="border rounded-4 p-3 bg-light h-100 d-flex flex-column justify-content-between">
                    <div>
                      <span
                        className={`badge align-self-start ${getRiskBadgeClass(
                          risk.label
                        )} rounded-pill`}
                      >
                        {risk.label}
                      </span>
                    </div>
                    <div>
                      <strong className="d-block fs-3 fw-bold mt-2 text-dark">
                        {risk.count}
                      </strong>
                      <span className="text-muted small">Customers</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Repeated Return Reasons Chart Card */}
      <div className="col-12 col-xl-7">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Repeated Return Reasons</h5>
            <p className="small text-muted mb-3">
              Most common return reasons across monitored customers.
            </p>

            {topReasons.length === 0 ? (
              <div className="alert alert-light border mb-0 text-muted small">
                No return reason metrics available.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {topReasons.map((reason) => {
                  const percentage = Math.round(
                    (reason.count / maxCount) * 100
                  );
                  const barWidth = Math.max(percentage, 8);

                  return (
                    <div key={reason.reason}>
                      <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                        <span
                          className="small fw-semibold text-truncate"
                          title={reason.reason}
                        >
                          {reason.reason}
                        </span>
                        <span className="small text-muted text-nowrap">
                          {reason.count} {reason.count === 1 ? "return" : "returns"} ·{" "}
                          {customerReturnAbuseService.formatCurrency(
                            reason.refundAmount
                          )}
                        </span>
                      </div>

                      <div
                        className="progress"
                        style={{ height: "10px" }}
                        role="progressbar"
                        aria-label={`Return reason: ${reason.reason}`}
                        aria-valuenow={reason.count}
                        aria-valuemin={0}
                        aria-valuemax={maxCount}
                      >
                        <div
                          className="progress-bar bg-primary rounded-pill"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReturnAbuseRiskCharts;