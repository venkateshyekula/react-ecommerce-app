import { apiClient } from "./apiClient";
import type {
  CreateWalletTransactionPayload,
  WalletTransaction
} from "../types/wallet";

const WALLET_TRANSACTIONS_ENDPOINT = "/walletTransactions";

export const walletService = {
  async getTransactions(): Promise<WalletTransaction[]> {
    return apiClient.get<WalletTransaction[]>(WALLET_TRANSACTIONS_ENDPOINT);
  },

  async getTransactionsByUserId(userId: string): Promise<WalletTransaction[]> {
    return apiClient.get<WalletTransaction[]>(
      `${WALLET_TRANSACTIONS_ENDPOINT}?userId=${encodeURIComponent(userId)}`
    );
  },

  async getTransactionsByReferenceId(
    referenceId: string
  ): Promise<WalletTransaction[]> {
    return apiClient.get<WalletTransaction[]>(
      `${WALLET_TRANSACTIONS_ENDPOINT}?referenceId=${encodeURIComponent(
        referenceId
      )}`
    );
  },

  async getTransactionsByOrderId(orderId: string): Promise<WalletTransaction[]> {
    return apiClient.get<WalletTransaction[]>(
      `${WALLET_TRANSACTIONS_ENDPOINT}?orderId=${encodeURIComponent(orderId)}`
    );
  },

  async createTransaction(
    payload: CreateWalletTransactionPayload
  ): Promise<WalletTransaction> {
    const transaction: WalletTransaction = {
      id: `wallet-db-${Date.now()}`,
      ...payload
    };

    return apiClient.post<WalletTransaction, WalletTransaction>(
      WALLET_TRANSACTIONS_ENDPOINT,
      transaction
    );
  },

  async updateTransaction(
    id: string,
    data: Partial<WalletTransaction>
  ): Promise<WalletTransaction> {
    return apiClient.patch<WalletTransaction, Partial<WalletTransaction>>(
      `${WALLET_TRANSACTIONS_ENDPOINT}/${id}`,
      data
    );
  },

  getBalance(transactions: WalletTransaction[]): number {
    const now = new Date().getTime();

    return transactions.reduce((balance, transaction) => {
      if (
        transaction.expiresAt &&
        new Date(transaction.expiresAt).getTime() < now
      ) {
        return balance;
      }

      if (transaction.type === "CREDIT") {
        return balance + transaction.amount;
      }

      return balance - transaction.amount;
    }, 0);
  }
};