export type ReturnPackageTrackingStatus =
  | "PICKUP_SCHEDULED"
  | "PICKUP_ASSIGNED"
  | "PICKUP_ATTEMPTED"
  | "PICKUP_COMPLETED"
  | "IN_TRANSIT_TO_HUB"
  | "RECEIVED_AT_HUB"
  | "IN_TRANSIT_TO_RETURN_WAREHOUSE"
  | "DELIVERED_TO_RETURN_WAREHOUSE"
  | "QC_PENDING"
  | "QC_COMPLETED"
  | "RETURN_CLOSED";

export type ReturnPickupProofVerificationStatus =
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED";

export type ReturnPickupPackageCondition =
  | "SEALED"
  | "OPENED"
  | "DAMAGED"
  | "MISSING_ACCESSORIES"
  | "WRONG_ITEM"
  | "NOT_COLLECTED";

export interface ReturnPackageTrackingEvent {
  id: string;
  trackingEventId: string;
  returnRequestId: string;
  orderId?: string | null;
  status: ReturnPackageTrackingStatus;
  title: string;
  description: string;
  location?: string | null;
  handledByUserId?: string | null;
  handledByName?: string | null;
  createdAt: string;
}

export interface CreateReturnPackageTrackingEventPayload {
  returnRequestId: string;
  orderId?: string | null;
  status: ReturnPackageTrackingStatus;
  title: string;
  description: string;
  location?: string | null;
  handledByUserId?: string | null;
  handledByName?: string | null;
}

export interface ReturnPickupProof {
  id: string;
  proofId: string;
  returnRequestId: string;
  orderId?: string | null;
  pickupPartnerId?: string | null;
  pickupPartnerName?: string | null;
  pickupAgentName?: string | null;
  packageCondition: ReturnPickupPackageCondition;
  packagePhotoDataUrl?: string | null;
  packagePhotoFileName?: string | null;
  otpVerified: boolean;
  customerSignatureCaptured: boolean;
  customerRemarks?: string | null;
  agentRemarks?: string | null;
  pickupLocation?: string | null;
  uploadedByUserId?: string | null;
  uploadedByName?: string | null;
  uploadedAt: string;
  verificationStatus: ReturnPickupProofVerificationStatus;
  verifiedByUserId?: string | null;
  verifiedByName?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
}

export interface CreateReturnPickupProofPayload {
  returnRequestId: string;
  orderId?: string | null;
  pickupPartnerId?: string | null;
  pickupPartnerName?: string | null;
  pickupAgentName?: string | null;
  packageCondition: ReturnPickupPackageCondition;
  packagePhotoDataUrl?: string | null;
  packagePhotoFileName?: string | null;
  otpVerified: boolean;
  customerSignatureCaptured: boolean;
  customerRemarks?: string | null;
  agentRemarks?: string | null;
  pickupLocation?: string | null;
  uploadedByUserId?: string | null;
  uploadedByName?: string | null;
}

export interface VerifyReturnPickupProofPayload {
  verifiedByUserId: string;
  verifiedByName: string;
}

export interface RejectReturnPickupProofPayload {
  verifiedByUserId: string;
  verifiedByName: string;
  rejectionReason: string;
}