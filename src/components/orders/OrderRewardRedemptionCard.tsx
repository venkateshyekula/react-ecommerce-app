import type { RewardRedemptionSnapshot } from "../../types/order";
import { formatCurrency } from "../../utils/currencyFormatter";

interface OrderRewardRedemptionCardProps {
  rewardRedemption?: RewardRedemptionSnapshot | null;
}

const OrderRewardRedemptionCard = ({
  rewardRedemption
}: OrderRewardRedemptionCardProps) => {
  if (!rewardRedemption?.rewardsApplied) {
    return null;
  }

  return (
    <div className="order-reward-redemption-card">
      <div className="order-reward-redemption-icon">
        <i className="bi bi-stars" />
      </div>

      <div className="flex-grow-1">
        <h6 className="fw-bold mb-1">Reward Points Applied</h6>

        <p className="text-muted small mb-2">
          Reward points were redeemed for this order.
        </p>

        <div className="order-reward-redemption-tags">
          <span>{rewardRedemption.pointsUsed} points used</span>

          <span>
            Discount: {formatCurrency(rewardRedemption.rewardDiscountAmount)}
          </span>

          <span>
            Payable after rewards:{" "}
            {formatCurrency(rewardRedemption.payableAmountAfterRewards)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderRewardRedemptionCard;