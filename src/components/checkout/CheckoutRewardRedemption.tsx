import { useMemo, useState } from "react";
import Button from "../common/Button";
import type { RewardRule, RewardTransaction } from "../../types/rewards";
import { formatCurrency } from "../../utils/currencyFormatter";
import { getRewardBalance } from "../../utils/rewardUtils";
import { calculateRewardRedemption } from "../../utils/rewardRedemption";

interface CheckoutRewardRedemptionProps {
  transactions: RewardTransaction[];
  activeRule?: RewardRule;
  orderAmount: number;
  appliedPoints: number;
  onApplyRewards: (points: number) => void;
  onRemoveRewards: () => void;
}

const CheckoutRewardRedemption = ({
  transactions,
  activeRule,
  orderAmount,
  appliedPoints,
  onApplyRewards,
  onRemoveRewards
}: CheckoutRewardRedemptionProps) => {
  const [pointsInput, setPointsInput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const availablePoints = useMemo(() => {
    return getRewardBalance(transactions);
  }, [transactions]);

  const maxRedeemablePoints = useMemo(() => {
    if (!activeRule) {
      return 0;
    }

    const maxPointsByAmount = Math.floor(orderAmount / activeRule.redeemPointValue);

    return Math.min(
      availablePoints,
      activeRule.maxRedeemPointsPerOrder,
      maxPointsByAmount
    );
  }, [activeRule, availablePoints, orderAmount]);

  const redemptionPreview = calculateRewardRedemption(
    availablePoints,
    orderAmount,
    Number(pointsInput || 0),
    activeRule
  );

  const handleApplyRewards = (): void => {
    setErrorMessage("");

    if (!activeRule) {
      setErrorMessage("Reward redemption is currently unavailable.");
      return;
    }

    if (availablePoints <= 0) {
      setErrorMessage("No reward points available.");
      return;
    }

    const requestedPoints = Number(pointsInput || 0);

    if (requestedPoints <= 0) {
      const defaultPoints = Math.min(
        maxRedeemablePoints,
        Math.max(activeRule.minRedeemPoints, 0)
      );

      if (defaultPoints <= 0) {
        setErrorMessage("No reward points can be redeemed for this order.");
        return;
      }

      const defaultResult = calculateRewardRedemption(
        availablePoints,
        orderAmount,
        defaultPoints,
        activeRule
      );

      if (defaultResult.errorMessage) {
        setErrorMessage(defaultResult.errorMessage);
        return;
      }

      setPointsInput(String(defaultResult.pointsUsed));
      onApplyRewards(defaultResult.pointsUsed);
      return;
    }

    if (redemptionPreview.errorMessage) {
      setErrorMessage(redemptionPreview.errorMessage);
      return;
    }

    onApplyRewards(redemptionPreview.pointsUsed);
    setPointsInput(String(redemptionPreview.pointsUsed));
  };

  const handleUseMaximumRewards = (): void => {
    setErrorMessage("");

    if (!activeRule || maxRedeemablePoints <= 0) {
      setErrorMessage("No reward points can be redeemed for this order.");
      return;
    }

    const result = calculateRewardRedemption(
      availablePoints,
      orderAmount,
      maxRedeemablePoints,
      activeRule
    );

    if (result.errorMessage) {
      setErrorMessage(result.errorMessage);
      return;
    }

    setPointsInput(String(result.pointsUsed));
    onApplyRewards(result.pointsUsed);
  };

  const handleRemoveRewards = (): void => {
    setPointsInput("");
    setErrorMessage("");
    onRemoveRewards();
  };

  if (!activeRule || availablePoints <= 0) {
    return (
      <div className="checkout-reward-card disabled">
        <div className="checkout-reward-icon">
          <i className="bi bi-stars" />
        </div>

        <div>
          <h6 className="fw-bold mb-1">Reward Points</h6>
          <p className="text-muted small mb-0">
            No reward points available for this order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-reward-card">
      <div className="d-flex align-items-start gap-3">
        <div className="checkout-reward-icon">
          <i className="bi bi-stars" />
        </div>

        <div className="flex-grow-1">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
            <div>
              <h6 className="fw-bold mb-1">Use Reward Points</h6>
              <p className="text-muted small mb-0">
                Available: <strong>{availablePoints} points</strong>
              </p>
            </div>
            <div>
              <p className="checkout-reward-max-pill">
              Max usable: {maxRedeemablePoints} pts
            </p>
            </div>
          </div>

          {appliedPoints > 0 ? (
            <div className="checkout-reward-applied">
              <div>
                <strong>{appliedPoints} points applied</strong>

                <p className="text-muted small mb-0">
                  Discount:{" "}
                  {formatCurrency(appliedPoints * activeRule.redeemPointValue)}
                </p>
              </div>

              <Button
                type="button"
                variant="outline-danger"
                className="btn-sm"
                onClick={handleRemoveRewards}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <div className="input-group">
                <input
                  type="number"
                  min={0}
                  max={maxRedeemablePoints}
                  className="form-control"
                  placeholder={`Enter points, min ${activeRule.minRedeemPoints}`}
                  value={pointsInput}
                  onChange={(event) => {
                    setPointsInput(event.target.value);
                    setErrorMessage("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleApplyRewards();
                    }
                  }}
                />

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleApplyRewards}
                >
                  Apply
                </Button>
              </div>

              <button
                type="button"
                className="checkout-reward-use-max-btn"
                onClick={handleUseMaximumRewards}
              >
                Use maximum reward points
              </button>

              {errorMessage ? (
                <p className="small text-danger fw-semibold mt-2 mb-0">
                  {errorMessage}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutRewardRedemption;