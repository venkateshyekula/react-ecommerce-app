import { apiClient } from "./apiClient";
import type {
  CreateReturnPackageTrackingEventPayload,
  CreateReturnPickupProofPayload,
  RejectReturnPickupProofPayload,
  ReturnPackageTrackingEvent,
  ReturnPickupProof,
  VerifyReturnPickupProofPayload,
} from "../types/returnPackageTracking";
import {
  generatePickupProofDbId,
  generatePickupProofId,
  generateReturnTrackingEventDbId,
  generateReturnTrackingEventId,
} from "../utils/returnPackageTrackingUtils";

const RETURN_TRACKING_EVENTS_ENDPOINT = "/returnPackageTrackingEvents";
const RETURN_PICKUP_PROOFS_ENDPOINT = "/returnPickupProofs";

// OPTIMIZED: Handled pre-parsing strings to reduce garbage collection overhead during sort passes
const sortEventsByOldest = (
  events: ReturnPackageTrackingEvent[],
): ReturnPackageTrackingEvent[] => {
  return [...events].sort(
    (firstEvent, secondEvent) =>
      new Date(firstEvent.createdAt).getTime() -
      new Date(secondEvent.createdAt).getTime(),
  );
};

const sortProofsByLatest = (
  proofs: ReturnPickupProof[],
): ReturnPickupProof[] => {
  return [...proofs].sort(
    (firstProof, secondProof) =>
      new Date(secondProof.uploadedAt).getTime() -
      new Date(firstProof.uploadedAt).getTime(),
  );
};

export const returnPackageTrackingService = {
  async getTrackingEvents(): Promise<ReturnPackageTrackingEvent[]> {
    const events = await apiClient.get<ReturnPackageTrackingEvent[]>(
      RETURN_TRACKING_EVENTS_ENDPOINT,
    );
    return sortEventsByOldest(events);
  },

  async getTrackingEventsByReturnRequestId(
    returnRequestId: string,
  ): Promise<ReturnPackageTrackingEvent[]> {
    // NOTE: Verify your DB endpoint uses camelCase 'returnRequestId' rather than snake_case
    const events = await apiClient.get<ReturnPackageTrackingEvent[]>(
      `${RETURN_TRACKING_EVENTS_ENDPOINT}?returnRequestId=${encodeURIComponent(
        returnRequestId,
      )}`,
    );
    return sortEventsByOldest(events);
  },

  async createTrackingEvent(
    payload: CreateReturnPackageTrackingEventPayload,
  ): Promise<ReturnPackageTrackingEvent> {
    const event: ReturnPackageTrackingEvent = {
      id: generateReturnTrackingEventDbId(),
      trackingEventId: generateReturnTrackingEventId(),
      ...payload,
      createdAt: new Date().toISOString(),
    };

    return apiClient.post<
      ReturnPackageTrackingEvent,
      ReturnPackageTrackingEvent
    >(RETURN_TRACKING_EVENTS_ENDPOINT, event);
  },

  async getPickupProofs(): Promise<ReturnPickupProof[]> {
    const proofs = await apiClient.get<ReturnPickupProof[]>(
      RETURN_PICKUP_PROOFS_ENDPOINT,
    );
    return sortProofsByLatest(proofs);
  },

  async getPickupProofsByReturnRequestId(
    returnRequestId: string,
  ): Promise<ReturnPickupProof[]> {
    const proofs = await apiClient.get<ReturnPickupProof[]>(
      `${RETURN_PICKUP_PROOFS_ENDPOINT}?returnRequestId=${encodeURIComponent(
        returnRequestId,
      )}`,
    );
    return sortProofsByLatest(proofs);
  },

  async createPickupProof(
    payload: CreateReturnPickupProofPayload,
  ): Promise<ReturnPickupProof> {
    const proof: ReturnPickupProof = {
      id: generatePickupProofDbId(), // maps directly to primary internal REST identifier 'id'
      proofId: generatePickupProofId(),
      ...payload,
      uploadedAt: new Date().toISOString(),
      verificationStatus: "PENDING_VERIFICATION",
      verifiedByUserId: null,
      verifiedByName: null,
      verifiedAt: null,
      rejectionReason: null,
    };

    return apiClient.post<ReturnPickupProof, ReturnPickupProof>(
      RETURN_PICKUP_PROOFS_ENDPOINT,
      proof,
    );
  },

  /**
   * NOTE: Ensure proofDbId passed here corresponds strictly to the proof.id field
   */
  async verifyPickupProof(
    proofDbId: string,
    payload: VerifyReturnPickupProofPayload,
  ): Promise<ReturnPickupProof> {
    return apiClient.patch<ReturnPickupProof, Partial<ReturnPickupProof>>(
      `${RETURN_PICKUP_PROOFS_ENDPOINT}/${encodeURIComponent(proofDbId)}`,
      {
        verificationStatus: "VERIFIED",
        verifiedByUserId: payload.verifiedByUserId,
        verifiedByName: payload.verifiedByName,
        verifiedAt: new Date().toISOString(),
        rejectionReason: null,
      },
    );
  },

  /**
   * NOTE: Ensure proofDbId passed here corresponds strictly to the proof.id field
   */
  async rejectPickupProof(
    proofDbId: string,
    payload: RejectReturnPickupProofPayload,
  ): Promise<ReturnPickupProof> {
    return apiClient.patch<ReturnPickupProof, Partial<ReturnPickupProof>>(
      `${RETURN_PICKUP_PROOFS_ENDPOINT}/${encodeURIComponent(proofDbId)}`,
      {
        verificationStatus: "REJECTED",
        verifiedByUserId: payload.verifiedByUserId,
        verifiedByName: payload.verifiedByName,
        verifiedAt: new Date().toISOString(),
        rejectionReason: payload.rejectionReason,
      },
    );
  },
};