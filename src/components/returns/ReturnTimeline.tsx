import type { ReturnRequest } from "../../types/returnRequest";
import { formatReturnLabel } from "../../utils/returnWorkflowUtils";

interface ReturnTimelineProps {
  request: ReturnRequest;
}

interface ReturnTrackingSubEvent {
  label: string;
  description: string;
  date?: string | null;
  iconClassName: string;
}

interface ReturnTimelineStep {
  key: string;
  title: string;
  description: string;
  date?: string | null;
  isCompleted: boolean;
  isActive: boolean;
  isDanger?: boolean;
  iconClassName: string;
  subEvents: ReturnTrackingSubEvent[];
}

const hasReachedStep = (step: ReturnTimelineStep): boolean => {
  return step.isCompleted || step.isActive;
};

const formatDateTime = (date?: string | null): string => {
  if (!date) {
    return "Pending";
  }
  return new Date(date).toLocaleString("en-IN");
};

const getReturnTimelineSteps = (request: ReturnRequest): ReturnTimelineStep[] => {
  const isRejected = request.status === "REJECTED";
  const isCancelled = request.status === "CANCELLED";
  const isQualityFailed = request.status === "QUALITY_CHECK_FAILED";
  const isReturnStopped = isRejected || isCancelled || isQualityFailed;

  const requestedAt = request.createdAt ?? request.requestedAt;

  // Evaluation arrays mapping valid subsequent state points
  const hasApproved = Boolean(request.approvedAt) || [
    "APPROVED", "PICKUP_SCHEDULED", "PICKED_UP", "PICKUP_COMPLETED",
    "RECEIVED_AT_WAREHOUSE", "QUALITY_CHECK_PENDING", "QUALITY_CHECK_PASSED",
    "QUALITY_CHECK_FAILED", "REFUND_INITIATED", "REFUNDED", "REFUND_COMPLETED", "CLOSED"
  ].includes(request.status);

  const hasPickup = Boolean(request.pickupCompletedAt) || Boolean(request.pickedUpAt) || 
    Boolean(request.pickupScheduledAt) || Boolean(request.pickupDate) || [
    "PICKUP_SCHEDULED", "PICKED_UP", "PICKUP_COMPLETED", "RECEIVED_AT_WAREHOUSE",
    "QUALITY_CHECK_PENDING", "QUALITY_CHECK_PASSED", "QUALITY_CHECK_FAILED",
    "REFUND_INITIATED", "REFUNDED", "REFUND_COMPLETED", "CLOSED"
  ].includes(request.status);

  const hasWarehouse = Boolean(request.receivedAtWarehouseAt) || [
    "RECEIVED_AT_WAREHOUSE", "QUALITY_CHECK_PENDING", "QUALITY_CHECK_PASSED",
    "QUALITY_CHECK_FAILED", "REFUND_INITIATED", "REFUNDED", "REFUND_COMPLETED", "CLOSED"
  ].includes(request.status);

  const hasQualityCheck = Boolean(request.qualityCheckedAt) || [
    "QUALITY_CHECK_PENDING", "QUALITY_CHECK_PASSED", "QUALITY_CHECK_FAILED",
    "REFUND_INITIATED", "REFUNDED", "REFUND_COMPLETED", "CLOSED"
  ].includes(request.status);

  return [
    {
      key: "REQUESTED",
      title: "Return Requested",
      description: "Return request was submitted by the customer.",
      date: requestedAt,
      isCompleted: true,
      isActive: request.status === "REQUESTED",
      iconClassName: "bi bi-arrow-return-left",
      subEvents: [
        {
          label: "Request Created",
          description: request.customerComment ?? request.comments ?? "Customer submitted the return request.",
          date: requestedAt,
          iconClassName: "bi bi-pencil-square",
        },
        {
          label: "Return Reason",
          description: request.returnReason ?? request.reason,
          date: requestedAt,
          iconClassName: "bi bi-chat-left-text",
        },
      ],
    },
    {
      key: "APPROVED",
      title: isRejected ? "Return Rejected" : isCancelled ? "Return Cancelled" : "Return Approved",
      description: isReturnStopped
        ? `Return process stopped. Current status: ${formatReturnLabel(request.status)}.`
        : "Return request was approved for pickup.",
      date: request.approvedAt ?? request.rejectedAt ?? request.cancelledAt,
      isCompleted: hasApproved || isReturnStopped,
      isActive: ["APPROVED", "REJECTED", "CANCELLED"].includes(request.status),
      isDanger: isRejected || isCancelled,
      iconClassName: isRejected || isCancelled ? "bi bi-x-circle" : "bi bi-check2-circle",
      subEvents: [
        ...(request.approvedAt ? [{
          label: "Approved",
          description: request.adminRemarks ?? "Return request approved by support.",
          date: request.approvedAt,
          iconClassName: "bi bi-check2-circle",
        }] : []),
        ...(request.rejectedAt ? [{
          label: "Rejected",
          description: request.adminRemarks ?? "Return request was rejected after review.",
          date: request.rejectedAt,
          iconClassName: "bi bi-x-circle",
        }] : []),
        ...(request.cancelledAt ? [{
          label: "Cancelled",
          description: request.adminRemarks ?? "Return request was cancelled.",
          date: request.cancelledAt,
          iconClassName: "bi bi-slash-circle",
        }] : []),
      ],
    },
    {
      key: "PICKUP",
      title: "Package Pickup",
      description: isReturnStopped && !hasPickup
        ? "Pickup cancelled due to workflow termination."
        : request.pickupSlot && request.pickupDate
        ? `Pickup scheduled for ${new Date(request.pickupDate).toLocaleDateString("en-IN")} · ${request.pickupSlot}.`
        : "Pickup will be scheduled after return approval.",
      date: request.pickupCompletedAt ?? request.pickedUpAt ?? request.pickupScheduledAt ?? request.pickupDate,
      isCompleted: hasPickup && !["PICKUP_SCHEDULED", "APPROVED"].includes(request.status) && !isReturnStopped,
      isActive: ["PICKUP_SCHEDULED", "PICKED_UP", "PICKUP_COMPLETED"].includes(request.status),
      isDanger: isReturnStopped && !hasPickup,
      iconClassName: isReturnStopped && !hasPickup ? "bi bi-truck border-danger text-danger" : "bi bi-truck",
      subEvents: [
        ...(request.pickupScheduledAt || request.pickupDate ? [{
          label: "Pickup Scheduled",
          description: request.pickupDate && request.pickupSlot
            ? `Pickup scheduled for ${new Date(request.pickupDate).toLocaleDateString("en-IN")} · ${request.pickupSlot}.`
            : "Pickup has been scheduled.",
          date: request.pickupScheduledAt ?? request.pickupDate,
          iconClassName: "bi bi-calendar-check",
        }] : []),
        ...(request.pickedUpAt || request.pickupCompletedAt ? [{
          label: "Picked Up",
          description: request.adminRemarks ?? "Return package was collected from customer.",
          date: request.pickedUpAt ?? request.pickupCompletedAt,
          iconClassName: "bi bi-box-arrow-up",
        }] : []),
      ],
    },
    {
      key: "WAREHOUSE",
      title: "Received At Warehouse",
      description: isReturnStopped && !hasWarehouse 
        ? "Fulfillment terminated before warehouse receipt." 
        : "Returned item is received and ready for quality check.",
      date: request.receivedAtWarehouseAt,
      isCompleted: hasWarehouse && request.status !== "RECEIVED_AT_WAREHOUSE" && !isReturnStopped,
      isActive: request.status === "RECEIVED_AT_WAREHOUSE",
      isDanger: isReturnStopped && !hasWarehouse,
      iconClassName: "bi bi-box-seam",
      subEvents: [
        ...(request.receivedAtWarehouseAt ? [{
          label: "Warehouse Received",
          description: request.adminRemarks ?? "Returned item was received at warehouse.",
          date: request.receivedAtWarehouseAt,
          iconClassName: "bi bi-house-check",
        }] : []),
      ],
    },
    {
      key: "QUALITY_CHECK",
      title: "Quality Check",
      description: isQualityFailed 
        ? `QC Failed: ${request.qualityCheckRemarks ?? "Item condition check rejected."}`
        : isReturnStopped && !hasQualityCheck
        ? "Fulfillment terminated before inspection."
        : request.qualityCheckRemarks ?? "Warehouse team checks item condition and return eligibility.",
      date: request.qualityCheckedAt,
      isCompleted: hasQualityCheck && !["QUALITY_CHECK_PENDING", "QUALITY_CHECK_PASSED", "QUALITY_CHECK_FAILED"].includes(request.status) && !isReturnStopped,
      isActive: ["QUALITY_CHECK_PENDING", "QUALITY_CHECK_PASSED", "QUALITY_CHECK_FAILED"].includes(request.status),
      isDanger: isQualityFailed || (isReturnStopped && !hasQualityCheck),
      iconClassName: isQualityFailed ? "bi bi-x-diamond text-danger" : "bi bi-clipboard-check",
      subEvents: [
        ...(request.status === "QUALITY_CHECK_PENDING" ? [{
          label: "QC Started",
          description: request.qualityCheckRemarks ?? "Quality check is currently in progress.",
          date: request.receivedAtWarehouseAt,
          iconClassName: "bi bi-hourglass-split",
        }] : []),
        ...(request.qualityCheckedAt ? [{
          label: isQualityFailed ? "QC Failed" : "QC Passed",
          description: request.qualityCheckRemarks ?? (isQualityFailed
            ? "Quality check failed. Refund is not eligible."
            : "Quality check passed. Refund can be initiated."),
          date: request.qualityCheckedAt,
          iconClassName: isQualityFailed ? "bi bi-x-circle text-danger" : "bi bi-check2-square",
        }] : []),
      ],
    },
    {
      key: "REFUND",
      title: "Refund Settlement",
      description: isReturnStopped && !isQualityFailed
        ? "No refund process initiated due to cancellation/rejection."
        : request.refundId
        ? `Refund request ${request.refundId} is linked to this return.`
        : "Refund will be initiated after quality check approval.",
      date: request.refundCompletedAt ?? request.refundedAt ?? request.refundInitiatedAt,
      isCompleted: ["REFUNDED", "REFUND_COMPLETED", "CLOSED"].includes(request.status),
      isActive: request.status === "REFUND_INITIATED",
      isDanger: isQualityFailed || (isReturnStopped && !["REFUNDED", "REFUND_COMPLETED", "CLOSED"].includes(request.status)),
      iconClassName: "bi bi-cash-coin",
      subEvents: [
        ...(request.refundInitiatedAt ? [{
          label: "Refund Initiated",
          description: request.refundId ? `Refund request ${request.refundId} is linked to this return.` : "Refund settlement has been initiated.",
          date: request.refundInitiatedAt,
          iconClassName: "bi bi-arrow-counterclockwise",
        }] : []),
        ...(request.refundedAt || request.refundCompletedAt ? [{
          label: "Refund Completed",
          description: request.adminRemarks ?? "Refund settlement was completed successfully.",
          date: request.refundCompletedAt ?? request.refundedAt,
          iconClassName: "bi bi-cash-stack",
        }] : []),
      ],
    },
  ];
};

const ReturnTimeline = ({ request }: ReturnTimelineProps) => {
  const steps = getReturnTimelineSteps(request);

  return (
    <div className="return-progress-card">
      <div className="return-progress-header">
        <div>
          <h6 className="fw-bold mb-1">Return Fulfillment Progress</h6>
          <p className="text-muted small mb-0">
            Current status: <strong>{formatReturnLabel(request.status)}</strong>
          </p>
        </div>
        <span className={`return-progress-status ${request.status.toLowerCase()}`}>
          {formatReturnLabel(request.status)}
        </span>
      </div>

      <div className="return-progress-timeline">
        {steps.map((step, index) => {
          const shouldShowDetails = hasReachedStep(step);

          return (
            <div
              className={`return-progress-step ${step.isCompleted ? "completed" : ""} ${
                step.isActive ? "active" : ""
              } ${step.isDanger ? "return-progress-step-danger" : ""}`}
              key={step.key}
            >
              <div className="return-progress-marker">
                <span className="return-progress-icon">
                  <i className={step.iconClassName} />
                </span>
                {index < steps.length - 1 ? <span className="return-progress-line" /> : null}
              </div>

              <div className="return-progress-content">
                <h6>{step.title}</h6>
                {shouldShowDetails ? (
                  <>
                    <p>{step.description}</p>
                    <span>{formatDateTime(step.date)}</span>

                    {step.subEvents.length > 0 ? (
                      <div className="return-progress-sub-events">
                        {step.subEvents.map((event, subIndex) => (
                          <div
                            className="return-progress-sub-event"
                            key={`${step.key}-sub-${subIndex}`}
                          >
                            <i className={event.iconClassName} />
                            <div>
                              <strong>{event.label}</strong>
                              <p>{event.description}</p>
                              <span>{formatDateTime(event.date)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="return-progress-hidden-detail">
                    {step.isDanger 
                      ? "Stage skipped due to request closure." 
                      : "Details will appear after this stage is reached."}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReturnTimeline;