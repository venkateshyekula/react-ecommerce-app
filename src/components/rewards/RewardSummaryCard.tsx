import type { RewardTransaction } from "../../types/rewards";
import { getRewardBalance } from "../../utils/rewardUtils";

interface RewardSummaryCardProps {
  transactions: RewardTransaction[];
}

const RewardSummaryCard = ({ transactions }: RewardSummaryCardProps) => {
  const availablePoints = getRewardBalance(transactions);

  const earnedPoints = transactions
    .filter((transaction) => transaction.type === "EARNED")
    .reduce((sum, transaction) => sum + transaction.points, 0);

  const redeemedPoints = transactions
    .filter((transaction) => transaction.type === "REDEEMED")
    .reduce((sum, transaction) => sum + transaction.points, 0);

  return (
    <div className="reward-summary-card card border">
      <div className="card-body">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
          <div>
            <p className="text-muted mb-1">Available Reward Points</p>
            <h2 className="fw-bold mb-0 text-primary">{availablePoints}</h2>
          </div>

          <div className="reward-summary-icon bg-primary-subtle text-primary">
            <i className="bi bi-stars" />
          </div>
        </div>

        <div className="row g-3 mt-3">
          <div className="col-md-4">
            <div className="border rounded-4 p-3 bg-light">
              <span className="text-muted small fw-semibold">Earned</span>
              <h6 className="fw-bold mb-0">{earnedPoints}</h6>
            </div>
          </div>

          <div className="col-md-4">
            <div className="border rounded-4 p-3 bg-light">
              <span className="text-muted small fw-semibold">Redeemed</span>
              <h6 className="fw-bold mb-0">{redeemedPoints}</h6>
            </div>
          </div>

          <div className="col-md-4">
            <div className="border rounded-4 p-3 bg-light">
              <span className="text-muted small fw-semibold">Transactions</span>
              <h6 className="fw-bold mb-0">{transactions.length}</h6>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardSummaryCard;