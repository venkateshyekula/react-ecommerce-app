import type { RewardTransaction } from "../types/rewards";

export interface ExpiringRewardTransaction {
  transaction: RewardTransaction;
  daysLeft: number;
  expiresAt: string;
}

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export const getRewardExpiryDaysLeft = (expiresAt?: string): number => {
  if (!expiresAt) {
    return Number.POSITIVE_INFINITY;
  }

  const expiryDate = new Date(expiresAt);
  const today = new Date();

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const startOfExpiryDate = new Date(
    expiryDate.getFullYear(),
    expiryDate.getMonth(),
    expiryDate.getDate()
  );

  return Math.ceil(
    (startOfExpiryDate.getTime() - startOfToday.getTime()) / millisecondsPerDay
  );
};

export const getExpiringRewardTransactions = (
  transactions: RewardTransaction[],
  thresholdDays = 7
): ExpiringRewardTransaction[] => {
  return transactions
    .filter((transaction) => {
      if (transaction.type !== "EARNED") {
        return false;
      }

      if (!transaction.expiresAt) {
        return false;
      }

      const daysLeft = getRewardExpiryDaysLeft(transaction.expiresAt);

      return daysLeft >= 0 && daysLeft <= thresholdDays;
    })
    .map((transaction) => ({
      transaction,
      daysLeft: getRewardExpiryDaysLeft(transaction.expiresAt),
      expiresAt: transaction.expiresAt as string
    }))
    .sort((first, second) => first.daysLeft - second.daysLeft);
};

export const getExpiredRewardTransactions = (
  transactions: RewardTransaction[]
): RewardTransaction[] => {
  return transactions.filter((transaction) => {
    if (transaction.type !== "EARNED" || !transaction.expiresAt) {
      return false;
    }

    return getRewardExpiryDaysLeft(transaction.expiresAt) < 0;
  });
};

export const getRewardExpiryReferenceId = (
  transaction: RewardTransaction
): string => {
  return `reward-expiry-${transaction.id}`;
};

export const getRewardExpiryNotificationReferenceId = (
  transaction: RewardTransaction
): string => {
  return `reward-expiry-alert-${transaction.id}`;
};