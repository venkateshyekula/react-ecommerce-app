import { apiClient } from "./apiClient";
import { returnRequestService } from "./returnRequestService";
import type { ReturnRequest } from "../types/returnRequest";
import type {
  CreateReturnPickupAttemptPayload,
  ReturnPickupAttempt,
  ReturnPickupPartner,
  UpdateReturnPickupAttemptPayload,
} from "../types/returnPickup";
import {
  generatePickupAttemptDbId,
  generatePickupAttemptId,
  getNextAttemptNumber,
} from "../utils/returnPickupUtils";

const RETURN_PICKUP_PARTNERS_ENDPOINT = "/returnPickupPartners";
const RETURN_PICKUP_ATTEMPTS_ENDPOINT = "/returnPickupAttempts";

const sortAttemptsByLatest = (
  attempts: ReturnPickupAttempt[],
): ReturnPickupAttempt[] => {
  return [...attempts].sort(
    (firstAttempt, secondAttempt) =>
      new Date(secondAttempt.updatedAt).getTime() -
      new Date(firstAttempt.updatedAt).getTime(),
  );
};

export const returnPickupService = {
  async getPickupPartners(): Promise<ReturnPickupPartner[]> {
    return apiClient.get<ReturnPickupPartner[]>(
      RETURN_PICKUP_PARTNERS_ENDPOINT,
    );
  },

  async getActivePickupPartners(): Promise<ReturnPickupPartner[]> {
    const partners = await returnPickupService.getPickupPartners();

    return partners.filter(
      (partner) =>
        partner.status === "ACTIVE" &&
        partner.activePickupCount < partner.maxDailyCapacity,
    );
  },

  async getAttempts(): Promise<ReturnPickupAttempt[]> {
    const attempts = await apiClient.get<ReturnPickupAttempt[]>(
      RETURN_PICKUP_ATTEMPTS_ENDPOINT,
    );

    return sortAttemptsByLatest(attempts);
  },

  async getAttemptsByReturnRequestId(
    returnRequestId: string,
  ): Promise<ReturnPickupAttempt[]> {
    const attempts = await apiClient.get<ReturnPickupAttempt[]>(
      `${RETURN_PICKUP_ATTEMPTS_ENDPOINT}?returnRequestId=${encodeURIComponent(
        returnRequestId,
      )}`,
    );

    return sortAttemptsByLatest(attempts);
  },

  async createAttempt(
    payload: CreateReturnPickupAttemptPayload,
  ): Promise<ReturnPickupAttempt> {
    const now = new Date().toISOString();

    const attempt: ReturnPickupAttempt = {
      id: generatePickupAttemptDbId(),
      attemptId: generatePickupAttemptId(),
      ...payload,
      status: "SCHEDULED",
      outForPickupAt: null,
      pickedUpAt: null,
      failedAt: null,
      rescheduledAt: null,
      cancelledAt: null,
      failureReason: null,
      pickupProofCode: null,
      remarks: payload.remarks ?? null,
      createdAt: now,
      updatedAt: now,
    };

    return apiClient.post<ReturnPickupAttempt, ReturnPickupAttempt>(
      RETURN_PICKUP_ATTEMPTS_ENDPOINT,
      attempt,
    );
  },

  async updateAttempt(
    attemptDbId: string,
    payload: UpdateReturnPickupAttemptPayload,
  ): Promise<ReturnPickupAttempt> {
    return apiClient.patch<
      ReturnPickupAttempt,
      UpdateReturnPickupAttemptPayload
    >(`${RETURN_PICKUP_ATTEMPTS_ENDPOINT}/${encodeURIComponent(attemptDbId)}`, {
      ...payload,
      updatedAt: new Date().toISOString(),
    });
  },

  async incrementPartnerLoad(
    partner: ReturnPickupPartner,
  ): Promise<ReturnPickupPartner> {
    return apiClient.patch<ReturnPickupPartner, Partial<ReturnPickupPartner>>(
      `${RETURN_PICKUP_PARTNERS_ENDPOINT}/${encodeURIComponent(partner.id)}`,
      {
        activePickupCount: partner.activePickupCount + 1,
        updatedAt: new Date().toISOString(),
      },
    );
  },

  async decrementPartnerLoad(
    partner: ReturnPickupPartner,
  ): Promise<ReturnPickupPartner> {
    return apiClient.patch<ReturnPickupPartner, Partial<ReturnPickupPartner>>(
      `${RETURN_PICKUP_PARTNERS_ENDPOINT}/${encodeURIComponent(partner.id)}`,
      {
        activePickupCount: Math.max(0, partner.activePickupCount - 1),
        updatedAt: new Date().toISOString(),
      },
    );
  },

  async assignPickupPartner({
    request,
    partner,
    pickupDate,
    pickupSlot,
    remarks,
  }: {
    request: ReturnRequest;
    partner: ReturnPickupPartner;
    pickupDate: string;
    pickupSlot: string;
    remarks?: string;
  }): Promise<{
    request: ReturnRequest;
    attempt: ReturnPickupAttempt;
  }> {
    const returnRequestId = request.returnRequestId ?? request.requestId;

    const existingAttempts =
      await returnPickupService.getAttemptsByReturnRequestId(returnRequestId);

    const attempt = await returnPickupService.createAttempt({
      returnRequestId,
      requestId: request.requestId,
      orderId: request.orderId,
      userId: request.userId,
      partnerId: partner.partnerId,
      partnerName: partner.name,
      partnerPhone: partner.phone,
      attemptNumber: getNextAttemptNumber(existingAttempts),
      scheduledPickupDate: pickupDate,
      pickupSlot,
      remarks: remarks ?? "Pickup partner assigned.",
    });

    await returnPickupService.incrementPartnerLoad(partner);

    const updatedRequest = await returnRequestService.updateRequest(
      request.id,
      {
        status: "PICKUP_SCHEDULED",
        pickupStatus: "SCHEDULED",
        pickupDate,
        pickupSlot,
        pickupScheduledAt: new Date().toISOString(),
        pickupPartnerId: partner.partnerId,
        pickupPartnerName: partner.name,
        pickupPartnerPhone: partner.phone,
        pickupAttemptCount: attempt.attemptNumber,
        lastPickupAttemptId: attempt.attemptId,
        nextPickupAttemptAt: pickupDate,
        adminRemarks: remarks ?? "Pickup partner assigned and pickup scheduled.",
      } as Partial<ReturnRequest>,
    );

    return {
      request: updatedRequest,
      attempt,
    };
  },

  async markOutForPickup({
    request,
    attempt,
    remarks,
  }: {
    request: ReturnRequest;
    attempt: ReturnPickupAttempt;
    remarks?: string;
  }): Promise<{
    request: ReturnRequest;
    attempt: ReturnPickupAttempt;
  }> {
    const now = new Date().toISOString();

    const updatedAttempt = await returnPickupService.updateAttempt(attempt.id, {
      status: "OUT_FOR_PICKUP",
      outForPickupAt: now,
      remarks: remarks ?? "Pickup partner is out for pickup.",
    });

    const updatedRequest = await returnRequestService.updateRequest(
      request.id,
      {
        pickupStatus: "OUT_FOR_PICKUP",
        adminRemarks: remarks ?? "Pickup partner is out for pickup.",
        updatedAt: now,
      } as Partial<ReturnRequest>,
    );

    return {
      request: updatedRequest,
      attempt: updatedAttempt,
    };
  },

  async markPickedUp({
    request,
    attempt,
    partner,
    remarks,
  }: {
    request: ReturnRequest;
    attempt: ReturnPickupAttempt;
    partner?: ReturnPickupPartner | null;
    remarks?: string;
  }): Promise<{
    request: ReturnRequest;
    attempt: ReturnPickupAttempt;
  }> {
    const now = new Date().toISOString();

    const updatedAttempt = await returnPickupService.updateAttempt(attempt.id, {
      status: "PICKED_UP",
      pickedUpAt: now,
      pickupProofCode: `POP-${Date.now()}`,
      remarks: remarks ?? "Return package picked up successfully.",
    });

    if (partner) {
      await returnPickupService.decrementPartnerLoad(partner);
    }

    const updatedRequest = await returnRequestService.updateRequest(
      request.id,
      {
        status: "PICKED_UP",
        pickupStatus: "PICKED_UP",
        pickedUpAt: now,
        pickupCompletedAt: now,
        adminRemarks: remarks ?? "Return package picked up successfully.",
        updatedAt: now,
      } as Partial<ReturnRequest>,
    );

    return {
      request: updatedRequest,
      attempt: updatedAttempt,
    };
  },

  async markFailedAttempt({
    request,
    attempt,
    failureReason,
  }: {
    request: ReturnRequest;
    attempt: ReturnPickupAttempt;
    failureReason: string;
  }): Promise<{
    request: ReturnRequest;
    attempt: ReturnPickupAttempt;
  }> {
    const now = new Date().toISOString();

    const updatedAttempt = await returnPickupService.updateAttempt(attempt.id, {
      status: "FAILED_ATTEMPT",
      failedAt: now,
      failureReason,
      remarks: failureReason,
    });

    const updatedRequest = await returnRequestService.updateRequest(
      request.id,
      {
        pickupStatus: "FAILED_ATTEMPT",
        adminRemarks: failureReason,
        lastPickupAttemptId: attempt.attemptId,
        updatedAt: now,
      } as Partial<ReturnRequest>,
    );

    return {
      request: updatedRequest,
      attempt: updatedAttempt,
    };
  },

  async reschedulePickupAttempt({
    request,
    previousAttempt,
    partner,
    pickupDate,
    pickupSlot,
    remarks,
  }: {
    request: ReturnRequest;
    previousAttempt?: ReturnPickupAttempt | null;
    partner: ReturnPickupPartner;
    pickupDate: string;
    pickupSlot: string;
    remarks?: string;
  }): Promise<{
    request: ReturnRequest;
    attempt: ReturnPickupAttempt;
  }> {
    if (previousAttempt) {
      await returnPickupService.updateAttempt(previousAttempt.id, {
        status: "RESCHEDULED",
        rescheduledAt: new Date().toISOString(),
        remarks: remarks ?? "Pickup rescheduled.",
      });
    }

    return returnPickupService.assignPickupPartner({
      request,
      partner,
      pickupDate,
      pickupSlot,
      remarks: remarks ?? "Pickup rescheduled.",
    });
  },
};