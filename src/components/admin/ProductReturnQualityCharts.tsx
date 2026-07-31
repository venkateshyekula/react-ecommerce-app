import { productReturnQualityService } from "../../services/productReturnQualityService";
import type {
  ProductQualityRiskLevel,
  ProductReturnQualitySummary,
  ProductReturnReasonMetric
} from "../../types/productReturnQuality";

type ProductReturnQualityChartsProps = {
  summary: ProductReturnQualitySummary;
  reasonMetrics: ProductReturnReasonMetric[];
};

const getRiskBadgeClass = (riskLevel: ProductQualityRiskLevel): string => {
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

const ProductReturnQualityCharts = ({
  summary,
  reasonMetrics
}: ProductReturnQualityChartsProps) => {
  const riskCards: Array<{
    label: ProductQualityRiskLevel;
    count: number;
  }> = [
    {
      label: "LOW",
      count: summary.lowRiskProducts
    },
    {
      label: "MEDIUM",
      count: summary.mediumRiskProducts
    },
    {
      label: "HIGH",
      count: summary.highRiskProducts
    },
    {
      label: "CRITICAL",
      count: summary.criticalRiskProducts
    }
  ];

  const topReasons = reasonMetrics.slice(0, 6);
  const maxCount = Math.max(...topReasons.map((reason) => reason.count), 1);

  return (
    <div className="row g-3 mb-4">
      {/* Product Risk Distribution Card */}
      <div className="col-12 col-xl-5">
        <div className="card border-0 shadow-sm rounded-3 h-100">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Product Risk Distribution</h5>
            <p className="small text-muted mb-3">
              Products grouped by calculated quality and return risk level.
            </p>

            <div className="row g-2">
              {riskCards.map((risk) => (
                <div className="col-6" key={risk.label}>
                  <div className="border rounded-3 p-3 bg-light h-100 d-flex flex-column justify-content-between">
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
                      <span className="text-muted small">Products</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Product Return Reasons Chart Card */}
      <div className="col-12 col-xl-7">
        <div className="card border-0 shadow-sm rounded-3 h-100">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Top Product Return Reasons</h5>
            <p className="small text-muted mb-3">
              Most common return quality reasons and related refund exposure.
            </p>

            {topReasons.length === 0 ? (
              <div className="alert alert-light border mb-0 text-muted small">
                No product return reason metrics available.
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
                          {productReturnQualityService.formatCurrency(
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

export default ProductReturnQualityCharts;