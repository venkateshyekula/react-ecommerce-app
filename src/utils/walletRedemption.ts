export interface WalletRedemptionResult {
  walletApplied: boolean;
  walletAmountUsed: number;
  payableAmount: number;
}

export const calculateWalletRedemption = (
  walletBalance: number,
  orderAmount: number,
  requestedWalletAmount: number
): WalletRedemptionResult => {
  const safeWalletBalance = Math.max(0, walletBalance);
  const safeOrderAmount = Math.max(0, orderAmount);
  const safeRequestedAmount = Math.max(0, requestedWalletAmount);

  const walletAmountUsed = Math.min(
    safeWalletBalance,
    safeOrderAmount,
    safeRequestedAmount
  );

  const payableAmount = Math.max(0, safeOrderAmount - walletAmountUsed);

  return {
    walletApplied: walletAmountUsed > 0,
    walletAmountUsed,
    payableAmount
  };
};