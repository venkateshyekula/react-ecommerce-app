import { apiClient } from "./apiClient";
import { returnRequestService } from "./returnRequestService";
import type { ReturnRequest } from "../types/returnRequest";
import type {
  CreateReturnRefundSettlementPayload,
  FailReturnRefundSettlementPayload,
  ProcessReturnRefundSettlementPayload,
  ReturnCompensationCoupon,
  ReturnRefundSettlement,
  ReturnRefundSettlementMode,
} from "../types/returnRefundSettlement";
import {
  generateReturnCouponCode,
  generateReturnSettlementDbId,
  generateReturnSettlementId,
  generateWalletTransactionId,
  getReturnRefundAmount,
  getSettlementAmountSplit,
} from "../utils/returnRefundSettlementUtils";

const RETURN_REFUND_SETTLEMENTS_ENDPOINT = "/returnRefundSettlements";
const RETURN_COMPENSATION_COUPONS_ENDPOINT = "/returnCompensationCoupons";
const WALLET_TRANSACTIONS_ENDPOINT = "/walletTransactions";

const sortSettlementsByLatest = (
  settlements: ReturnRefundSettlement[],
): ReturnRefundSettlement[] => {
  return [...settlements].sort(
    (firstSettlement, secondSettlement) =>
      new Date(secondSettlement.updatedAt).getTime() -
      new Date(firstSettlement.updatedAt).getTime(),
  );
};

export const returnRefundSettlementService = {
  async getSettlements(): Promise<ReturnRefundSettlement[]> {
    const settlements = await apiClient.get<ReturnRefundSettlement[]>(
      RETURN_REFUND_SETTLEMENTS_ENDPOINT,
    );

    return sortSettlementsByLatest(settlements);
  },

  async getSettlementByReturnRequestId(
    returnRequestId: string,
  ): Promise<ReturnRefundSettlement | null> {
    const settlements = await apiClient.get<ReturnRefundSettlement[]>(
      `${RETURN_REFUND_SETTLEMENTS_ENDPOINT}?returnRequestId=${encodeURIComponent(
        returnRequestId,
      )}`,
    );

    return sortSettlementsByLatest(settlements)[0] ?? null;
  },

  async createSettlement(
    payload: CreateReturnRefundSettlementPayload,
  ): Promise<ReturnRefundSettlement> {
    const now = new Date().toISOString();

    const split = getSettlementAmountSplit({
      amount: payload.refundAmount,
      mode: payload.settlementMode,
    });

    const settlement: ReturnRefundSettlement = {
      id: generateReturnSettlementDbId(),
      settlementId: generateReturnSettlementId(),
      ...payload,
      settlementAmount: split.settlementAmount,
      walletCreditAmount: split.walletCreditAmount,
      couponAmount: split.couponAmount,
      settlementStatus: "QUEUED",
      gatewayReferenceId: null,
      walletTransactionId: null,
      couponCode: null,
      failureReason: null,
      failureRemarks: null,
      queuedAt: now,
      processedByUserId: null,
      processedByName: null,
      processedAt: null,
      settledAt: null,
      failedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    return apiClient.post<ReturnRefundSettlement, ReturnRefundSettlement>(
      RETURN_REFUND_SETTLEMENTS_ENDPOINT,
      settlement,
    );
  },

  async updateSettlement(
    settlementDbId: string,
    payload: Partial<ReturnRefundSettlement>,
  ): Promise<ReturnRefundSettlement> {
    return apiClient.patch<
      ReturnRefundSettlement,
      Partial<ReturnRefundSettlement>
    >(
      `${RETURN_REFUND_SETTLEMENTS_ENDPOINT}/${encodeURIComponent(
        settlementDbId,
      )}`,
      {
        ...payload,
        updatedAt: new Date().toISOString(),
      },
    );
  },

  async queueSettlementForReturn({
    request,
    settlementMode,
    queuedByUserId,
    queuedByName,
    settlementRemarks,
  }: {
    request: ReturnRequest;
    settlementMode: ReturnRefundSettlementMode;
    queuedByUserId?: string | null;
    queuedByName?: string | null;
    settlementRemarks?: string | null;
  }): Promise<ReturnRefundSettlement> {
    const returnRequestId = request.returnRequestId ?? request.requestId;
    const existingSettlement =
      await returnRefundSettlementService.getSettlementByReturnRequestId(
        returnRequestId,
      );

    if (existingSettlement) {
      return existingSettlement;
    }

    const refundAmount = getReturnRefundAmount(request);

    const settlement =
      await returnRefundSettlementService.createSettlement({
        returnRequestDbId: request.id,
        returnRequestId,
        requestId: request.requestId,
        orderId: request.orderId,
        orderDbId: request.orderDbId ?? null,
        userId: request.userId,
        customerName: request.userName ?? null,
        customerEmail: request.userEmail ?? null,
        refundAmount,
        settlementMode,
        queuedByUserId,
        queuedByName,
        settlementRemarks: settlementRemarks ?? null,
      });

    await returnRequestService.updateRequest(request.id, {
      refundStatus: "PROCESSING",
      refundInitiatedAt:
        request.refundInitiatedAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Partial<ReturnRequest>);

    return settlement;
  },

  async createWalletCredit({
    settlement,
  }: {
    settlement: ReturnRefundSettlement;
  }): Promise<string | null> {
    if (settlement.walletCreditAmount <= 0) {
      return null;
    }

    const walletTransactionId = generateWalletTransactionId();

    await apiClient.post<Record<string, unknown>, Record<string, unknown>>(
      WALLET_TRANSACTIONS_ENDPOINT,
      {
        id: `wallet-txn-db-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        transactionId: walletTransactionId,
        userId: settlement.userId,
        type: "CREDIT",
        source: "RETURN_REFUND",
        amount: settlement.walletCreditAmount,
        status: "COMPLETED",
        returnRequestId: settlement.returnRequestId,
        orderId: settlement.orderId,
        description: `Return refund wallet credit for ${settlement.returnRequestId}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    );

    return walletTransactionId;
  },

  async createCompensationCoupon({
    settlement,
  }: {
    settlement: ReturnRefundSettlement;
  }): Promise<string | null> {
    if (settlement.couponAmount <= 0) {
      return null;
    }

    const now = new Date();
    const validTill = new Date(now);
    validTill.setDate(validTill.getDate() + 90);

    const couponCode = generateReturnCouponCode();

    const coupon: ReturnCompensationCoupon = {
      id: `return-coupon-db-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      couponCode,
      returnRequestId: settlement.returnRequestId,
      orderId: settlement.orderId,
      userId: settlement.userId,
      amount: settlement.couponAmount,
      reason: "Return refund compensation",
      status: "ACTIVE",
      validFrom: now.toISOString(),
      validTill: validTill.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await apiClient.post<ReturnCompensationCoupon, ReturnCompensationCoupon>(
      RETURN_COMPENSATION_COUPONS_ENDPOINT,
      coupon,
    );

    return couponCode;
  },

  async processSettlement({
    settlement,
    payload,
  }: {
    settlement: ReturnRefundSettlement;
    payload: ProcessReturnRefundSettlementPayload;
  }): Promise<ReturnRefundSettlement> {
    const now = new Date().toISOString();

    const processingSettlement =
      await returnRefundSettlementService.updateSettlement(settlement.id, {
        settlementStatus: "PROCESSING",
        processedByUserId: payload.processedByUserId,
        processedByName: payload.processedByName,
        processedAt: now,
        settlementRemarks: payload.settlementRemarks ?? settlement.settlementRemarks,
      });

    try {
      const [walletTransactionId, couponCode] = await Promise.all([
        returnRefundSettlementService.createWalletCredit({
          settlement: processingSettlement,
        }),
        returnRefundSettlementService.createCompensationCoupon({
          settlement: processingSettlement,
        }),
      ]);

      const gatewayReferenceId =
        processingSettlement.settlementMode === "ORIGINAL_PAYMENT_MODE"
          ? `PG-REV-${Date.now()}`
          : processingSettlement.gatewayReferenceId ?? null;

      const settledSettlement =
        await returnRefundSettlementService.updateSettlement(
          processingSettlement.id,
          {
            settlementStatus: "SETTLED",
            gatewayReferenceId,
            walletTransactionId,
            couponCode,
            settledAt: new Date().toISOString(),
            failureReason: null,
            failureRemarks: null,
          },
        );

      await returnRequestService.updateRequest(settlement.returnRequestDbId, {
        refundStatus: "COMPLETED",
        status: "REFUNDED",
        refundedAt: new Date().toISOString(),
        refundCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Partial<ReturnRequest>);

      return settledSettlement;
    } catch (error) {
      return returnRefundSettlementService.failSettlement({
        settlement: processingSettlement,
        payload: {
          processedByUserId: payload.processedByUserId,
          processedByName: payload.processedByName,
          failureReason: "PROCESSING_ERROR",
          failureRemarks:
            error instanceof Error
              ? error.message
              : "Failed to process refund settlement transaction.",
        },
      });
    }
  },

  async failSettlement({
    settlement,
    payload,
  }: {
    settlement: ReturnRefundSettlement;
    payload: FailReturnRefundSettlementPayload;
  }): Promise<ReturnRefundSettlement> {
    const failedSettlement =
      await returnRefundSettlementService.updateSettlement(settlement.id, {
        settlementStatus: "FAILED",
        processedByUserId: payload.processedByUserId,
        processedByName: payload.processedByName,
        processedAt: new Date().toISOString(),
        failedAt: new Date().toISOString(),
        failureReason: payload.failureReason,
        failureRemarks: payload.failureRemarks,
      });

    await returnRequestService.updateRequest(settlement.returnRequestDbId, {
      refundStatus: "FAILED",
      updatedAt: new Date().toISOString(),
    } as Partial<ReturnRequest>);

    return failedSettlement;
  },
};