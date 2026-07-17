import type { RewardRule } from "../types/rewards";

export interface RewardRedemptionResult {
  rewardsApplied: boolean;
  pointsUsed: number;
  rewardDiscountAmount: number;
  payableAmountAfterRewards: number;
  errorMessage?: string;
}

export const calculateRewardRedemption = (
  availablePoints: number,
  orderAmount: number,
  requestedPoints: number,
  activeRule?: RewardRule
): RewardRedemptionResult => {
  const safeAvailablePoints = Math.max(0, availablePoints);
  const safeOrderAmount = Math.max(0, orderAmount);
  const safeRequestedPoints = Math.max(0, requestedPoints);

  if (!activeRule || !activeRule.active) {
    return {
      rewardsApplied: false,
      pointsUsed: 0,
      rewardDiscountAmount: 0,
      payableAmountAfterRewards: safeOrderAmount,
      errorMessage: "Reward redemption is currently unavailable."
    };
  }

  if (safeRequestedPoints <= 0) {
    return {
      rewardsApplied: false,
      pointsUsed: 0,
      rewardDiscountAmount: 0,
      payableAmountAfterRewards: safeOrderAmount
    };
  }

  if (safeAvailablePoints < activeRule.minRedeemPoints) {
    return {
      rewardsApplied: false,
      pointsUsed: 0,
      rewardDiscountAmount: 0,
      payableAmountAfterRewards: safeOrderAmount,
      errorMessage: `Minimum ${activeRule.minRedeemPoints} points required to redeem.`
    };
  }

  if (safeRequestedPoints < activeRule.minRedeemPoints) {
    return {
      rewardsApplied: false,
      pointsUsed: 0,
      rewardDiscountAmount: 0,
      payableAmountAfterRewards: safeOrderAmount,
      errorMessage: `Please redeem at least ${activeRule.minRedeemPoints} points.`
    };
  }

  const maxPointsByOrderAmount = Math.floor(
    safeOrderAmount / activeRule.redeemPointValue
  );

  const pointsUsed = Math.min(
    safeRequestedPoints,
    safeAvailablePoints,
    activeRule.maxRedeemPointsPerOrder,
    maxPointsByOrderAmount
  );

  const rewardDiscountAmount = Math.min(
    safeOrderAmount,
    Number((pointsUsed * activeRule.redeemPointValue).toFixed(2))
  );

  const payableAmountAfterRewards = Math.max(
    0,
    safeOrderAmount - rewardDiscountAmount
  );

  return {
    rewardsApplied: pointsUsed > 0,
    pointsUsed,
    rewardDiscountAmount,
    payableAmountAfterRewards
  };
};