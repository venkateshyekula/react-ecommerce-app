import React from "react";
import { ReturnFraudPatternSummary } from "../../types/returnFraudPattern";

interface ReturnFraudSummaryCardsProps {
  summary?: ReturnFraudPatternSummary;
}

const formatCurrency = (value: number = 0): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const ReturnFraudSummaryCards: React.FC<ReturnFraudSummaryCardsProps> = ({
  summary,
}) => {
  // Safe fallbacks in case summary is null/undefined during initial fetch
  const totalFlagged = summary?.totalFlaggedPatterns ?? 0;
  const highRisk = (summary?.highRiskPatterns ?? 0) + (summary?.criticalRiskPatterns ?? 0);
  const underReview = summary?.customersUnderReview ?? 0;
  const refundExposure = summary?.totalRefundExposure ?? 0;
  const avgScore = summary?.averageFraudScore ? summary.averageFraudScore.toFixed(1) : "0";

  return (
    <div className="row g-3 mb-4">
      {/* Total Flagged */}
      <div className="col-xl col-md-4 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <p className="text-muted fw-semibold mb-1">Flagged Patterns</p>
            <h3 className="fw-bold mb-1">{totalFlagged}</h3>
            <small className="text-muted">Detected by fraud intelligence</small>
          </div>
        </div>
      </div>

      {/* High / Critical Risk */}
      <div className="col-xl col-md-4 col-sm-6">
        <div className="card border-0 shadow-sm h-100 bg-danger-subtle border-start border-danger border-3">
          <div className="card-body">
            <p className="text-danger-emphasis fw-semibold mb-1">High/Critical Risk</p>
            <h3 className="fw-bold mb-1 text-danger">{highRisk}</h3>
            <small className="text-danger-emphasis">Needs fraud review</small>
          </div>
        </div>
      </div>

      {/* Customers Under Review */}
      <div className="col-xl col-md-4 col-sm-6">
        <div className="card border-0 shadow-sm h-100 bg-warning-subtle border-start border-warning border-3">
          <div className="card-body">
            <p className="text-warning-emphasis fw-semibold mb-1">Customers Under Review</p>
            <h3 className="fw-bold mb-1 text-warning-emphasis">{underReview}</h3>
            <small className="text-warning-emphasis">Manual investigation queue</small>
          </div>
        </div>
      </div>

      {/* Refund Exposure */}
      <div className="col-xl col-md-4 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <p className="text-muted fw-semibold mb-1">Refund Exposure</p>
            <h3 className="fw-bold mb-1">{formatCurrency(refundExposure)}</h3>
            <small className="text-muted">Linked to flagged returns</small>
          </div>
        </div>
      </div>

      {/* Average Fraud Score */}
      <div className="col-xl col-md-4 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <p className="text-muted fw-semibold mb-1">Average Fraud Score</p>
            <h3 className="fw-bold mb-1">
              {avgScore} <span className="fs-6 text-muted fw-normal">/ 100</span>
            </h3>
            <small className="text-muted">Across all flagged patterns</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnFraudSummaryCards;