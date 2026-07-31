import { useMemo } from "react";
import { sellerRiskComplianceService } from "../../services/sellerRiskComplianceService";
import type {
  SellerComplianceRiskLevel,
  SellerReturnReasonMetric,
  SellerRiskComplianceSummary
} from "../../types/sellerRiskCompliance";

type SellerRiskComplianceChartsProps = {
  summary: SellerRiskComplianceSummary;
  reasonMetrics: SellerReturnReasonMetric[];
};

const getRiskBadgeClass = (riskLevel: SellerComplianceRiskLevel): string => {
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

const SellerRiskComplianceCharts = ({
  summary,
  reasonMetrics
}: SellerRiskComplianceChartsProps) => {
  const riskCards = useMemo(
    (): Array<{ label: SellerComplianceRiskLevel; count: number }> => [
      { label: "LOW", count: summary.lowRiskSellers },
      { label: "MEDIUM", count: summary.mediumRiskSellers },
      { label: "HIGH", count: summary.highRiskSellers },
      { label: "CRITICAL", count: summary.criticalRiskSellers }
    ],
    [summary]
  );

  const topReasons = useMemo(() => reasonMetrics.slice(0, 6), [reasonMetrics]);

  const maxCount = useMemo(
    () => Math.max(...topReasons.map((reason) => reason.count), 1),
    [topReasons]
  );

  return (
    <div className="row g-3 mb-4">
      {/* Seller Risk Distribution Card */}
      <div className="col-12 col-xl-5">
        <div className="card border-0 shadow-sm rounded-3 h-100">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Seller Risk Distribution</h5>
            <p className="small text-muted mb-3">
              Sellers grouped by risk level based on returns, QC failures,
              disputes, and refund liability.
            </p>

            <div className="row g-2">
              {riskCards.map((risk) => (
                <div className="col-6" key={risk.label}>
                  <div className="border rounded-3 p-3 bg-light h-100">
                    <span className={`badge align-self-start ${getRiskBadgeClass(risk.label)}`}>
                      {risk.label}
                    </span>
                    <strong className="d-block fs-4 mt-2">{risk.count}</strong>
                    <span className="text-muted small">Sellers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Return Reasons Impacting Sellers Card */}
      <div className="col-12 col-xl-7">
        <div className="card border-0 shadow-sm rounded-3 h-100">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Return Reasons Impacting Sellers</h5>
            <p className="small text-muted mb-3">
              Most common return reasons contributing to seller compliance risk.
            </p>

            {topReasons.length === 0 ? (
              <div className="alert alert-light border mb-0">
                No seller return reason metrics available.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {topReasons.map((reason) => {
                  const percentage = Math.round((reason.count / maxCount) * 100);
                  const width = Math.max(percentage, 8);

                  return (
                    <div key={reason.reason}>
                      <div className="d-flex justify-content-between gap-2 mb-1">
                        <div className="small fw-semibold text-truncate">
                          {reason.reason}
                        </div>
                        <div className="small text-muted text-nowrap">
                          {reason.count} ·{" "}
                          {sellerRiskComplianceService.formatCurrency(
                            reason.refundAmount
                          )}
                        </div>
                      </div>

                      <div className="progress" style={{ height: 10 }}>
                        <div
                          className="progress-bar bg-primary"
                          role="progressbar"
                          style={{ width: `${width}%` }}
                          aria-valuenow={percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Impact percentage for ${reason.reason}`}
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

export default SellerRiskComplianceCharts;