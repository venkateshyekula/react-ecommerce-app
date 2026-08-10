import type {
  ChangeEvent,
  FC
} from "react";
import {
  useMemo,
  useState
} from "react";

import {
  agentMobileExperienceService,
  getCurrentCoordinates
} from "../../services/agentMobileExperienceService";

import type {
  AgentMobileFailureReason,
  AgentMobileTask,
  AgentMobileTaskPriority,
  AgentMobileTaskStatus,
  AgentMobileTaskUpdatePayload
} from "../../types/agentMobileExperience";

import {
  resolveCoordinates
} from "../../utils/geocoding";

/* ==========================================================================
   Types
   ========================================================================== */

export interface AgentMobileTaskCardProps {
  task: AgentMobileTask;

  onUpdateStatus: (
    payload: AgentMobileTaskUpdatePayload
  ) => Promise<void>;

  onSelectTask?: (
    task: AgentMobileTask
  ) => void;

  disabled?: boolean;
}

interface StatusTransitionOptions {
  notes?: string;
  failureReason?: AgentMobileFailureReason;
  proofOtp?: string;
  proofImageUrl?: string;
}

interface FailureReasonOption {
  value: AgentMobileFailureReason;
  label: string;
}

/* ==========================================================================
   Constants
   ========================================================================== */

const MAX_PROOF_IMAGE_BYTES =
  3 * 1024 * 1024;

const MAX_PROOF_NOTES_LENGTH = 500;
const MAX_FAILURE_NOTES_LENGTH = 500;
const MAX_OTP_LENGTH = 8;

const failureReasonOptions:
  FailureReasonOption[] = [
    {
      value: "CUSTOMER_NOT_AVAILABLE",
      label: "Customer not available"
    },
    {
      value: "ADDRESS_NOT_FOUND",
      label: "Address not found"
    },
    {
      value: "CUSTOMER_REFUSED",
      label: "Customer refused"
    },
    {
      value: "PACKAGE_NOT_READY",
      label: "Package not ready"
    },
    {
      value: "AGENT_VEHICLE_ISSUE",
      label: "Agent vehicle issue"
    },
    {
      value: "WEATHER_DELAY",
      label: "Weather delay"
    },
    {
      value: "OTHER",
      label: "Other"
    }
  ];

/* ==========================================================================
   Formatting Helpers
   ========================================================================== */

const formatEnumLabel = (
  value: string
): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
};

const formatAmount = (
  amount?: number
): string => {
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount)
  ) {
    return "N/A";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }
  ).format(amount);
};

const formatDistance = (
  distance?: number
): string => {
  if (
    typeof distance !== "number" ||
    !Number.isFinite(distance)
  ) {
    return "N/A";
  }

  return `${distance.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2
    }
  )} km`;
};

const formatTravelTime = (
  minutes?: number
): string => {
  if (
    typeof minutes !== "number" ||
    !Number.isFinite(minutes)
  ) {
    return "N/A";
  }

  if (minutes < 60) {
    return `${Math.max(
      0,
      Math.round(minutes)
    )} min`;
  }

  const hours =
    Math.floor(minutes / 60);

  const remainingMinutes =
    Math.round(minutes % 60);

  return remainingMinutes > 0
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} hr`;
};

/* ==========================================================================
   Badge Helpers
   ========================================================================== */

const getPriorityBadgeStyle = (
  priority: AgentMobileTaskPriority
): string => {
  switch (priority) {
    case "CRITICAL":
      return "text-bg-danger";

    case "HIGH":
      return "text-bg-warning text-dark";

    case "MEDIUM":
      return "text-bg-info text-dark";

    case "LOW":
    default:
      return "text-bg-secondary";
  }
};

const getStatusBadgeStyle = (
  status: AgentMobileTaskStatus
): string => {
  switch (status) {
    case "COMPLETED":
    case "DELIVERED":
    case "PICKED_UP":
      return "text-bg-success";

    case "IN_PROGRESS":
    case "REACHED_LOCATION":
      return "text-bg-primary";

    case "ACCEPTED":
      return "text-bg-info text-dark";

    case "RESCHEDULED":
      return "text-bg-warning text-dark";

    case "FAILED":
    case "CANCELLED":
      return "text-bg-danger";

    case "ASSIGNED":
    default:
      return "text-bg-secondary";
  }
};

const getProofStatusBadgeStyle = (
  proofStatus: AgentMobileTask["proofStatus"]
): string => {
  switch (proofStatus) {
    case "VERIFIED":
      return "text-bg-success";

    case "SUBMITTED":
      return "text-bg-primary";

    case "REJECTED":
      return "text-bg-danger";

    case "PENDING":
      return "text-bg-warning text-dark";

    case "NOT_REQUIRED":
    default:
      return "text-bg-secondary";
  }
};

/* ==========================================================================
   File Helpers
   ========================================================================== */

const convertFileToDataUrl = (
  file: File
): Promise<string> => {
  return new Promise(
    (resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (
          typeof reader.result !==
          "string"
        ) {
          reject(
            new Error(
              "The selected proof image could not be processed."
            )
          );

          return;
        }

        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(
          new Error(
            "The selected proof image could not be read."
          )
        );
      };

      reader.readAsDataURL(file);
    }
  );
};

const isSupportedImageFile = (
  file: File
): boolean => {
  return [
    "image/jpeg",
    "image/png",
    "image/webp"
  ].includes(file.type);
};

/* ==========================================================================
   Task Workflow Helpers
   ========================================================================== */

const getSuccessfulStatus = (
  taskType: AgentMobileTask["taskType"]
): AgentMobileTaskStatus => {
  switch (taskType) {
    case "RETURN_PICKUP":
      return "PICKED_UP";

    case "DELIVERY":
      return "DELIVERED";

    case "PROOF_VERIFICATION":
    case "SUPPORT_VISIT":
    default:
      return "COMPLETED";
  }
};

const getSuccessfulButtonLabel = (
  taskType: AgentMobileTask["taskType"]
): string => {
  switch (taskType) {
    case "RETURN_PICKUP":
      return "Confirm Pickup";

    case "DELIVERY":
      return "Confirm Delivery";

    case "PROOF_VERIFICATION":
      return "Complete Verification";

    case "SUPPORT_VISIT":
      return "Complete Visit";

    default:
      return "Mark Completed";
  }
};

const requiresLiveCoordinates = (
  nextStatus: AgentMobileTaskStatus
): boolean => {
  return [
    "REACHED_LOCATION",
    "PICKED_UP",
    "DELIVERED"
  ].includes(nextStatus);
};

/* ==========================================================================
   Agent Mobile Task Card
   ========================================================================== */

export const AgentMobileTaskCard: FC<
  AgentMobileTaskCardProps
> = ({
  task,
  onUpdateStatus,
  onSelectTask,
  disabled = false
}) => {
  const [isSaving, setIsSaving] =
    useState<boolean>(false);

  const [
    errorMessage,
    setErrorMessage
  ] = useState<string>("");

  const [
    showProofForm,
    setShowProofForm
  ] = useState<boolean>(false);

  const [
    showFailureForm,
    setShowFailureForm
  ] = useState<boolean>(false);

  const [proofOtp, setProofOtp] =
    useState<string>("");

  const [
    proofNotes,
    setProofNotes
  ] = useState<string>("");

  const [
    proofImageUrl,
    setProofImageUrl
  ] = useState<string>("");

  const [
    proofFileName,
    setProofFileName
  ] = useState<string>("");

  const [
    failureReason,
    setFailureReason
  ] = useState<
    AgentMobileFailureReason | ""
  >("");

  const [
    failureNotes,
    setFailureNotes
  ] = useState<string>("");

  /* ==========================================================================
     Derived Values
     ========================================================================== */

  const fullAddress = useMemo(
    () => {
      const addressParts = [
        task.address.addressLine1,
        task.address.addressLine2,
        task.address.landmark,
        task.address.city,
        task.address.state,
        task.address.pincode
      ].filter(
        (value): value is string =>
          typeof value === "string" &&
          value.trim().length > 0
      );

      return Array.from(
        new Set(addressParts)
      ).join(", ");
    },
    [task.address]
  );

  const mapUrl = useMemo(
    () => {
      return resolveCoordinates(
        task.address.latitude,
        task.address.longitude,
        fullAddress
      );
    },
    [
      fullAddress,
      task.address.latitude,
      task.address.longitude
    ]
  );

  const phoneLink =
    task.customer.customerPhone
      ? `tel:${task.customer.customerPhone}`
      : undefined;

  const emailLink =
    task.customer.customerEmail
      ? `mailto:${task.customer.customerEmail}`
      : undefined;

  const hasNewProof =
    Boolean(proofImageUrl) ||
    Boolean(proofOtp.trim());

  const hasExistingAcceptableProof =
    task.proofStatus ===
      "SUBMITTED" ||
    task.proofStatus ===
      "VERIFIED";

  const canFinishProofRequiredTask =
    hasNewProof ||
    hasExistingAcceptableProof;

  const isActionDisabled =
    disabled || isSaving;

  /* ==========================================================================
     Form Reset Helpers
     ========================================================================== */

  const resetProofForm = (): void => {
    setShowProofForm(false);
    setProofOtp("");
    setProofNotes("");
    setProofImageUrl("");
    setProofFileName("");
  };

  const resetFailureForm =
    (): void => {
      setShowFailureForm(false);
      setFailureReason("");
      setFailureNotes("");
    };

  const resetActionForms =
    (): void => {
      resetProofForm();
      resetFailureForm();
    };

  /* ==========================================================================
     Coordinate Capture
     ========================================================================== */

  const captureCoordinates = async (
    required: boolean
  ): Promise<
    | {
        latitude: number;
        longitude: number;
      }
    | undefined
  > => {
    try {
      return await getCurrentCoordinates();
    } catch (caughtError) {
      if (!required) {
        return undefined;
      }

      throw new Error(
        caughtError instanceof Error
          ? caughtError.message
          : "Live location is required for this action. Enable location permission and try again."
      );
    }
  };

  /* ==========================================================================
     Status Update
     ========================================================================== */

  const handleStatusTransition =
    async (
      nextStatus: AgentMobileTaskStatus,
      options?: StatusTransitionOptions
    ): Promise<void> => {
      if (isActionDisabled) {
        return;
      }

      setIsSaving(true);
      setErrorMessage("");

      try {
        const coordinates =
          await captureCoordinates(
            requiresLiveCoordinates(
              nextStatus
            )
          );

        await onUpdateStatus({
          task,
          nextStatus,
          notes:
            options?.notes?.trim() ||
            undefined,
          failureReason:
            options?.failureReason,
          proofOtp:
            options?.proofOtp?.trim() ||
            undefined,
          proofImageUrl:
            options?.proofImageUrl ||
            undefined,
          coordinates
        });

        resetActionForms();
      } catch (caughtError) {
        setErrorMessage(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to update the task status."
        );
      } finally {
        setIsSaving(false);
      }
    };

  /* ==========================================================================
     Proof Image
     ========================================================================== */

  const handleProofImageChange =
    async (
      event: ChangeEvent<HTMLInputElement>
    ): Promise<void> => {
      setErrorMessage("");

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (!isSupportedImageFile(file)) {
        setErrorMessage(
          "Select a JPG, PNG, or WEBP image."
        );

        event.target.value = "";
        return;
      }

      if (
        file.size >
        MAX_PROOF_IMAGE_BYTES
      ) {
        setErrorMessage(
          "Proof image must not exceed 3 MB."
        );

        event.target.value = "";
        return;
      }

      try {
        const dataUrl =
          await convertFileToDataUrl(
            file
          );

        setProofImageUrl(dataUrl);
        setProofFileName(file.name);
      } catch (caughtError) {
        setErrorMessage(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to process the selected proof image."
        );

        event.target.value = "";
      }
    };

  const handleRemoveProofImage =
    (): void => {
      setProofImageUrl("");
      setProofFileName("");
      setErrorMessage("");
    };

  /* ==========================================================================
     Proof Completion
     ========================================================================== */

  const handleSuccessfulCompletion =
    async (): Promise<void> => {
      if (
        task.proofRequired &&
        !canFinishProofRequiredTask
      ) {
        setShowProofForm(true);

        setErrorMessage(
          "Upload a proof image or enter the customer OTP before completing this task."
        );

        return;
      }

      await handleStatusTransition(
        getSuccessfulStatus(
          task.taskType
        ),
        {
          notes: proofNotes,
          proofOtp,
          proofImageUrl
        }
      );
    };

  const handleProofSubmission =
    async (): Promise<void> => {
      if (!hasNewProof) {
        setErrorMessage(
          "Upload a proof image or enter the customer OTP."
        );

        return;
      }

      await handleSuccessfulCompletion();
    };

  /* ==========================================================================
     Failure Submission
     ========================================================================== */

  const handleFailureSubmit =
    async (): Promise<void> => {
      if (!failureReason) {
        setErrorMessage(
          "Select a failure reason."
        );

        return;
      }

      if (
        failureReason === "OTHER" &&
        !failureNotes.trim()
      ) {
        setErrorMessage(
          "Enter failure notes when Other is selected."
        );

        return;
      }

      await handleStatusTransition(
        "FAILED",
        {
          failureReason,
          notes: failureNotes
        }
      );
    };

  /* ==========================================================================
     Toggle Handlers
     ========================================================================== */

  const handleToggleProofForm =
    (): void => {
      setShowProofForm(
        (currentValue) =>
          !currentValue
      );

      setShowFailureForm(false);
      setErrorMessage("");
    };

  const handleToggleFailureForm =
    (): void => {
      setShowFailureForm(
        (currentValue) =>
          !currentValue
      );

      setShowProofForm(false);
      setErrorMessage("");
    };

  /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <article
      className={[
        "card",
        "border",
        "rounded-4",
        "shadow-sm",
        "mb-3",
        "bg-white",
        disabled
          ? "opacity-75"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() =>
        onSelectTask?.(task)
      }
    >
      <div className="card-body p-3">
        {/* Header */}
        <header className="d-flex align-items-start justify-content-between gap-3 border-bottom pb-3 mb-3">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span
              className={`badge rounded-pill ${getPriorityBadgeStyle(
                task.priority
              )}`}
            >
              {formatEnumLabel(
                task.priority
              )}
            </span>

            <span
              className={`badge rounded-pill ${getStatusBadgeStyle(
                task.status
              )}`}
            >
              {formatEnumLabel(
                task.status
              )}
            </span>

            <span className="badge rounded-pill text-bg-light border">
              {formatEnumLabel(
                task.taskType
              )}
            </span>
          </div>

          <span className="small text-muted font-monospace text-break text-end">
            {task.taskId}
          </span>
        </header>

        {/* Product and Tracking */}
        <section className="mb-3">
          <h2 className="h6 fw-bold text-dark mb-1">
            {task.productName ||
              "General Pickup or Delivery"}
          </h2>

          <div className="d-flex flex-wrap gap-3 small text-muted">
            {task.trackingId ? (
              <span>
                AWB:{" "}
                <strong className="font-monospace text-dark">
                  {task.trackingId}
                </strong>
              </span>
            ) : null}

            {task.returnRequestId ? (
              <span>
                Return:{" "}
                <strong className="font-monospace text-dark">
                  {
                    task.returnRequestId
                  }
                </strong>
              </span>
            ) : null}

            {task.orderId ? (
              <span>
                Order:{" "}
                <strong className="font-monospace text-dark">
                  {task.orderId}
                </strong>
              </span>
            ) : null}
          </div>
        </section>

        {/* Customer and Address */}
        <section className="bg-light border rounded-3 p-3 mb-3 small">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <div>
              <div className="fw-semibold text-dark">
                {task.customer
                  .customerName ||
                  "Customer"}
              </div>

              {task.customer
                .customerPhone ? (
                <div className="text-muted">
                  {
                    task.customer
                      .customerPhone
                  }
                </div>
              ) : null}
            </div>

            <div
              className="d-flex flex-wrap gap-2"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              {phoneLink ? (
                <a
                  href={phoneLink}
                  className="btn btn-outline-secondary btn-sm"
                >
                  <i
                    className="bi bi-telephone-fill me-1"
                    aria-hidden="true"
                  />
                  Call
                </a>
              ) : null}

              {emailLink ? (
                <a
                  href={emailLink}
                  className="btn btn-outline-secondary btn-sm"
                >
                  <i
                    className="bi bi-envelope me-1"
                    aria-hidden="true"
                  />
                  Email
                </a>
              ) : null}
            </div>
          </div>

          <p className="text-muted mb-2">
            {fullAddress ||
              "Address unavailable"}
          </p>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top">
            <div className="d-flex flex-wrap gap-3 text-muted">
              <span>
                Distance:{" "}
                <strong className="text-dark">
                  {formatDistance(
                    task.routeDistanceKm
                  )}
                </strong>
              </span>

              <span>
                ETA:{" "}
                <strong className="text-dark">
                  {formatTravelTime(
                    task.estimatedTravelMinutes
                  )}
                </strong>
              </span>
            </div>

            {mapUrl ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary btn-sm"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <i
                  className="bi bi-geo-alt-fill text-danger me-1"
                  aria-hidden="true"
                />
                Navigate
              </a>
            ) : null}
          </div>
        </section>

        {/* Task Information */}
        <section className="row g-3 small mb-3">
          <div className="col-6 col-md-3">
            <span className="d-block text-secondary">
              Scheduled
            </span>

            <strong className="text-dark">
              {task.scheduledAt
                ? agentMobileExperienceService.formatDateTime(
                    task.scheduledAt
                  )
                : "N/A"}
            </strong>
          </div>

          <div className="col-6 col-md-3">
            <span className="d-block text-secondary">
              Collect Amount
            </span>

            <strong className="text-dark">
              {formatAmount(
                task.amountToCollect
              )}
            </strong>
          </div>

          <div className="col-6 col-md-3">
            <span className="d-block text-secondary">
              Packages
            </span>

            <strong className="text-dark">
              {task.packageCount}
            </strong>
          </div>

          <div className="col-6 col-md-3">
            <span className="d-block text-secondary mb-1">
              Proof
            </span>

            <span
              className={`badge ${getProofStatusBadgeStyle(
                task.proofStatus
              )}`}
            >
              {formatEnumLabel(
                task.proofStatus
              )}
            </span>
          </div>
        </section>

        {/* Attempts and Failure */}
        {task.attemptCount > 0 ||
        task.failureReason ? (
          <section className="border rounded-3 p-3 mb-3 small">
            <div className="row g-2">
              <div className="col-sm-4">
                <span className="d-block text-secondary">
                  Attempts
                </span>

                <strong>
                  {task.attemptCount}
                </strong>
              </div>

              {task.failureReason ? (
                <div className="col-sm-8">
                  <span className="d-block text-secondary">
                    Last Failure
                  </span>

                  <strong className="text-danger">
                    {formatEnumLabel(
                      task.failureReason
                    )}
                  </strong>
                </div>
              ) : null}
            </div>

            {task.failureNotes ? (
              <p className="text-muted mt-2 mb-0">
                {task.failureNotes}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* Customer Instructions */}
        {task.customerInstructions ? (
          <div
            className="alert alert-warning py-2 px-3 mb-3 small"
            role="note"
          >
            <strong>
              Customer instructions:
            </strong>{" "}
            {task.customerInstructions}
          </div>
        ) : null}

        {/* Existing Proof */}
        {task.proofImageUrl ? (
          <section className="border rounded-3 p-3 mb-3">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
              <h3 className="h6 fw-bold mb-0">
                Submitted Proof
              </h3>

              <span
                className={`badge ${getProofStatusBadgeStyle(
                  task.proofStatus
                )}`}
              >
                {formatEnumLabel(
                  task.proofStatus
                )}
              </span>
            </div>

            <img
              src={task.proofImageUrl}
              alt="Submitted Proof"
              className="img-fluid rounded border mb-2"
              style={{ maxHeight: "200px", objectFit: "cover" }}
            />

            {task.proofNotes ? (
              <p className="small text-muted mt-2 mb-0">
                {task.proofNotes}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* Proof Toggle */}
        {task.proofRequired &&
        (task.canSubmitProof ||
          task.canComplete) ? (
          <div
            className="mb-3"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="btn btn-outline-primary btn-sm w-100"
              disabled={
                isActionDisabled
              }
              aria-expanded={
                showProofForm
              }
              onClick={
                handleToggleProofForm
              }
            >
              <i
                className="bi bi-camera-fill me-2"
                aria-hidden="true"
              />

              {showProofForm
                ? "Hide Proof Form"
                : hasExistingAcceptableProof
                  ? "Replace or Update Proof"
                  : "Add Photo or OTP Proof"}
            </button>
          </div>
        ) : null}

        {/* Proof Form */}
        {showProofForm ? (
          <section
            className="border rounded-3 p-3 mb-3 bg-light"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h3 className="h6 fw-bold mb-3">
              Completion Proof
            </h3>

            <div className="mb-3">
              <label
                htmlFor={`proof-image-${task.id}`}
                className="form-label small fw-semibold"
              >
                Capture or upload image
              </label>

              <input
                id={`proof-image-${task.id}`}
                className="form-control form-control-sm"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                disabled={
                  isActionDisabled
                }
                onChange={(event) =>
                  void handleProofImageChange(
                    event
                  )
                }
              />

              <div className="form-text">
                JPG, PNG, or WEBP image up
                to 3 MB.
              </div>
            </div>

            {proofImageUrl ? (
              <div className="mb-3">
                <img
                  src={proofImageUrl}
                  alt="Proof preview"
                  className="img-fluid rounded border mb-2"
                  style={{ maxHeight: "200px", objectFit: "cover" }}
                />

                <div className="d-flex align-items-center justify-content-between gap-2 mt-2">
                  <small className="text-muted text-break">
                    {proofFileName}
                  </small>

                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    disabled={
                      isActionDisabled
                    }
                    onClick={
                      handleRemoveProofImage
                    }
                  >
                    <i
                      className="bi bi-trash me-1"
                      aria-hidden="true"
                    />

                    Remove
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mb-3">
              <label
                htmlFor={`proof-otp-${task.id}`}
                className="form-label small fw-semibold"
              >
                Customer OTP
              </label>

              <input
                id={`proof-otp-${task.id}`}
                className="form-control form-control-sm"
                type="text"
                value={proofOtp}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={
                  MAX_OTP_LENGTH
                }
                placeholder="Enter customer OTP"
                disabled={
                  isActionDisabled
                }
                onChange={(event) =>
                  setProofOtp(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(
                        0,
                        MAX_OTP_LENGTH
                      )
                  )
                }
              />
            </div>

            <div className="mb-3">
              <label
                htmlFor={`proof-notes-${task.id}`}
                className="form-label small fw-semibold"
              >
                Proof notes
              </label>

              <textarea
                id={`proof-notes-${task.id}`}
                className="form-control form-control-sm"
                rows={3}
                value={proofNotes}
                maxLength={
                  MAX_PROOF_NOTES_LENGTH
                }
                placeholder="Add package condition or customer confirmation notes"
                disabled={
                  isActionDisabled
                }
                onChange={(event) =>
                  setProofNotes(
                    event.target.value
                  )
                }
              />

              <div className="form-text text-end">
                {proofNotes.length}/
                {
                  MAX_PROOF_NOTES_LENGTH
                }
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-success btn-sm flex-fill fw-semibold"
                disabled={
                  isActionDisabled ||
                  (!hasNewProof &&
                    !hasExistingAcceptableProof)
                }
                onClick={() =>
                  void handleProofSubmission()
                }
              >
                {isSaving ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      aria-hidden="true"
                    />

                    Submitting
                  </>
                ) : (
                  <>
                    <i
                      className="bi bi-check-circle me-2"
                      aria-hidden="true"
                    />

                    {getSuccessfulButtonLabel(
                      task.taskType
                    )}
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={
                  isActionDisabled
                }
                onClick={
                  resetProofForm
                }
              >
                Cancel
              </button>
            </div>
          </section>
        ) : null}

        {/* Failure Form */}
        {showFailureForm ? (
          <section
            className="border border-danger-subtle rounded-3 p-3 mb-3 bg-danger-subtle"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h3 className="h6 fw-bold text-danger mb-3">
              Report Failed Attempt
            </h3>

            <div className="mb-3">
              <label
                htmlFor={`failure-reason-${task.id}`}
                className="form-label small fw-semibold"
              >
                Failure reason
              </label>

              <select
                id={`failure-reason-${task.id}`}
                className="form-select form-select-sm"
                value={
                  failureReason
                }
                disabled={
                  isActionDisabled
                }
                onChange={(event) =>
                  setFailureReason(
                    event.target
                      .value as
                      | AgentMobileFailureReason
                      | ""
                  )
                }
              >
                <option value="">
                  Select reason
                </option>

                {failureReasonOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="mb-3">
              <label
                htmlFor={`failure-notes-${task.id}`}
                className="form-label small fw-semibold"
              >
                Failure notes
              </label>

              <textarea
                id={`failure-notes-${task.id}`}
                className="form-control form-control-sm"
                rows={3}
                value={failureNotes}
                maxLength={
                  MAX_FAILURE_NOTES_LENGTH
                }
                placeholder="Describe the failed attempt"
                disabled={
                  isActionDisabled
                }
                onChange={(event) =>
                  setFailureNotes(
                    event.target.value
                  )
                }
              />

              <div className="form-text text-end">
                {failureNotes.length}/
                {
                  MAX_FAILURE_NOTES_LENGTH
                }
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-danger btn-sm flex-fill"
                disabled={
                  isActionDisabled ||
                  !failureReason
                }
                onClick={() =>
                  void handleFailureSubmit()
                }
              >
                {isSaving ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      aria-hidden="true"
                    />

                    Submitting
                  </>
                ) : (
                  <>
                    <i
                      className="bi bi-exclamation-circle me-2"
                      aria-hidden="true"
                    />

                    Confirm Failure
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={
                  isActionDisabled
                }
                onClick={
                  resetFailureForm
                }
              >
                Cancel
              </button>
            </div>
          </section>
        ) : null}

        {/* Error */}
        {errorMessage ? (
          <div
            className="alert alert-danger py-2 px-3 mb-3 small"
            role="alert"
          >
            <i
              className="bi bi-exclamation-circle me-2"
              aria-hidden="true"
            />

            {errorMessage}
          </div>
        ) : null}

        {/* Workflow Actions */}
        <footer
          className="d-flex flex-wrap gap-2 pt-3 border-top"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          {task.canAccept ? (
            <button
              type="button"
              className="btn btn-primary btn-sm flex-fill fw-semibold"
              disabled={
                isActionDisabled
              }
              onClick={() =>
                void handleStatusTransition(
                  "ACCEPTED"
                )
              }
            >
              {isSaving
                ? "Processing..."
                : "Accept Task"}
            </button>
          ) : null}

          {task.canStart ? (
            <button
              type="button"
              className="btn btn-dark btn-sm flex-fill fw-semibold"
              disabled={
                isActionDisabled
              }
              onClick={() =>
                void handleStatusTransition(
                  "IN_PROGRESS"
                )
              }
            >
              {isSaving
                ? "Processing..."
                : "Start Journey"}
            </button>
          ) : null}

          {task.canMarkReached ? (
            <button
              type="button"
              className="btn btn-info btn-sm flex-fill fw-semibold text-dark"
              disabled={
                isActionDisabled
              }
              onClick={() =>
                void handleStatusTransition(
                  "REACHED_LOCATION"
                )
              }
            >
              {isSaving
                ? "Capturing Location..."
                : "Reached Location"}
            </button>
          ) : null}

          {task.canComplete &&
          !task.proofRequired ? (
            <button
              type="button"
              className="btn btn-success btn-sm flex-fill fw-semibold"
              disabled={
                isActionDisabled
              }
              onClick={() =>
                void handleSuccessfulCompletion()
              }
            >
              {isSaving
                ? "Processing..."
                : getSuccessfulButtonLabel(
                    task.taskType
                  )}
            </button>
          ) : null}

          {task.canComplete &&
          task.proofRequired &&
          hasExistingAcceptableProof ? (
            <button
              type="button"
              className="btn btn-success btn-sm flex-fill fw-semibold"
              disabled={
                isActionDisabled
              }
              onClick={() =>
                void handleSuccessfulCompletion()
              }
            >
              {isSaving
                ? "Processing..."
                : getSuccessfulButtonLabel(
                    task.taskType
                  )}
            </button>
          ) : null}

          {task.canFail ? (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm fw-semibold"
              disabled={
                isActionDisabled
              }
              aria-expanded={
                showFailureForm
              }
              onClick={
                handleToggleFailureForm
              }
            >
              <i
                className="bi bi-x-circle me-1"
                aria-hidden="true"
              />

              Mark Failed
            </button>
          ) : null}
        </footer>
      </div>
    </article>
  );
};

export default AgentMobileTaskCard;