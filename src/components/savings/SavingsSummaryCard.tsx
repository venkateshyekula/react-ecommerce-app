import { formatCurrency } from "../../utils/currencyFormatter";
import type { CustomerSavingsSummary } from "../../utils/savingsUtils";

interface SavingsSummaryCardProps {
  summary: CustomerSavingsSummary;
}

const SavingsSummaryCard = ({ summary }: SavingsSummaryCardProps) => {
  return (
    <div className="savings-summary-card card border shadow-sm rounded-4">
      <div className="card-body">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-4">
          <div>
            <p className="text-muted mb-1">Total Customer Benefits</p>

            <h1 className="fw-bold text-primary mb-2">
              {formatCurrency(summary.totalSavings)}
            </h1>

            <p className="text-muted mb-0">
              Total value received through coupons, wallet credits, rewards and
              completed refunds.
            </p>
          </div>

          <div className="savings-summary-icon bg-primary-subtle text-primary">
            <i className="bi bi-piggy-bank" />
          </div>
        </div>

        <div className="row g-3 mt-4">
          <div className="col-md-3">
            <div className="border rounded-4 p-3 bg-light">
              <span className="text-muted small fw-semibold">Coupons</span>
              <h6 className="fw-bold mb-0">
                {formatCurrency(summary.couponSavings)}
              </h6>
            </div>
          </div>

          <div className="col-md-3">
            <div className="border rounded-4 p-3 bg-light">
              <span className="text-muted small fw-semibold">Wallet Credits</span>
              <h6 className="fw-bold mb-0">
                {formatCurrency(summary.walletCreditsReceived)}
              </h6>
            </div>
          </div>

          <div className="col-md-3">
            <div className="border rounded-4 p-3 bg-light">
              <span className="text-muted small fw-semibold">Rewards</span>
              <h6 className="fw-bold mb-0">
                {formatCurrency(summary.rewardSavings)}
              </h6>
            </div>
          </div>

          <div className="col-md-3">
            <div className="border rounded-4 p-3 bg-light">
              <span className="text-muted small fw-semibold">Refunds</span>
              <h6 className="fw-bold mb-0">
                {formatCurrency(summary.refundAmount)}
              </h6>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsSummaryCard;