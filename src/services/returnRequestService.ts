import { apiClient } from "./apiClient";
import { paymentTransactionService } from "./paymentTransactionService";
import { refundService } from "./refundService";
import type {
  CreateReturnRequestPayload,
  ReturnRequest,
  UpdateReturnRequestPayload,
} from "../types/returnRequest";
import {
  generateReturnDbId,
  generateReturnRequestId,
} from "../utils/returnWorkflowUtils";

const RETURN_REQUESTS_ENDPOINT = "/returnRequests";

const sortByLatest = (requests: ReturnRequest[]): ReturnRequest[] => {
  return [...requests].sort(
    (firstRequest, secondRequest) =>
      new Date(
        secondRequest.updatedAt ?? secondRequest.requestedAt,
      ).getTime() -
      new Date(firstRequest.updatedAt ?? firstRequest.requestedAt).getTime(),
  );
};

const calculateRefundAmountFromItems = (
  items: CreateReturnRequestPayload["items"],
): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const returnRequestService = {
  async getRequests(): Promise<ReturnRequest[]> {
    const requests = await apiClient.get<ReturnRequest[]>(
      RETURN_REQUESTS_ENDPOINT,
    );
    return sortByLatest(requests);
  },

  async getReturnRequests(): Promise<ReturnRequest[]> {
    return returnRequestService.getRequests();
  },

  async getRequestsByUserId(userId: string): Promise<ReturnRequest[]> {
    const requests = await apiClient.get<ReturnRequest[]>(
      `${RETURN_REQUESTS_ENDPOINT}?userId=${encodeURIComponent(userId)}`,
    );
    return sortByLatest(requests);
  },

  async getReturnRequestsByUserId(userId: string): Promise<ReturnRequest[]> {
    return returnRequestService.getRequestsByUserId(userId);
  },

  async getRequestsByOrderId(orderId: string): Promise<ReturnRequest[]> {
    const requests = await apiClient.get<ReturnRequest[]>(
      `${RETURN_REQUESTS_ENDPOINT}?orderId=${encodeURIComponent(orderId)}`,
    );
    return sortByLatest(requests);
  },

  async getReturnRequestsByOrderId(orderId: string): Promise<ReturnRequest[]> {
    return returnRequestService.getRequestsByOrderId(orderId);
  },

  async getRequestByRequestId(
    requestId: string,
  ): Promise<ReturnRequest | null> {
    const requests = await apiClient.get<ReturnRequest[]>(
      `${RETURN_REQUESTS_ENDPOINT}?requestId=${encodeURIComponent(requestId)}`,
    );
    return requests[0] ?? null;
  },

  async getRequestByReturnRequestId(
    returnRequestId: string,
  ): Promise<ReturnRequest | null> {
    const requests = await apiClient.get<ReturnRequest[]>(
      `${RETURN_REQUESTS_ENDPOINT}?returnRequestId=${encodeURIComponent(
        returnRequestId,
      )}`,
    );
    return requests[0] ?? null;
  },

  async createRequest(
    payload: CreateReturnRequestPayload,
  ): Promise<ReturnRequest> {
    const now = new Date().toISOString();
    const requestId = payload.requestId || generateReturnRequestId();

    const request: ReturnRequest = {
      id: generateReturnDbId(),
      ...payload,
      requestId,
      returnRequestId: payload.returnRequestId ?? requestId,
      requestedAt: payload.requestedAt || now,
      createdAt: payload.createdAt ?? now,
      updatedAt: payload.updatedAt ?? now,
      reason: payload.reason,
      returnReason: payload.returnReason ?? payload.reason,
      comments: payload.comments,
      customerComment: payload.customerComment ?? payload.comments ?? null,
      status: payload.status ?? "REQUESTED",
      pickupStatus: payload.pickupStatus ?? "NOT_SCHEDULED",
      qualityCheckStatus: payload.qualityCheckStatus ?? "NOT_STARTED",
      refundStatus: payload.refundStatus ?? "PENDING",
      refundId: payload.refundId ?? null,
      refundAmount:
        payload.refundAmount ?? calculateRefundAmountFromItems(payload.items),
      refundPreference: payload.refundPreference ?? "ORIGINAL_PAYMENT_MODE",
      pickupAddress: payload.pickupAddress,
      pickupDate: payload.pickupDate ?? null,
      pickupSlot: payload.pickupSlot ?? null,
      adminRemarks: payload.adminRemarks ?? null,
      qualityCheckRemarks: payload.qualityCheckRemarks ?? null,
      approvedAt: null,
      rejectedAt: null,
      pickupScheduledAt: null,
      pickedUpAt: null,
      pickupCompletedAt: null,
      receivedAtWarehouseAt: null,
      qualityCheckedAt: null,
      refundInitiatedAt: null,
      refundedAt: null,
      refundCompletedAt: null,
      cancelledAt: null,
    };

    return apiClient.post<ReturnRequest, ReturnRequest>(
      RETURN_REQUESTS_ENDPOINT,
      request,
    );
  },

  async createReturnRequest(
    payload: Omit<
      CreateReturnRequestPayload,
      "requestId" | "requestedAt" | "status"
    > &
      Partial<
        Pick<CreateReturnRequestPayload, "requestId" | "requestedAt" | "status">
      >,
  ): Promise<ReturnRequest> {
    const now = new Date().toISOString();

    return returnRequestService.createRequest({
      requestId: payload.requestId ?? generateReturnRequestId(),
      requestedAt: payload.requestedAt ?? now,
      status: payload.status ?? "REQUESTED",
      ...payload,
    });
  },

  async updateRequest(
    id: string,
    data: Partial<ReturnRequest>,
  ): Promise<ReturnRequest> {
    return apiClient.patch<ReturnRequest, Partial<ReturnRequest>>(
      `${RETURN_REQUESTS_ENDPOINT}/${encodeURIComponent(id)}`,
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
    );
  },

  async updateReturnRequest(
    id: string,
    data: UpdateReturnRequestPayload,
  ): Promise<ReturnRequest> {
    return returnRequestService.updateRequest(id, data);
  },

  async approveReturn({
    request,
    adminRemarks,
  }: {
    request: ReturnRequest;
    adminRemarks?: string;
  }): Promise<ReturnRequest> {
    const now = new Date().toISOString();

    return returnRequestService.updateReturnRequest(request.id, {
      status: "APPROVED",
      adminRemarks: adminRemarks ?? "Return request approved.",
      approvedAt: now,
      updatedAt: now,
    });
  },

  async rejectReturn({
    request,
    adminRemarks,
  }: {
    request: ReturnRequest;
    adminRemarks: string;
  }): Promise<ReturnRequest> {
    const now = new Date().toISOString();

    return returnRequestService.updateReturnRequest(request.id, {
      status: "REJECTED",
      refundStatus: "FAILED",
      adminRemarks,
      rejectedAt: now,
      updatedAt: now,
    });
  },

  async schedulePickup({
    request,
    pickupDate,
    pickupSlot,
    adminRemarks,
  }: {
    request: ReturnRequest;
    pickupDate: string;
    pickupSlot: string;
    adminRemarks?: string;
  }): Promise<ReturnRequest> {
    const now = new Date().toISOString();

    return returnRequestService.updateReturnRequest(request.id, {
      status: "PICKUP_SCHEDULED",
      pickupStatus: "SCHEDULED",
      pickupDate,
      pickupSlot,
      pickupScheduledAt: now,
      adminRemarks: adminRemarks ?? "Pickup scheduled.",
      updatedAt: now,
    });
  },

  async markPickupOutForPickup({
    request,
    adminRemarks,
  }: {
    request: ReturnRequest;
    adminRemarks?: string;
  }): Promise<ReturnRequest> {
    const now = new Date().toISOString();

    return returnRequestService.updateReturnRequest(request.id, {
      pickupStatus: "OUT_FOR_PICKUP",
      adminRemarks: adminRemarks ?? "Pickup partner is out for pickup.",
      updatedAt: now,
    });
  },

  async markPickupFailedAttempt({
    request,
    adminRemarks,
  }: {
    request: ReturnRequest;
    adminRemarks: string;
  }): Promise<ReturnRequest> {
    const now = new Date().toISOString();

    return returnRequestService.updateReturnRequest(request.id, {
      pickupStatus: "FAILED_ATTEMPT",
      adminRemarks,
      updatedAt: now,
    });
  },

  async markPickupCompleted({
    request,
    adminRemarks,
  }: {
    request: ReturnRequest;
    adminRemarks?: string;
  }): Promise<ReturnRequest> {
    const now = new Date().toISOString();

    // FIXED: Shifted status configuration assignment from "PICKED_UP" to "PICKUP_COMPLETED" 
    // to align with UI controls, search matrix indexes, and visibility rules.
    return returnRequestService.updateReturnRequest(request.id, {
      status: "PICKUP_COMPLETED", 
      pickupStatus: "PICKED_UP",
      pickedUpAt: now,
      pickupCompletedAt: now,
      adminRemarks: adminRemarks ?? "Return pickup completed.",
      updatedAt: now,
    });
  },

  async markReceivedAtWarehouse({
    request,
    adminRemarks,
  }: {
    request: ReturnRequest;
    adminRemarks?: string;
  }): Promise<ReturnRequest> {
    const now = new Date().toISOString();

    return returnRequestService.updateReturnRequest(request.id, {
      status: "RECEIVED_AT_WAREHOUSE",
      qualityCheckStatus: "PENDING",
      receivedAtWarehouseAt: now,
      adminRemarks: adminRemarks ?? "Return received at warehouse.",
      updatedAt: now,
    });
  },

  async startQualityCheck({
    request,
    qualityCheckRemarks,
  }: {
    request: ReturnRequest;
    qualityCheckRemarks?: string;
  }): Promise<ReturnRequest> {
    const now = new Date().toISOString();

    return returnRequestService.updateReturnRequest(request.id, {
      status: "QUALITY_CHECK_PENDING",
      qualityCheckStatus: "PENDING",
      qualityCheckRemarks: qualityCheckRemarks ?? "Quality check started.",
      updatedAt: now,
    });
  },

  async passQualityCheckAndCreateRefund({
    request,
    qualityCheckRemarks,
  }: {
    request: ReturnRequest;
    qualityCheckRemarks?: string;
  }): Promise<ReturnRequest> {
    const now = new Date().toISOString();

    const payments = await paymentTransactionService.getTransactionsByOrderId(
      request.orderId,
    );

    const capturedPayment =
      payments.find(
        (payment) =>
          payment.status === "SUCCESS" || payment.status === "REFUND_REQUIRED",
      ) ?? payments[0];

    const refundAmount =
      request.refundAmount ??
      request.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );

    const refundRequest = await refundService.createRefundRequest({
      paymentId: capturedPayment?.paymentId ?? `RETURN-${request.requestId}`,
      orderId: request.orderId,
      userId: request.userId,
      userName: request.userName,
      amount: refundAmount,
      refundMode: request.refundPreference ?? "ORIGINAL_PAYMENT_MODE",
      reason: `Return quality check passed for ${
        request.returnRequestId ?? request.requestId
      }.`,
      createdBy: "SYSTEM",
      assignedTeam: "REFUND_TEAM",
    });

    if (capturedPayment) {
      await paymentTransactionService.markRefundRequired({
        transactionDbId: capturedPayment.id,
        refundId: refundRequest.refundId,
        issueFlag: "REFUND_PENDING",
      });
    }

    return returnRequestService.updateReturnRequest(request.id, {
      status: "REFUND_INITIATED",
      qualityCheckStatus: "PASSED",
      refundStatus: "PENDING_REVIEW",
      refundId: refundRequest.refundId,
      refundAmount,
      qualityCheckRemarks:
        qualityCheckRemarks ?? "Quality check passed. Refund request created.",
      qualityCheckedAt: now,
      refundInitiatedAt: now,
      updatedAt: now,
    });
  },

  async failQualityCheck({
    request,
    qualityCheckRemarks,
  }: {
    request: ReturnRequest;
    qualityCheckRemarks: string;
  }): Promise<ReturnRequest> {
    const now = new Date().toISOString();

    return returnRequestService.updateReturnRequest(request.id, {
      status: "QUALITY_CHECK_FAILED",
      qualityCheckStatus: "FAILED",
      refundStatus: "FAILED",
      qualityCheckRemarks,
      qualityCheckedAt: now,
      updatedAt: now,
    });
  },

  async markRefundCompleted({
    request,
    adminRemarks,
  }: {
    request: ReturnRequest;
    adminRemarks?: string;
  }): Promise<ReturnRequest> {
    const now = new Date().toISOString();

    return returnRequestService.updateReturnRequest(request.id, {
      status: "REFUND_COMPLETED",
      refundStatus: "COMPLETED",
      refundedAt: now,
      refundCompletedAt: now,
      adminRemarks: adminRemarks ?? "Refund completed.",
      updatedAt: now,
    });
  },

  async closeReturn({
    request,
    adminRemarks,
  }: {
    request: ReturnRequest;
    adminRemarks?: string;
  }): Promise<ReturnRequest> {
    const now = new Date().toISOString();

    return returnRequestService.updateReturnRequest(request.id, {
      status: "CLOSED",
      adminRemarks: adminRemarks ?? "Return request closed.",
      updatedAt: now,
    });
  },

  async cancelReturn({
    request,
    adminRemarks,
  }: {
    request: ReturnRequest;
    adminRemarks?: string;
  }): Promise<ReturnRequest> {
    const now = new Date().toISOString();

    return returnRequestService.updateReturnRequest(request.id, {
      status: "CANCELLED",
      pickupStatus: "CANCELLED",
      refundStatus: "CANCELLED",
      cancelledAt: now,
      adminRemarks: adminRemarks ?? "Return request cancelled.",
      updatedAt: now,
    });
  },
};