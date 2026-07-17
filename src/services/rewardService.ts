import { apiClient } from "./apiClient";
import type {
  CreateRewardRulePayload,
  CreateRewardTransactionPayload,
  RewardRule,
  RewardTransaction
} from "../types/rewards";

const REWARD_TRANSACTIONS_ENDPOINT = "/rewardTransactions";
const REWARD_RULES_ENDPOINT = "/rewardRules";

export const rewardService = {
  async getTransactions(): Promise<RewardTransaction[]> {
    return apiClient.get<RewardTransaction[]>(REWARD_TRANSACTIONS_ENDPOINT);
  },

  async getTransactionsByUserId(userId: string): Promise<RewardTransaction[]> {
    return apiClient.get<RewardTransaction[]>(
      `${REWARD_TRANSACTIONS_ENDPOINT}?userId=${encodeURIComponent(userId)}`
    );
  },

  async getTransactionsByReferenceId(
    referenceId: string
  ): Promise<RewardTransaction[]> {
    return apiClient.get<RewardTransaction[]>(
      `${REWARD_TRANSACTIONS_ENDPOINT}?referenceId=${encodeURIComponent(
        referenceId
      )}`
    );
  },

  async createTransaction(
    payload: CreateRewardTransactionPayload
  ): Promise<RewardTransaction> {
    const transaction: RewardTransaction = {
      id: `reward-db-${Date.now()}`,
      ...payload
    };

    return apiClient.post<RewardTransaction, RewardTransaction>(
      REWARD_TRANSACTIONS_ENDPOINT,
      transaction
    );
  },

  async getRules(): Promise<RewardRule[]> {
    return apiClient.get<RewardRule[]>(REWARD_RULES_ENDPOINT);
  },

  async createRule(payload: CreateRewardRulePayload): Promise<RewardRule> {
    const rule: RewardRule = {
      id: `reward-rule-${Date.now()}`,
      ...payload
    };

    return apiClient.post<RewardRule, RewardRule>(REWARD_RULES_ENDPOINT, rule);
  },

  async updateRule(
    id: string,
    data: Partial<RewardRule>
  ): Promise<RewardRule> {
    return apiClient.patch<RewardRule, Partial<RewardRule>>(
      `${REWARD_RULES_ENDPOINT}/${id}`,
      data
    );
  },

  async getTransactionsByUserIdAndReferenceId(
    userId: string,
    referenceId: string
  ): Promise<RewardTransaction[]> {
    return apiClient.get<RewardTransaction[]>(
      `${REWARD_TRANSACTIONS_ENDPOINT}?userId=${encodeURIComponent(
        userId
      )}&referenceId=${encodeURIComponent(referenceId)}`
    );
  },

  getActiveRule(rules: RewardRule[]): RewardRule | undefined {
    return rules.find((rule) => rule.active);
  },

  getAvailablePoints(transactions: RewardTransaction[]): number {
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
  }
};