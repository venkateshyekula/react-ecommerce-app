export type ReturnPickupPartnerStatus =
  | "ACTIVE"
  | "BUSY"
  | "OFFLINE"
  | "ON_LEAVE";

export type ReturnPickupAttemptStatus =
  | "SCHEDULED"
  | "OUT_FOR_PICKUP"
  | "PICKED_UP"
  | "FAILED_ATTEMPT"
  | "RESCHEDULED"
  | "CANCELLED"
  | "FAILED";

export interface ReturnPickupPartner {
  id: string;
  partnerId: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  zoneName?: string;
  status: ReturnPickupPartnerStatus;
  activePickupCount: number;
  maxDailyCapacity: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnPickupAttempt {
  id: string;
  attemptId: string;
  returnRequestId: string;
  requestId: string;
  orderId: string;
  userId: string;
  partnerId: string;
  partnerName: string;
  partnerPhone: string;
  attemptNumber: number;
  status: ReturnPickupAttemptStatus;
  scheduledPickupDate: string;
  pickupSlot: string;
  outForPickupAt?: string | null;
  pickedUpAt?: string | null;
  failedAt?: string | null;
  rescheduledAt?: string | null;
  cancelledAt?: string | null;
  failureReason?: string | null;
  pickupProofCode?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReturnPickupAttemptPayload {
  returnRequestId: string;
  requestId: string;
  orderId: string;
  userId: string;
  partnerId: string;
  partnerName: string;
  partnerPhone: string;
  attemptNumber: number;
  scheduledPickupDate: string;
  pickupSlot: string;
  remarks?: string | null;
}

export interface UpdateReturnPickupAttemptPayload {
  status?: ReturnPickupAttemptStatus;
  outForPickupAt?: string | null;
  pickedUpAt?: string | null;
  failedAt?: string | null;
  rescheduledAt?: string | null;
  cancelledAt?: string | null;
  failureReason?: string | null;
  pickupProofCode?: string | null;
  remarks?: string | null;
  updatedAt?: string;
}