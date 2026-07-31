import type {
  SellerPayoutRiskLevel,
  SellerPayoutSettlementSummary
} from "../../types/sellerPayoutSettlement";

type SellerPayoutSettlementChartsProps = {
  summary: SellerPayoutSettlementSummary;
};

const getRiskBadgeClass = (riskLevel: SellerPayoutRiskLevel): string => {
  if (riskLevel === "CRITICAL") {
    return "text-bg-danger";
  }

  if (riskLevel === "HIGH") {
    return "text-bg-warning text-dark";
  }

  if (riskLevel === "MEDIUM") {
    return "text-bg-info";
  }

  return "text-bg-success";
};

const SellerPayoutSettlementCharts = ({
  summary
}: SellerPayoutSettlementChartsProps) => {
  const riskCards: Array<{
    label: SellerPayoutRiskLevel;
    count: number;
  }> = [
    {
      label: "LOW",
      count: summary.lowRiskSellers
    },
    {
      label: "MEDIUM",
      count: summary.mediumRiskSellers
    },
    {
      label: "HIGH",
      count: summary.highRiskSellers
    },
    {
      label: "CRITICAL",
      count: summary.criticalRiskSellers
    }
  ];

  const settlementCards = [
    {
      label: "Pending",
      count: summary.pendingSettlements,
      className: "text-bg-warning text-dark"
    },
    {
      label: "Under Review",
      count: summary.underReviewSettlements,
      className: "text-bg-info"
    },
    {
      label: "Approved",
      count: summary.approvedSettlements,
      className: "text-bg-primary"
    },
    {
      label: "Settled",
      count: summary.settledSettlements,
      className: "text-bg-success"
    },
    {
      label: "On Hold",
      count: summary.onHoldSettlements,
      className: "text-bg-danger"
    },
    {
      label: "Rejected",
      count: summary.rejectedSettlements,
      className: "text-bg-secondary"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {/* Risk Distribution Card */}
      <div className="col-12 col-xl-5">
        <div className="card border-0 shadow-sm rounded-3 h-100">
          <div className="card-body p-4 d-flex flex-column">
            <h5 className="fw-bold mb-1">Seller Payout Risk Distribution</h5>
            <p className="small text-muted mb-3">
              Sellers grouped by payout liability risk.
            </p>

            <div className="row g-2 flex-grow-1">
              {riskCards.map((risk) => (
                <div className="col-6" key={risk.label}>
                  <div className="border rounded-3 p-3 bg-light h-100 d-flex flex-column justify-content-between">
                    <div>
                      <span className={`badge align-self-start ${getRiskBadgeClass(risk.label)}`}>
                        {risk.label}
                      </span>
                    </div>
                    <div className="mt-2">
                      <strong className="d-block fs-4 text-dark">{risk.count}</strong>
                      <span className="text-muted small">Sellers</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settlement Status Card */}
      <div className="col-12 col-xl-7">
        <div className="card border-0 shadow-sm rounded-3 h-100">
          <div className="card-body p-4 d-flex flex-column">
            <h5 className="fw-bold mb-1">Settlement Status Overview</h5>
            <p className="small text-muted mb-3">
              Current payout settlement status across seller accounts.
            </p>

            <div className="row g-2 flex-grow-1">
              {settlementCards.map((status) => (
                <div className="col-6 col-md-4" key={status.label}>
                  <div className="border rounded-3 p-3 bg-light h-100 d-flex flex-column justify-content-between">
                    <div>
                      <span className={`badge align-self-start ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-2">
                      <strong className="d-block fs-4 text-dark">
                        {status.count}
                      </strong>
                      <span className="text-muted small">Settlements</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerPayoutSettlementCharts;