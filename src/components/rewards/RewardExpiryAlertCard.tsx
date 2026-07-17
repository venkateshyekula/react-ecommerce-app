import type { ExpiringRewardTransaction } from "../../utils/rewardExpiryUtils";

interface RewardExpiryAlertCardProps {
  expiringRewards: ExpiringRewardTransaction[];
}

const formatExpiryDate = (dateValue: string): string => {
  return new Date(dateValue).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

const RewardExpiryAlertCard = ({
  expiringRewards
}: RewardExpiryAlertCardProps) => {
  if (expiringRewards.length === 0) {
    return null;
  }

  const totalExpiringPoints = expiringRewards.reduce(
    (sum, item) => sum + item.transaction.points,
    0
  );

  return (
    <div className="reward-expiry-alert-card">
      <div className="reward-expiry-alert-icon">
        <i className="bi bi-hourglass-split" />
      </div>

      <div className="flex-grow-1">
        <h5 className="fw-bold mb-1">Reward points expiring soon</h5>

        <p className="text-muted mb-3">
          {totalExpiringPoints} reward points are expiring soon. Redeem them
          before expiry to avoid losing points.
        </p>

        <div className="reward-expiry-list">
          {expiringRewards.map(({ transaction, daysLeft, expiresAt }) => (
            <div className="reward-expiry-item" key={transaction.id}>
              <div>
                <strong>{transaction.points} points</strong>

                <p className="text-muted small mb-0">
                  {transaction.description}
                </p>
              </div>

              <span className="reward-expiry-pill">
                {daysLeft === 0
                  ? "Expires today"
                  : `${daysLeft} day${daysLeft > 1 ? "s" : ""} left`}
                <small>{formatExpiryDate(expiresAt)}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RewardExpiryAlertCard;