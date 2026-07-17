import type { Order } from "../types/order";
import type { RewardTransaction } from "../types/rewards";
import type { WalletTransaction } from "../types/wallet";
import type { RefundRecord } from "../types/refund";

export interface CustomerSavingsSummary {
  couponSavings: number;
  walletCreditsReceived: number;
  walletUsed: number;
  rewardPointsEarned: number;
  rewardPointsRedeemed: number;
  rewardSavings: number;
  refundAmount: number;
  totalSavings: number;
}

export const calculateCustomerSavingsSummary = ({
  orders,
  walletTransactions,
  rewardTransactions,
  refunds
}: {
  orders: Order[];
  walletTransactions: WalletTransaction[];
  rewardTransactions: RewardTransaction[];
  refunds: RefundRecord[];
}): CustomerSavingsSummary => {
  const couponSavings = orders.reduce((sum, order) => {
    return sum + (order.discountAmount ?? 0);
  }, 0);

  const walletCreditsReceived = walletTransactions
    .filter((transaction) => transaction.type === "CREDIT")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const walletUsed = walletTransactions
    .filter(
      (transaction) =>
        transaction.type === "DEBIT" && transaction.source === "ORDER_PAYMENT"
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const rewardPointsEarned = rewardTransactions
    .filter(
      (transaction) =>
        transaction.type === "EARNED" || transaction.type === "ADJUSTED"
    )
    .reduce((sum, transaction) => sum + transaction.points, 0);

  const rewardPointsRedeemed = rewardTransactions
    .filter((transaction) => transaction.type === "REDEEMED")
    .reduce((sum, transaction) => sum + transaction.points, 0);

  const rewardSavings = orders.reduce((sum, order) => {
    return sum + (order.rewardRedemption?.rewardDiscountAmount ?? 0);
  }, 0);

  const refundAmount = refunds
    .filter((refund) => refund.status === "COMPLETED")
    .reduce((sum, refund) => sum + refund.amount, 0);

  const totalSavings =
    couponSavings + walletCreditsReceived + rewardSavings + refundAmount;

  return {
    couponSavings,
    walletCreditsReceived,
    walletUsed,
    rewardPointsEarned,
    rewardPointsRedeemed,
    rewardSavings,
    refundAmount,
    totalSavings
  };
};