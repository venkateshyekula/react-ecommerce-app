import React from "react";
import {
  ReturnFraudPatternRecord,
  ReturnFraudPatternSummary,
} from "../../types/returnFraudPattern";

interface ReturnFraudDistributionChartsProps {
  summary?: ReturnFraudPatternSummary;
  records?: ReturnFraudPatternRecord[];
}

const getPercent = (value: number, total: number): number => {
  if (!total || value <= 0) {
    return 0;
  }
  return Math.round((value / total) * 100);
};

const ReturnFraudDistributionCharts: React.FC<
  ReturnFraudDistributionChartsProps
> = ({ summary, records = [] }) => {
  const topPattern = records[0];
  const totalFlagged = summary?.totalFlaggedPatterns ?? 0;

  const distribution = [
    {
      label: "Low",
      value: summary?.lowRiskPatterns ?? 0,
      colorClass: "bg-success",
    },
    {
      label: "Medium",
      value: summary?.mediumRiskPatterns ?? 0,
      colorClass: "bg-info",
    },
    {
      label: "High",
      value: summary?.highRiskPatterns ?? 0,
      // Custom style fallback in case bg-orange isn't in main CSS bundle
      colorClass: "bg-warning text-dark",
    },
    {
      label: "Critical",
      value: summary?.criticalRiskPatterns ?? 0,
      colorClass: "bg-danger",
    },
  ];

  return (
    <div className="row g-3 mb-4">
      {/* Fraud Risk Distribution Bar Chart */}
      <div className="col-lg-7">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Fraud Risk Distribution</h5>

            <div className="d-flex flex-column gap-3">
              {distribution.map((item) => {
                const percent = getPercent(item.value, totalFlagged);

                return (
                  <div key={item.label}>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-semibold">{item.label}</span>
                      <span className="text-muted">
                        {item.value} ({percent}%)
                      </span>
                    </div>

                    <div
                      className="progress"
                      role="progressbar"
                      aria-label={`${item.label} fraud risk`}
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      style={{ height: "10px" }}
                    >
                      <div
                        className={`progress-bar ${item.colorClass}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top Fraud Pattern Highlight Card */}
      <div className="col-lg-5">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Top Fraud Pattern</h5>

            {topPattern ? (
              <>
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div className="text-truncate">
                    <h5 className="fw-bold mb-1 text-truncate">
                      {topPattern.customerName}
                    </h5>
                    <p className="text-muted mb-0 small text-truncate">
                      {topPattern.customerEmail || topPattern.customerId}
                    </p>
                  </div>

                  <div
                    className="rounded-circle d-flex flex-column justify-content-center align-items-center text-white bg-danger shadow-sm"
                    style={{
                      width: "80px",
                      height: "80px",
                      minWidth: "80px",
                    }}
                  >
                    <strong className="fs-4 lh-1">{topPattern.fraudScore}</strong>
                    <small style={{ fontSize: "0.7rem" }}>SCORE</small>
                  </div>
                </div>

                <div className="border-top pt-2 mt-2">
                  <span className="fw-semibold small text-muted d-block mb-2">
                    Top Risk Signals:
                  </span>
                  <ul className="mb-0 ps-3">
                    {topPattern.riskReasons.slice(0, 4).map((reason, idx) => (
                      <li key={`${reason}-${idx}`} className="text-muted small mb-1">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="d-flex h-75 align-items-center justify-content-center">
                <p className="text-muted mb-0">No fraud pattern data available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnFraudDistributionCharts;