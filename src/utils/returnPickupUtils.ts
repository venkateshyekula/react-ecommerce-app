import type {
  ReturnPickupAttempt,
  ReturnPickupAttemptStatus,
  ReturnPickupPartner,
  ReturnPickupPartnerStatus,
} from "../types/returnPickup";

export const formatPickupLabel = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const getPickupPartnerStatusBadgeClass = (
  status: ReturnPickupPartnerStatus,
): string => {
  switch (status) {
    case "ACTIVE":
      return "text-bg-success";

    case "BUSY":
      return "text-bg-warning";

    case "OFFLINE":
      return "text-bg-secondary";

    case "ON_LEAVE":
      return "text-bg-danger";

    default:
      return "text-bg-light";
  }
};

export const getPickupAttemptStatusBadgeClass = (
  status: ReturnPickupAttemptStatus,
): string => {
  switch (status) {
    case "SCHEDULED":
      return "text-bg-info";

    case "OUT_FOR_PICKUP":
      return "text-bg-primary";

    case "PICKED_UP":
      return "text-bg-success";

    case "FAILED_ATTEMPT":
      return "text-bg-warning";

    case "RESCHEDULED":
      return "text-bg-secondary";

    case "CANCELLED":
      return "text-bg-danger";

    default:
      return "text-bg-light";
  }
};

export const generatePickupAttemptDbId = (): string => {
  return `return-pickup-attempt-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

export const generatePickupAttemptId = (): string => {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  return `PKUP-${datePart}-${Date.now()}`;
};

export const getNextAttemptNumber = (
  attempts: ReturnPickupAttempt[],
): number => {
  if (attempts.length === 0) {
    return 1;
  }

  return (
    Math.max(...attempts.map((attempt) => attempt.attemptNumber ?? 0)) + 1
  );
};

export const canAssignPickupPartner = ({
  partner,
}: {
  partner: ReturnPickupPartner;
}): boolean => {
  return (
    partner.status === "ACTIVE" &&
    partner.activePickupCount < partner.maxDailyCapacity
  );
};

export const canMarkOutForPickup = (
  latestAttempt?: ReturnPickupAttempt | null,
): boolean => {
  return latestAttempt?.status === "SCHEDULED";
};

export const canMarkPickedUp = (
  latestAttempt?: ReturnPickupAttempt | null,
): boolean => {
  return latestAttempt?.status === "OUT_FOR_PICKUP";
};

export const canMarkFailedAttempt = (
  latestAttempt?: ReturnPickupAttempt | null,
): boolean => {
  return (
    latestAttempt?.status === "SCHEDULED" ||
    latestAttempt?.status === "OUT_FOR_PICKUP"
  );
};

export const canReschedulePickup = (
  latestAttempt?: ReturnPickupAttempt | null,
): boolean => {
  return (
    !latestAttempt ||
    latestAttempt.status === "FAILED_ATTEMPT" ||
    latestAttempt.status === "CANCELLED" ||
    latestAttempt.status === "RESCHEDULED"
  );
};

export const getLatestPickupAttempt = (
  attempts: ReturnPickupAttempt[],
): ReturnPickupAttempt | null => {
  if (attempts.length === 0) {
    return null;
  }

  return [...attempts].sort(
    (firstAttempt, secondAttempt) =>
      new Date(secondAttempt.updatedAt).getTime() -
      new Date(firstAttempt.updatedAt).getTime(),
  )[0];
};