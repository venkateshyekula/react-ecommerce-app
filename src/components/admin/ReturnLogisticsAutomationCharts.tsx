import type { ReturnLogisticsAutomationSummary } from "../../types/returnLogisticsAutomationRule";

type ReturnLogisticsAutomationChartsProps = {
  summary: ReturnLogisticsAutomationSummary;
};

const ReturnLogisticsAutomationCharts = ({
  summary
}: ReturnLogisticsAutomationChartsProps) => {
  const total = summary.totalRules || 1; // Prevent division by zero

  const statusCards = [
    {
      label: "Active Rules",
      value: summary.activeRules,
      badgeClass: "text-bg-success",
      progressClass: "bg-success",
      percentage: Math.round((summary.activeRules / total) * 100)
    },
    {
      label: "Inactive Rules",
      value: summary.inactiveRules,
      badgeClass: "text-bg-secondary",
      progressClass: "bg-secondary",
      percentage: Math.round((summary.inactiveRules / total) * 100)
    },
    {
      label: "Critical Rules",
      value: summary.criticalRules,
      badgeClass: "text-bg-danger",
      progressClass: "bg-danger",
      percentage: Math.round((summary.criticalRules / total) * 100)
    },
    {
      label: "High Priority",
      value: summary.highPriorityRules,
      badgeClass: "text-bg-warning text-dark",
      progressClass: "bg-warning",
      percentage: Math.round((summary.highPriorityRules / total) * 100)
    }
  ];

  const operationCards = [
    {
      label: "Pickup",
      value: summary.pickupRules,
      badgeClass: "text-bg-warning text-dark"
    },
    {
      label: "QC",
      value: summary.qcRules,
      badgeClass: "text-bg-info"
    },
    {
      label: "Refund",
      value: summary.refundRules,
      badgeClass: "text-bg-success"
    },
    {
      label: "Escalation",
      value: summary.escalationRules,
      badgeClass: "text-bg-danger"
    },
    {
      label: "Warehouse",
      value: summary.warehouseRules ?? 0,
      badgeClass: "text-bg-primary"
    },
    {
      label: "Support",
      value: summary.supportRules ?? 0,
      badgeClass: "text-bg-dark"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {/* Rule Status Overview */}
      <div className="col-12 col-xl-6">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold mb-1">Rule Status & Priority</h5>
              <p className="small text-muted mb-3">
                Health distribution across {summary.totalRules} configured rules.
              </p>

              <div className="row g-2">
                {statusCards.map((card) => (
                  <div className="col-6" key={card.label}>
                    <div className="border rounded-4 p-3 bg-light h-100">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className={`badge ${card.badgeClass}`}>
                          {card.label}
                        </span>
                        <span className="small text-muted">{card.percentage}%</span>
                      </div>
                      <strong className="d-block fs-4 text-dark mt-1">
                        {card.value}
                      </strong>
                      <div
                        className="progress mt-2"
                        style={{ height: "4px" }}
                        role="progressbar"
                        aria-valuenow={card.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={`progress-bar ${card.progressClass}`}
                          style={{ width: `${card.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="small text-muted mt-3 pt-2 border-top d-flex justify-content-between">
              <span>Total Active: <strong>{summary.activeRules}</strong></span>
              <span>Total Inactive: <strong>{summary.inactiveRules}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Operation Coverage */}
      <div className="col-12 col-xl-6">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold mb-1">Operation Coverage</h5>
              <p className="small text-muted mb-3">
                Automation rules grouped by operational domain.
              </p>

              <div className="row g-2">
                {operationCards.map((card) => (
                  <div className="col-4" key={card.label}>
                    <div className="border rounded-4 p-3 bg-light h-100">
                      <span className={`badge ${card.badgeClass}`}>
                        {card.label}
                      </span>
                      <strong className="d-block fs-4 text-dark mt-2">
                        {card.value}
                      </strong>
                      <span className="text-muted small">Rules</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="small text-muted mt-3 pt-2 border-top d-flex justify-content-between">
              <span className="text-success fw-medium">
                <i className="bi bi-check-circle-fill me-1" />
                Success: {summary.successCount.toLocaleString()}
              </span>
              <span className="text-danger fw-medium">
                <i className="bi bi-x-circle-fill me-1" />
                Failure: {summary.failureCount.toLocaleString()}
              </span>
              <span className="text-muted">
                Rate: <strong>{summary.successRate}%</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnLogisticsAutomationCharts;