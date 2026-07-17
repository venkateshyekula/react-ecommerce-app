import { apiClient } from "./apiClient";
import type {
  CreateRefundPayload,
  CreateRefundRequestPayload,
  RefundRecord,
  RefundRequest,
  UpdateRefundRequestPayload
} from "../types/refund";

const REFUNDS_ENDPOINT = "/refunds";
const REFUND_REQUESTS_ENDPOINT = "/refundRequests";

const generateRefundDbId = (): string => {
  return `refund-db-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const generateRefundRequestDbId = (): string => {
  return `refund-request-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const generateRefundId = (): string => {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");

  return `RFND-${datePart}-${Date.now()}`;
};

const sortRefundRecordsByLatest = (
  refunds: RefundRecord[]
): RefundRecord[] => {
  return [...refunds].sort(
    (firstRefund, secondRefund) =>
      new Date(secondRefund.initiatedAt).getTime() -
      new Date(firstRefund.initiatedAt).getTime()
  );
};

const sortRefundRequestsByLatest = (
  refunds: RefundRequest[]
): RefundRequest[] => {
  return [...refunds].sort(
    (firstRefund, secondRefund) =>
      new Date(secondRefund.updatedAt).getTime() -
      new Date(firstRefund.updatedAt).getTime()
  );
};

export const refundService = {
  /**
   * Existing return/order refund workflow.
   * Collection: /refunds
   */
  async getRefunds(): Promise<RefundRecord[]> {
    const refunds = await apiClient.get<RefundRecord[]>(REFUNDS_ENDPOINT);

    return sortRefundRecordsByLatest(refunds);
  },

  async getRefundsByOrderId(orderId: string): Promise<RefundRecord[]> {
    const refunds = await apiClient.get<RefundRecord[]>(
      `${REFUNDS_ENDPOINT}?orderId=${encodeURIComponent(orderId)}`
    );

    return sortRefundRecordsByLatest(refunds);
  },

  async getRefundsByUserId(userId: string): Promise<RefundRecord[]> {
    const refunds = await apiClient.get<RefundRecord[]>(
      `${REFUNDS_ENDPOINT}?userId=${encodeURIComponent(userId)}`
    );

    return sortRefundRecordsByLatest(refunds);
  },

  async createRefund(payload: CreateRefundPayload): Promise<RefundRecord> {
    const refund: RefundRecord = {
      id: generateRefundDbId(),
      ...payload
    };

    return apiClient.post<RefundRecord, RefundRecord>(
      REFUNDS_ENDPOINT,
      refund
    );
  },

  async updateRefund(
    id: string,
    data: Partial<RefundRecord>
  ): Promise<RefundRecord> {
    return apiClient.patch<RefundRecord, Partial<RefundRecord>>(
      `${REFUNDS_ENDPOINT}/${encodeURIComponent(id)}`,
      data
    );
  },

  /**
   * Enhancement Phase 12L:
   * Payment Gateway Simulation + Callback Handling + Auto Refund Queue.
   * Collection: /refundRequests
   */
  async getRefundRequests(): Promise<RefundRequest[]> {
    const refunds = await apiClient.get<RefundRequest[]>(
      REFUND_REQUESTS_ENDPOINT
    );

    return sortRefundRequestsByLatest(refunds);
  },

  async getRefundRequestByRefundId(
    refundId: string
  ): Promise<RefundRequest | null> {
    const refunds = await apiClient.get<RefundRequest[]>(
      `${REFUND_REQUESTS_ENDPOINT}?refundId=${encodeURIComponent(refundId)}`
    );

    return refunds[0] ?? null;
  },

  async getRefundRequestsByPaymentId(
    paymentId: string
  ): Promise<RefundRequest[]> {
    const refunds = await apiClient.get<RefundRequest[]>(
      `${REFUND_REQUESTS_ENDPOINT}?paymentId=${encodeURIComponent(paymentId)}`
    );

    return sortRefundRequestsByLatest(refunds);
  },

  async getRefundRequestsByUserId(
    userId: string
  ): Promise<RefundRequest[]> {
    const refunds = await apiClient.get<RefundRequest[]>(
      `${REFUND_REQUESTS_ENDPOINT}?userId=${encodeURIComponent(userId)}`
    );

    return sortRefundRequestsByLatest(refunds);
  },

  async getRefundRequestsByOrderId(
    orderId: string
  ): Promise<RefundRequest[]> {
    const refunds = await apiClient.get<RefundRequest[]>(
      `${REFUND_REQUESTS_ENDPOINT}?orderId=${encodeURIComponent(orderId)}`
    );

    return sortRefundRequestsByLatest(refunds);
  },

  async createRefundRequest(
    payload: CreateRefundRequestPayload
  ): Promise<RefundRequest> {
    const now = new Date().toISOString();

    const refundRequest: RefundRequest = {
      id: generateRefundRequestDbId(),
      refundId: generateRefundId(),
      ...payload,
      status: "PENDING_REVIEW",
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      failedAt: null,
      gatewayRefundReferenceId: null,
      resolutionNote: null
    };

    return apiClient.post<RefundRequest, RefundRequest>(
      REFUND_REQUESTS_ENDPOINT,
      refundRequest
    );
  },

  async updateRefundRequest(
    refundRequestDbId: string,
    payload: UpdateRefundRequestPayload
  ): Promise<RefundRequest> {
    return apiClient.patch<RefundRequest, UpdateRefundRequestPayload>(
      `${REFUND_REQUESTS_ENDPOINT}/${encodeURIComponent(refundRequestDbId)}`,
      {
        ...payload,
        updatedAt: new Date().toISOString()
      }
    );
  },

  async markRefundRequestInitiated({
    refundRequest,
    resolutionNote
  }: {
    refundRequest: RefundRequest;
    resolutionNote?: string;
  }): Promise<RefundRequest> {
    return refundService.updateRefundRequest(refundRequest.id, {
      status: "INITIATED",
      resolutionNote: resolutionNote ?? refundRequest.resolutionNote ?? null
    });
  },

  async markRefundRequestProcessing({
    refundRequest,
    resolutionNote
  }: {
    refundRequest: RefundRequest;
    resolutionNote?: string;
  }): Promise<RefundRequest> {
    return refundService.updateRefundRequest(refundRequest.id, {
      status: "PROCESSING",
      resolutionNote: resolutionNote ?? refundRequest.resolutionNote ?? null
    });
  },

  async markRefundRequestCompleted({
    refundRequest,
    gatewayRefundReferenceId,
    resolutionNote
  }: {
    refundRequest: RefundRequest;
    gatewayRefundReferenceId: string;
    resolutionNote: string;
  }): Promise<RefundRequest> {
    return refundService.updateRefundRequest(refundRequest.id, {
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
      failedAt: null,
      gatewayRefundReferenceId,
      resolutionNote
    });
  },

  async markRefundRequestFailed({
    refundRequest,
    resolutionNote
  }: {
    refundRequest: RefundRequest;
    resolutionNote: string;
  }): Promise<RefundRequest> {
    return refundService.updateRefundRequest(refundRequest.id, {
      status: "FAILED",
      failedAt: new Date().toISOString(),
      resolutionNote
    });
  }
};