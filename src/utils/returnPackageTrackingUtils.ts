import type {
  ReturnPackageTrackingEvent,
  ReturnPackageTrackingStatus,
  ReturnPickupPackageCondition,
  ReturnPickupProof,
  ReturnPickupProofVerificationStatus,
} from "../types/returnPackageTracking";

export const returnPackageTrackingStatusOptions: Array<{
  value: ReturnPackageTrackingStatus;
  label: string;
}> = [
  { value: "PICKUP_SCHEDULED", label: "Pickup Scheduled" },
  { value: "PICKUP_ASSIGNED", label: "Pickup Assigned" },
  { value: "PICKUP_ATTEMPTED", label: "Pickup Attempted" },
  { value: "PICKUP_COMPLETED", label: "Pickup Completed" },
  { value: "IN_TRANSIT_TO_HUB", label: "In Transit to Hub" },
  { value: "RECEIVED_AT_HUB", label: "Received at Hub" },
  {
    value: "IN_TRANSIT_TO_RETURN_WAREHOUSE",
    label: "In Transit to Return Warehouse",
  },
  {
    value: "DELIVERED_TO_RETURN_WAREHOUSE",
    label: "Delivered to Return Warehouse",
  },
  { value: "QC_PENDING", label: "QC Pending" },
  { value: "QC_COMPLETED", label: "QC Completed" },
  { value: "RETURN_CLOSED", label: "Return Closed" },
];

export const returnPickupPackageConditionOptions: Array<{
  value: ReturnPickupPackageCondition;
  label: string;
}> = [
  { value: "SEALED", label: "Sealed" },
  { value: "OPENED", label: "Opened" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "MISSING_ACCESSORIES", label: "Missing Accessories" },
  { value: "WRONG_ITEM", label: "Wrong Item" },
  { value: "NOT_COLLECTED", label: "Not Collected" },
];

export const generateReturnTrackingEventDbId = (): string => {
  return `return-tracking-event-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

export const generateReturnTrackingEventId = (): string => {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  return `RTE-${datePart}-${Date.now()}`;
};

export const generatePickupProofDbId = (): string => {
  return `return-pickup-proof-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

export const generatePickupProofId = (): string => {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  return `RPP-${datePart}-${Date.now()}`;
};

export const formatReturnTrackingStatus = (
  status: ReturnPackageTrackingStatus,
): string => {
  return (
    returnPackageTrackingStatusOptions.find((option) => option.value === status)
      ?.label ?? status
  );
};

export const formatPickupProofVerificationStatus = (
  status: ReturnPickupProofVerificationStatus,
): string => {
  if (!status) return "";
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const getReturnTrackingStatusBadgeClass = (
  status: ReturnPackageTrackingStatus,
): string => {
  switch (status) {
    case "PICKUP_COMPLETED":
    case "DELIVERED_TO_RETURN_WAREHOUSE":
    case "QC_COMPLETED":
    case "RETURN_CLOSED":
      return "text-bg-success";

    case "PICKUP_ATTEMPTED":
    case "QC_PENDING":
      return "text-bg-warning";

    case "IN_TRANSIT_TO_HUB":
    case "IN_TRANSIT_TO_RETURN_WAREHOUSE":
      return "text-bg-info";

    case "PICKUP_SCHEDULED":
    case "PICKUP_ASSIGNED":
    case "RECEIVED_AT_HUB":
    default:
      return "text-bg-light border";
  }
};

export const getPickupProofStatusBadgeClass = (
  status: ReturnPickupProofVerificationStatus,
): string => {
  switch (status) {
    case "VERIFIED":
      return "text-bg-success";

    case "REJECTED":
      return "text-bg-danger";

    case "PENDING_VERIFICATION":
    default:
      return "text-bg-warning";
  }
};

// OPTIMIZED: Replaced O(n log n) sort with an O(n) single pass reduce
export const getLatestReturnTrackingEvent = (
  events: ReturnPackageTrackingEvent[],
): ReturnPackageTrackingEvent | null => {
  if (events.length === 0) return null;
  
  return events.reduce((latest, current) => {
    return new Date(current.createdAt).getTime() > new Date(latest.createdAt).getTime()
      ? current
      : latest;
  }, events[0]);
};

// OPTIMIZED: Replaced O(n log n) sort with an O(n) single pass reduce
export const getLatestPickupProof = (
  proofs: ReturnPickupProof[],
): ReturnPickupProof | null => {
  if (proofs.length === 0) return null;

  return proofs.reduce((latest, current) => {
    return new Date(current.uploadedAt).getTime() > new Date(latest.uploadedAt).getTime()
      ? current
      : latest;
  }, proofs[0]);
};

export const isPickupProofActionable = (
  proof: ReturnPickupProof,
): boolean => {
  return proof.verificationStatus === "PENDING_VERIFICATION";
};

export const getDefaultTrackingTitle = (
  status: ReturnPackageTrackingStatus,
): string => {
  return formatReturnTrackingStatus(status);
};

export const getDefaultTrackingDescription = (
  status: ReturnPackageTrackingStatus,
): string => {
  switch (status) {
    case "PICKUP_SCHEDULED":
      return "Return pickup has been scheduled.";
    case "PICKUP_ASSIGNED":
      return "Pickup partner or pickup agent has been assigned.";
    case "PICKUP_ATTEMPTED":
      return "Pickup attempt was made by the pickup agent.";
    case "PICKUP_COMPLETED":
      return "Return package has been picked up from the customer.";
    case "IN_TRANSIT_TO_HUB":
      return "Return package is moving to the logistics hub.";
    case "RECEIVED_AT_HUB":
      return "Return package has reached the logistics hub.";
    case "IN_TRANSIT_TO_RETURN_WAREHOUSE":
      return "Return package is moving to the return warehouse.";
    case "DELIVERED_TO_RETURN_WAREHOUSE":
      return "Return package has been delivered to the return warehouse.";
    case "QC_PENDING":
      return "Return package is waiting for warehouse quality check.";
    case "QC_COMPLETED":
      return "Warehouse quality check is completed.";
    case "RETURN_CLOSED":
      return "Return workflow is closed.";
    default:
      return "Return tracking status updated.";
  }
};

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result));
    };

    reader.onerror = () => {
      reject(new Error("Unable to read selected file."));
    };

    reader.readAsDataURL(file);
  });
};