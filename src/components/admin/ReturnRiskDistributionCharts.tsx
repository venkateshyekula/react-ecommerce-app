import { returnAnalyticsService } from "../../services/returnAnalyticsRiskService";
import type { ReturnReasonTrendRow } from "../../types/returnAnalyticsRisk";

type ReturnAnalyticsChartsProps = {
  reasonTrends: ReturnReasonTrendRow[];
};

const ReturnAnalyticsCharts = ({ reasonTrends }: ReturnAnalyticsChartsProps) => {
  const topReasons = reasonTrends.slice(0, 6);
  const maxCount = Math.max(...topReasons.map((reason) => reason.count), 1);

  return (
    <div className="card border-0 rounded-4 shadow-sm mb-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-1">Return Reason Trend</h5>
        <p className="text-muted small mb-3">
          Top return reasons by number of return requests and associated refund value.
        </p>

        {topReasons.length === 0 ? (
          <div className="alert alert-light border mb-0 text-center text-muted">
            No return reason trend data available.
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {topReasons.map((reason) => {
              const percentage = Math.round((reason.count / maxCount) * 100);
              const widthPercent = Math.max(percentage, 8);

              return (
                <div key={reason.reason}>
                  <div className="d-flex justify-content-between align-items-center gap-3 mb-1">
                    <div 
                      className="fw-semibold small text-truncate" 
                      title={reason.reason}
                      style={{ maxWidth: "60%" }}
                    >
                      {reason.reason}
                    </div>
                    <div className="small text-muted text-end flex-shrink-0">
                      <strong>{reason.count}</strong> returns ·{" "}
                      <span className="text-dark">
                        {returnAnalyticsService.formatCurrency(reason.refundValue)}
                      </span>
                    </div>
                  </div>

                  <div 
                    className="progress" 
                    style={{ height: 9 }}
                    role="progressbar"
                    aria-label={reason.reason}
                    aria-valuenow={reason.count}
                    aria-valuemin={0}
                    aria-valuemax={maxCount}
                  >
                    <div
                      className="progress-bar bg-primary rounded-pill"
                      style={{ 
                        width: `${widthPercent}%`,
                        transition: "width 0.4s ease-in-out" 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnAnalyticsCharts;