import { paymentTransactionService } from "./paymentTransactionService";
import { refundService } from "./refundService";
import type {
  PaymentGatewayStatus,
  PaymentTransaction
} from "../types/payment";
import {
  createInitialPaymentTransaction,
  mapGatewayStatusToPaymentStatus
} from "../utils/paymentGatewayUtils";

export interface CreatePaymentIntentPayload {
  userId: string;
  amount: number;
  paymentMethod: string;
  checkoutReferenceId: string;
}

export const paymentGatewayService = {
  createPaymentIntent: async (
    payload: CreatePaymentIntentPayload
  ): Promise<PaymentTransaction> => {
    const transaction = createInitialPaymentTransaction(payload);

    return paymentTransactionService.createTransaction(transaction);
  },

  simulateGatewayCallback: async ({
    payment,
    gatewayStatus,
    failureReason
  }: {
    payment: PaymentTransaction;
    gatewayStatus: PaymentGatewayStatus;
    failureReason?: string;
  }): Promise<PaymentTransaction> => {
    const nextStatus = mapGatewayStatusToPaymentStatus(gatewayStatus);

    return paymentTransactionService.updateTransaction(payment.id, {
      gatewayStatus,
      status: nextStatus,
      failureReason: failureReason ?? null
    });
  },

  markPaymentLinkedToOrder: async ({
    payment,
    orderId
  }: {
    payment: PaymentTransaction;
    orderId: string;
  }): Promise<PaymentTransaction> => {
    return paymentTransactionService.updateTransaction(payment.id, {
      orderId,
      status: "SUCCESS",
      gatewayStatus: "CAPTURED",
      issueFlag: null,
      refundStatus: "NOT_REQUIRED"
    });
  },

  markPaymentAsRefundRequired: async ({
    payment,
    reason,
    userName
  }: {
    payment: PaymentTransaction;
    reason: string;
    userName?: string;
  }): Promise<PaymentTransaction> => {
    const refundRequest = await refundService.createRefundRequest({
      paymentId: payment.paymentId,
      orderId: payment.orderId ?? null,
      userId: payment.userId,
      userName,
      amount: payment.amount,
      refundMode: "ORIGINAL_PAYMENT_MODE",
      reason,
      createdBy: "SYSTEM",
      assignedTeam: "REFUND_TEAM"
    });

    return paymentTransactionService.updateTransaction(payment.id, {
      status: "REFUND_REQUIRED",
      gatewayStatus: "CAPTURED",
      issueFlag: "ORDER_NOT_CREATED",
      refundStatus: "PENDING_REVIEW",
      refundId: refundRequest.refundId
    });
  }
};