import { apiClient } from "./apiClient";
import type { PaymentTransaction } from "../types/payment";

const PAYMENT_TRANSACTIONS_ENDPOINT = "/paymentTransactions";

const sortByLatest = (
  transactions: PaymentTransaction[]
): PaymentTransaction[] => {
  return [...transactions].sort(
    (firstTransaction, secondTransaction) =>
      new Date(secondTransaction.createdAt).getTime() -
      new Date(firstTransaction.createdAt).getTime()
  );
};

export const paymentTransactionService = {
  getTransactions: async (): Promise<PaymentTransaction[]> => {
    const transactions = await apiClient.get<PaymentTransaction[]>(
      PAYMENT_TRANSACTIONS_ENDPOINT
    );

    return sortByLatest(transactions);
  },

  getTransactionByPaymentId: async (
    paymentId: string
  ): Promise<PaymentTransaction | null> => {
    const transactions = await apiClient.get<PaymentTransaction[]>(
      `${PAYMENT_TRANSACTIONS_ENDPOINT}?paymentId=${encodeURIComponent(
        paymentId
      )}`
    );

    return transactions[0] ?? null;
  },

  getTransactionsByUserId: async (
    userId: string
  ): Promise<PaymentTransaction[]> => {
    const transactions = await apiClient.get<PaymentTransaction[]>(
      `${PAYMENT_TRANSACTIONS_ENDPOINT}?userId=${encodeURIComponent(userId)}`
    );

    return sortByLatest(transactions);
  },

  getTransactionsByOrderId: async (
    orderId: string
  ): Promise<PaymentTransaction[]> => {
    const transactions = await apiClient.get<PaymentTransaction[]>(
      `${PAYMENT_TRANSACTIONS_ENDPOINT}?orderId=${encodeURIComponent(orderId)}`
    );

    return sortByLatest(transactions);
  },

  getTransactionsByCheckoutReferenceId: async (
    checkoutReferenceId: string
  ): Promise<PaymentTransaction[]> => {
    const transactions = await apiClient.get<PaymentTransaction[]>(
      `${PAYMENT_TRANSACTIONS_ENDPOINT}?checkoutReferenceId=${encodeURIComponent(
        checkoutReferenceId
      )}`
    );

    return sortByLatest(transactions);
  },

  createTransaction: async (
    transaction: PaymentTransaction
  ): Promise<PaymentTransaction> => {
    return apiClient.post<PaymentTransaction, PaymentTransaction>(
      PAYMENT_TRANSACTIONS_ENDPOINT,
      transaction
    );
  },

  updateTransaction: async (
    transactionDbId: string,
    payload: Partial<PaymentTransaction>
  ): Promise<PaymentTransaction> => {
    return apiClient.patch<PaymentTransaction, Partial<PaymentTransaction>>(
      `${PAYMENT_TRANSACTIONS_ENDPOINT}/${encodeURIComponent(transactionDbId)}`,
      {
        ...payload,
        updatedAt: new Date().toISOString()
      }
    );
  },

  linkTransactionToOrder: async ({
    transactionDbId,
    orderId
  }: {
    transactionDbId: string;
    orderId: string;
  }): Promise<PaymentTransaction> => {
    return paymentTransactionService.updateTransaction(transactionDbId, {
      orderId,
      status: "SUCCESS",
      gatewayStatus: "CAPTURED",
      issueFlag: null,
      refundStatus: "NOT_REQUIRED",
      refundId: null
    });
  },

  markRefundRequired: async ({
    transactionDbId,
    refundId,
    issueFlag = "ORDER_NOT_CREATED"
  }: {
    transactionDbId: string;
    refundId?: string | null;
    issueFlag?: PaymentTransaction["issueFlag"];
  }): Promise<PaymentTransaction> => {
    return paymentTransactionService.updateTransaction(transactionDbId, {
      status: "REFUND_REQUIRED",
      gatewayStatus: "CAPTURED",
      issueFlag,
      refundStatus: "PENDING_REVIEW",
      refundId: refundId ?? null
    });
  },

  markRefundInitiated: async ({
    transactionDbId,
    refundId
  }: {
    transactionDbId: string;
    refundId?: string | null;
  }): Promise<PaymentTransaction> => {
    return paymentTransactionService.updateTransaction(transactionDbId, {
      status: "REFUND_INITIATED",
      gatewayStatus: "REFUND_REQUESTED",
      refundStatus: "INITIATED",
      refundId: refundId ?? null
    });
  },

  markRefundCompleted: async ({
    transactionDbId,
    refundId
  }: {
    transactionDbId: string;
    refundId?: string | null;
  }): Promise<PaymentTransaction> => {
    return paymentTransactionService.updateTransaction(transactionDbId, {
      status: "REFUNDED",
      gatewayStatus: "REFUND_PROCESSED",
      refundStatus: "COMPLETED",
      refundId: refundId ?? null
    });
  }
};