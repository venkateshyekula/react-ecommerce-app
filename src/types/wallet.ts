export type WalletTransactionType = "CREDIT" | "DEBIT";

export type WalletTransactionSource =
  | "REFUND"
  | "ORDER_PAYMENT"
  | "ADMIN_ADJUSTMENT"
  | "PROMOTION"
  | "STORE_CREDIT";

export interface WalletTransaction {
  id: string;
  transactionId: string;
  userId: string;
  type: WalletTransactionType;
  source: WalletTransactionSource;
  amount: number;
  description: string;
  createdAt: string;
  referenceId?: string;
  orderId?: string;
  refundId?: string;
  expiresAt?: string;
  createdBy?: string;
  adminRemarks?: string;
}

export interface CreateWalletTransactionPayload {
  transactionId: string;
  userId: string;
  type: WalletTransactionType;
  source: WalletTransactionSource;
  amount: number;
  description: string;
  createdAt: string;
  referenceId?: string;
  orderId?: string;
  refundId?: string;
  expiresAt?: string;
  createdBy?: string;
  adminRemarks?: string;
}