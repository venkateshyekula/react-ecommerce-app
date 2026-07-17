export type RewardTransactionType = "EARNED" | "REDEEMED" | "EXPIRED" | "ADJUSTED";

export type RewardTransactionSource =
  | "ORDER"
  | "WALLET"
  | "PROMOTION"
  | "ADMIN_ADJUSTMENT"
  | "EXPIRY";

export interface RewardTransaction {
  id: string;
  transactionId: string;
  userId: string;
  type: RewardTransactionType;
  source: RewardTransactionSource;
  points: number;
  description: string;
  createdAt: string;
  orderId?: string;
  referenceId?: string;
  expiresAt?: string;
  createdBy?: string;
  adminRemarks?: string;
}

export interface CreateRewardTransactionPayload {
  transactionId: string;
  userId: string;
  type: RewardTransactionType;
  source: RewardTransactionSource;
  points: number;
  description: string;
  createdAt: string;
  orderId?: string;
  referenceId?: string;
  expiresAt?: string;
  createdBy?: string;
  adminRemarks?: string;
}

export interface RewardRule {
  id: string;
  ruleName: string;
  earnPointsPerAmount: number;
  earnAmountThreshold: number;
  redeemPointValue: number;
  minRedeemPoints: number;
  maxRedeemPointsPerOrder: number;
  expiryDays: number;
  active: boolean;
}

export interface CreateRewardRulePayload {
  ruleName: string;
  earnPointsPerAmount: number;
  earnAmountThreshold: number;
  redeemPointValue: number;
  minRedeemPoints: number;
  maxRedeemPointsPerOrder: number;
  expiryDays: number;
  active: boolean;
}