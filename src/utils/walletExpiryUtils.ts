import type { WalletTransaction } from "../types/wallet";

export interface ExpiringWalletCredit {
  transaction: WalletTransaction;
  daysLeft: number;
  expiresAt: string;
}

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export const getWalletCreditExpiryDaysLeft = (expiresAt?: string): number => {
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

export const getExpiringWalletCredits = (
  transactions: WalletTransaction[],
  thresholdDays = 7
): ExpiringWalletCredit[] => {
  return transactions
    .filter((transaction) => {
      if (transaction.type !== "CREDIT") {
        return false;
      }

      if (!transaction.expiresAt) {
        return false;
      }

      const daysLeft = getWalletCreditExpiryDaysLeft(transaction.expiresAt);

      return daysLeft >= 0 && daysLeft <= thresholdDays;
    })
    .map((transaction) => ({
      transaction,
      daysLeft: getWalletCreditExpiryDaysLeft(transaction.expiresAt),
      expiresAt: transaction.expiresAt as string
    }))
    .sort((first, second) => first.daysLeft - second.daysLeft);
};

export const getExpiredWalletCredits = (
  transactions: WalletTransaction[]
): WalletTransaction[] => {
  return transactions.filter((transaction) => {
    if (transaction.type !== "CREDIT" || !transaction.expiresAt) {
      return false;
    }

    return getWalletCreditExpiryDaysLeft(transaction.expiresAt) < 0;
  });
};