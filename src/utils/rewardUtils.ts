import type { RewardRule, RewardTransaction } from "../types/rewards";

export const calculateEarnedRewardPoints = (
  orderAmount: number,
  rule?: RewardRule
): number => {
  if (!rule || !rule.active) {
    return 0;
  }

  if (orderAmount < rule.earnAmountThreshold) {
    return 0;
  }

  return Math.floor(orderAmount / rule.earnAmountThreshold) * rule.earnPointsPerAmount;
};

export const getRewardExpiryDate = (expiryDays: number): string | undefined => {
  if (expiryDays <= 0) {
    return undefined;
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  return expiryDate.toISOString();
};

export const getRewardBalance = (
  transactions: RewardTransaction[]
): number => {
  const now = new Date().getTime();

  return transactions.reduce((balance, transaction) => {
    if (
      transaction.expiresAt &&
      new Date(transaction.expiresAt).getTime() < now &&
      transaction.type === "EARNED"
    ) {
      return balance;
    }

    if (transaction.type === "EARNED" || transaction.type === "ADJUSTED") {
      return balance + transaction.points;
    }

    if (transaction.type === "REDEEMED" || transaction.type === "EXPIRED") {
      return balance - transaction.points;
    }

    return balance;
  }, 0);
};

export const calculateRewardWalletValue = (
  points: number,
  rule?: RewardRule
): number => {
  if (!rule || points <= 0) {
    return 0;
  }

  return points * rule.redeemPointValue;
};