import type { ReturnRequest } from "../../types/returnRequest";

type CustomerReturnExperienceTimelineProps = {
  request: ReturnRequest;
};

type TrackingSubEvent = {
  key: string;
  label: string;
  description?: string;
  createdAt?: string;
  iconClassName: string;
};

type TimelineStep = {
  key: string;
  label: string;
  description: string;
  iconClassName: string;
  completed: boolean;
  active: boolean;
  subEvents: TrackingSubEvent[];
};

const getRequestValue = (
  request: ReturnRequest,
  key: string
): string | undefined => {
  const value = (request as unknown as Record<string, unknown>)[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return undefined;
};

const getRequestNumberValue = (
  request: ReturnRequest,
  key: string
): number | undefined => {
  const value = (request as unknown as Record<string, unknown>)[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsedValue = Number(value);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }
  return undefined;
};

const normalizeStatus = (value?: string): string => {
  return value ? value.trim().toUpperCase() : "";
};

const isOneOf = (value: string, statuses: string[]): boolean => {
  return statuses.includes(value);
};

const formatDateTime = (dateValue?: string): string => {
  if (!dateValue) return "";
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return "";
  return parsedDate.toLocaleString("en-IN");
};

const formatCurrency = (amount?: number): string => {
  if (!amount || amount <= 0) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

const createSubEvent = ({
  key,
  label,
  description,
  createdAt,
  iconClassName
}: TrackingSubEvent): TrackingSubEvent => ({
  key,
  label,
  description,
  createdAt,
  iconClassName
});

const CustomerReturnExperienceTimeline = ({
  request
}: CustomerReturnExperienceTimelineProps) => {
  const returnStatus = normalizeStatus(
    getRequestValue(request, "status") ??
      getRequestValue(request, "returnStatus") ??
      getRequestValue(request, "requestStatus")
  );

  const pickupStatus = normalizeStatus(
    getRequestValue(request, "pickupStatus") ??
      getRequestValue(request, "pickupTrackingStatus")
  );

  const qcStatus = normalizeStatus(
    getRequestValue(request, "qcStatus") ??
      getRequestValue(request, "qualityCheckStatus") ??
      getRequestValue(request, "warehouseQcStatus")
  );

  const refundStatus = normalizeStatus(
    getRequestValue(request, "refundStatus") ??
      getRequestValue(request, "settlementStatus") ??
      getRequestValue(request, "returnRefundStatus")
  );

  const returnId =
    getRequestValue(request, "returnRequestId") ??
    getRequestValue(request, "requestId") ??
    request.id;

  const orderId = getRequestValue(request, "orderId") ?? "Not available";
  const createdAt =
    getRequestValue(request, "createdAt") ??
    getRequestValue(request, "requestedAt");
  const approvedAt =
    getRequestValue(request, "approvedAt") ??
    getRequestValue(request, "returnApprovedAt");
  const pickupAssignedAt =
    getRequestValue(request, "pickupAssignedAt") ??
    getRequestValue(request, "pickupScheduledAt");
  const pickupOutForPickupAt =
    getRequestValue(request, "pickupOutForPickupAt") ??
    getRequestValue(request, "outForPickupAt");
  const pickupCompletedAt =
    getRequestValue(request, "pickupCompletedAt") ??
    getRequestValue(request, "pickedUpAt");
  const pickupFailedAt =
    getRequestValue(request, "pickupFailedAt") ??
    getRequestValue(request, "lastPickupFailedAt");
  const warehouseReceivedAt =
    getRequestValue(request, "warehouseReceivedAt") ??
    getRequestValue(request, "receivedAtWarehouseAt");
  const qcStartedAt =
    getRequestValue(request, "qcStartedAt") ??
    getRequestValue(request, "qualityCheckStartedAt");
  const qcCompletedAt =
    getRequestValue(request, "qcCompletedAt") ??
    getRequestValue(request, "qualityCheckCompletedAt");
  const refundInitiatedAt =
    getRequestValue(request, "refundInitiatedAt") ??
    getRequestValue(request, "settlementInitiatedAt");
  const refundCompletedAt =
    getRequestValue(request, "refundCompletedAt") ??
    getRequestValue(request, "settlementCompletedAt");

  const pickupPartnerName = getRequestValue(request, "pickupPartnerName");
  const pickupPartnerPhone = getRequestValue(request, "pickupPartnerPhone");
  const pickupSlot = getRequestValue(request, "pickupSlot");
  const pickupDate = getRequestValue(request, "pickupDate");
  const pickupAddress = getRequestValue(request, "pickupAddress");
  const pickupFailureReason =
    getRequestValue(request, "pickupFailureReason") ??
    getRequestValue(request, "failedPickupReason");

  const warehouseName =
    getRequestValue(request, "warehouseName") ??
    getRequestValue(request, "returnWarehouseName");

  const qcRemarks =
    getRequestValue(request, "qcCustomerRemarks") ??
    getRequestValue(request, "qualityCheckRemarks") ??
    getRequestValue(request, "qcRemarks");

  const serialNumber =
    getRequestValue(request, "serialNumber") ??
    getRequestValue(request, "verifiedSerialNumber");

  const barcode =
    getRequestValue(request, "barcode") ??
    getRequestValue(request, "verifiedBarcode");

  const refundReferenceId =
    getRequestValue(request, "refundReferenceId") ??
    getRequestValue(request, "settlementReferenceId") ??
    getRequestValue(request, "refundId");

  const refundMode =
    getRequestValue(request, "refundMode") ??
    getRequestValue(request, "refundPreference") ??
    getRequestValue(request, "settlementMode");

  const refundAmount =
    getRequestNumberValue(request, "refundAmount") ??
    getRequestNumberValue(request, "settlementAmount") ??
    getRequestNumberValue(request, "amount");

  const walletCreditAmount =
    getRequestNumberValue(request, "walletCreditAmount") ??
    getRequestNumberValue(request, "walletCompensationAmount");

  const couponCode =
    getRequestValue(request, "couponCode") ??
    getRequestValue(request, "compensationCouponCode");

  const isCancelledOrRejected = isOneOf(returnStatus, [
    "CANCELLED",
    "REJECTED",
    "QUALITY_CHECK_FAILED",
    "QC_REJECTED"
  ]);

  // Stage Completion Flags
  const requestedCompleted = Boolean(request.id);

  const pickupAssignedCompleted =
    isOneOf(pickupStatus, [
      "ASSIGNED",
      "SCHEDULED",
      "OUT_FOR_PICKUP",
      "PICKED_UP",
      "COMPLETED",
      "WAREHOUSE_RECEIVED"
    ]) ||
    isOneOf(returnStatus, [
      "APPROVED",
      "PICKUP_ASSIGNED",
      "PICKUP_SCHEDULED",
      "OUT_FOR_PICKUP",
      "PICKED_UP",
      "WAREHOUSE_RECEIVED",
      "QC_PENDING",
      "QC_IN_PROGRESS",
      "QC_COMPLETED",
      "QC_APPROVED",
      "REFUND_INITIATED",
      "REFUND_COMPLETED",
      "REFUNDED",
      "COMPLETED",
      "CLOSED"
    ]);

  const pickupCompleted =
    isOneOf(pickupStatus, ["PICKED_UP", "COMPLETED", "WAREHOUSE_RECEIVED"]) ||
    isOneOf(returnStatus, [
      "PICKED_UP",
      "WAREHOUSE_RECEIVED",
      "QC_PENDING",
      "QC_IN_PROGRESS",
      "QC_COMPLETED",
      "QC_APPROVED",
      "QC_REJECTED",
      "QUALITY_CHECK_FAILED",
      "REFUND_INITIATED",
      "REFUND_COMPLETED",
      "REFUNDED",
      "COMPLETED",
      "CLOSED"
    ]);

  const warehouseCompleted = isOneOf(returnStatus, [
    "WAREHOUSE_RECEIVED",
    "QC_PENDING",
    "QC_IN_PROGRESS",
    "QC_COMPLETED",
    "QC_APPROVED",
    "QC_REJECTED",
    "QUALITY_CHECK_FAILED",
    "REFUND_INITIATED",
    "REFUND_COMPLETED",
    "REFUNDED",
    "COMPLETED",
    "CLOSED"
  ]);

  const qcCompleted =
    isOneOf(qcStatus, [
      "APPROVED",
      "PASSED",
      "FAILED",
      "REJECTED",
      "COMPLETED"
    ]) ||
    isOneOf(returnStatus, [
      "QC_COMPLETED",
      "QC_APPROVED",
      "QC_REJECTED",
      "QUALITY_CHECK_FAILED",
      "REFUND_INITIATED",
      "REFUND_COMPLETED",
      "REFUNDED",
      "COMPLETED",
      "CLOSED"
    ]);

  const refundInitiated =
    isOneOf(refundStatus, ["INITIATED", "PROCESSING", "COMPLETED", "SUCCESS"]) ||
    isOneOf(returnStatus, [
      "REFUND_INITIATED",
      "REFUND_PROCESSING",
      "REFUND_COMPLETED",
      "REFUNDED",
      "COMPLETED",
      "CLOSED"
    ]);

  const refundCompleted =
    isOneOf(refundStatus, ["COMPLETED", "SUCCESS", "SETTLED", "REFUNDED"]) ||
    isOneOf(returnStatus, ["REFUND_COMPLETED", "REFUNDED", "COMPLETED", "CLOSED"]);

  // Dynamic status check for broadcast live tracker
  const isLiveTrackingActive = !refundCompleted && !isCancelledOrRejected;

  // Sub-Events Configuration with Icons
  const requestSubEvents: TrackingSubEvent[] = [
    createSubEvent({
      key: "request-created",
      label: "Return request submitted",
      description: `Return ID ${returnId} was created for order ${orderId}.`,
      createdAt,
      iconClassName: "bi bi-file-earmark-check-fill text-primary"
    }),
    ...(approvedAt || pickupAssignedCompleted
      ? [
          createSubEvent({
            key: "request-approved",
            label: "Return request approved",
            description: "Your return request was approved for pickup.",
            createdAt: approvedAt,
            iconClassName: "bi bi-check-circle-fill text-success"
          })
        ]
      : [])
  ];

  const pickupSubEvents: TrackingSubEvent[] = [
    ...(pickupAssignedCompleted
      ? [
          createSubEvent({
            key: "pickup-assigned",
            label: "Pickup partner assigned",
            description: pickupPartnerName
              ? `${pickupPartnerName}${
                  pickupPartnerPhone ? `, ${pickupPartnerPhone}` : ""
                }`
              : "Pickup partner has been assigned.",
            createdAt: pickupAssignedAt,
            iconClassName: "bi bi-person-badge-fill text-info"
          })
        ]
      : []),
    ...(pickupDate || pickupSlot
      ? [
          createSubEvent({
            key: "pickup-scheduled",
            label: "Pickup scheduled",
            description: `${pickupDate ?? "Date pending"}${
              pickupSlot ? ` · ${pickupSlot}` : ""
            }`,
            createdAt: pickupAssignedAt,
            iconClassName: "bi bi-calendar-event-fill text-warning"
          })
        ]
      : []),
    ...(pickupAddress
      ? [
          createSubEvent({
            key: "pickup-address",
            label: "Pickup address confirmed",
            description: pickupAddress,
            iconClassName: "bi bi-geo-alt-fill text-danger"
          })
        ]
      : []),
    ...(isOneOf(pickupStatus, ["OUT_FOR_PICKUP"]) ||
    isOneOf(returnStatus, ["OUT_FOR_PICKUP"])
      ? [
          createSubEvent({
            key: "out-for-pickup",
            label: "Agent out for pickup",
            description: "Pickup agent is on the way to collect your return.",
            createdAt: pickupOutForPickupAt,
            iconClassName: "bi bi-truck text-primary"
          })
        ]
      : []),
    ...(pickupFailedAt || isOneOf(pickupStatus, ["FAILED_ATTEMPT", "FAILED"])
      ? [
          createSubEvent({
            key: "pickup-failed",
            label: "Pickup attempt failed",
            description:
              pickupFailureReason ??
              "Pickup could not be completed. A new attempt may be scheduled.",
            createdAt: pickupFailedAt,
            iconClassName: "bi bi-exclamation-triangle-fill text-danger"
          })
        ]
      : []),
    ...(pickupCompleted
      ? [
          createSubEvent({
            key: "pickup-completed",
            label: "Return package picked up",
            description: "Your item has been collected successfully.",
            createdAt: pickupCompletedAt,
            iconClassName: "bi bi-box-seam-fill text-success"
          })
        ]
      : [])
  ];

  const warehouseSubEvents: TrackingSubEvent[] = [
    ...(pickupCompleted
      ? [
          createSubEvent({
            key: "package-in-transit",
            label: "Package in transit",
            description: "Your return package is moving to the warehouse.",
            iconClassName: "bi bi-arrow-right-circle-fill text-primary"
          })
        ]
      : []),
    ...(warehouseCompleted
      ? [
          createSubEvent({
            key: "warehouse-received",
            label: "Package received at warehouse",
            description: warehouseName
              ? `Received at ${warehouseName}.`
              : "Warehouse has received your returned product.",
            createdAt: warehouseReceivedAt,
            iconClassName: "bi bi-building-check text-success"
          })
        ]
      : [])
  ];

  const qcSubEvents: TrackingSubEvent[] = [
    ...(isOneOf(returnStatus, ["QC_IN_PROGRESS"]) ||
    isOneOf(qcStatus, ["IN_PROGRESS", "QC_IN_PROGRESS"]) ||
    qcStartedAt
      ? [
          createSubEvent({
            key: "qc-started",
            label: "Quality check started",
            description:
              "Warehouse team started checking product condition and accessories.",
            createdAt: qcStartedAt,
            iconClassName: "bi bi-hourglass-split text-warning"
          })
        ]
      : []),
    ...(barcode
      ? [
          createSubEvent({
            key: "barcode-verified",
            label: "Barcode verified",
            description: barcode,
            iconClassName: "bi bi-qr-code-scan text-secondary"
          })
        ]
      : []),
    ...(serialNumber
      ? [
          createSubEvent({
            key: "serial-verified",
            label: "Serial number verified",
            description: serialNumber,
            iconClassName: "bi bi-hash text-secondary"
          })
        ]
      : []),
    ...(qcCompleted
      ? [
          createSubEvent({
            key: "qc-completed",
            label:
              isOneOf(qcStatus, ["FAILED", "REJECTED"]) ||
              isOneOf(returnStatus, ["QUALITY_CHECK_FAILED", "QC_REJECTED"])
                ? "Quality check failed"
                : "Quality check completed",
            description:
              qcRemarks ??
              (isOneOf(qcStatus, ["FAILED", "REJECTED"]) ||
              isOneOf(returnStatus, ["QUALITY_CHECK_FAILED", "QC_REJECTED"])
                ? "Quality check did not pass."
                : "Product condition has been verified successfully."),
            createdAt: qcCompletedAt,
            iconClassName:
              isOneOf(qcStatus, ["FAILED", "REJECTED"]) ||
              isOneOf(returnStatus, ["QUALITY_CHECK_FAILED", "QC_REJECTED"])
                ? "bi bi-x-circle-fill text-danger"
                : "bi bi-shield-fill-check text-success"
          })
        ]
      : [])
  ];

  const refundSubEvents: TrackingSubEvent[] = [
    ...(refundInitiated
      ? [
          createSubEvent({
            key: "refund-initiated",
            label: "Refund initiated",
            description: `${formatCurrency(refundAmount)}${
              refundMode ? ` · ${refundMode}` : ""
            }`,
            createdAt: refundInitiatedAt,
            iconClassName: "bi bi-cash-stack text-info"
          })
        ]
      : []),
    ...(walletCreditAmount && walletCreditAmount > 0
      ? [
          createSubEvent({
            key: "wallet-credit",
            label: "Wallet compensation added",
            description: formatCurrency(walletCreditAmount),
            iconClassName: "bi bi-wallet-fill text-primary"
          })
        ]
      : []),
    ...(couponCode
      ? [
          createSubEvent({
            key: "coupon-added",
            label: "Coupon compensation added",
            description: couponCode,
            iconClassName: "bi bi-ticket-perforated-fill text-warning"
          })
        ]
      : []),
    ...(refundCompleted
      ? [
          createSubEvent({
            key: "refund-completed",
            label: "Refund completed",
            description: refundReferenceId
              ? `Reference ID: ${refundReferenceId}`
              : "Refund has been completed successfully.",
            createdAt: refundCompletedAt,
            iconClassName: "bi bi-check-circle-fill text-success"
          })
        ]
      : [])
  ];

  // Steps Configuration
  const rawSteps = [
    {
      key: "requested",
      label: "Return requested",
      description: "Your return request has been submitted successfully.",
      iconClassName: "bi bi-arrow-return-left",
      completed: requestedCompleted,
      subEvents: requestSubEvents
    },
    {
      key: "pickup-assigned",
      label: "Pickup tracking",
      description: "Track pickup assignment, schedule, attempts, and collection.",
      iconClassName: "bi bi-truck",
      completed: pickupAssignedCompleted,
      subEvents: pickupSubEvents
    },
    {
      key: "warehouse",
      label: "Warehouse tracking",
      description: "Track package movement and warehouse receipt.",
      iconClassName: "bi bi-houses",
      completed: warehouseCompleted,
      subEvents: warehouseSubEvents
    },
    {
      key: "qc",
      label: "Quality check",
      description:
        "Warehouse team verifies item condition, barcode, serial number, and eligibility.",
      iconClassName: "bi bi-clipboard-data",
      completed: qcCompleted,
      subEvents: qcSubEvents
    },
    {
      key: "refund-processing",
      label: "Refund and compensation",
      description: "Track refund settlement, wallet credit, and coupon compensation.",
      iconClassName: "bi bi-currency-rupee",
      completed: refundCompleted,
      subEvents: refundSubEvents
    }
  ];

  const completedSteps = rawSteps.filter((s) => s.completed);
  const activeStepKey =
    !isCancelledOrRejected && completedSteps.length > 0 && !refundCompleted
      ? completedSteps[completedSteps.length - 1].key
      : "";

  const steps: TimelineStep[] = rawSteps.map((step) => ({
    ...step,
    active: step.key === activeStepKey
  }));

  const visibleSteps = steps.filter((step) => step.completed || step.active);
  const fallbackVisibleSteps = visibleSteps.length > 0 ? visibleSteps : [steps[0]];

  const terminalStep: TimelineStep | null = isCancelledOrRejected
    ? {
        key: "return-stopped",
        label: returnStatus === "CANCELLED" ? "Return cancelled" : "Return stopped",
        description:
          returnStatus === "CANCELLED"
            ? "This return request has been cancelled."
            : "This return request cannot continue. Please contact support if you need help.",
        iconClassName:
          returnStatus === "CANCELLED"
            ? "bi bi-x-circle-fill text-danger"
            : "bi bi-exclamation-octagon-fill text-warning",
        completed: false,
        active: true,
        subEvents: [
          createSubEvent({
            key: "return-stopped-event",
            label:
              returnStatus === "CANCELLED"
                ? "Cancelled by customer or support team"
                : "Return flow stopped",
            description:
              qcRemarks ??
              getRequestValue(request, "adminRemarks") ??
              "Please contact support for more details.",
            iconClassName:
              returnStatus === "CANCELLED"
                ? "bi bi-x-circle-fill text-danger"
                : "bi bi-exclamation-triangle-fill text-warning"
          })
        ]
      }
    : null;

  const finalVisibleSteps = terminalStep
    ? [...fallbackVisibleSteps, terminalStep]
    : fallbackVisibleSteps;

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        {/* Header with Dynamic Broadcast Icon */}
        <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
          <div>
            <h5 className="fw-bold mb-1">
              <i className="bi bi-clock-history me-2 text-primary" />
              Return journey
            </h5>
            <p className="text-muted small mb-0">
              Showing completed/current stages with tracking sub-events.
            </p>
          </div>

          <span className="badge align-self-start rounded-pill text-bg-secondary d-inline-flex align-items-center">
            <i
              className={`bi bi-broadcast-pin me-2 broadcast-icon ${
                isLiveTrackingActive ? "is-live" : "is-completed"
              }`}
            />
            {isLiveTrackingActive ? "Live tracking" : "Tracking completed"}
          </span>
        </div>

        <div className="customer-return-timeline">
          {finalVisibleSteps.map((step, index) => (
            <div
              className={`customer-return-timeline-step ${
                step.completed ? "is-completed" : ""
              } ${step.active ? "is-active" : ""} ${
                step.key === "return-stopped" ? "is-stopped" : ""
              }`}
              key={step.key}
            >
              {/* Main Step Marker Icon */}
              <div className="customer-return-timeline-marker">
                <i className={step.iconClassName} />
              </div>

              {index !== finalVisibleSteps.length - 1 && (
                <div className="customer-return-timeline-line" />
              )}

              <div className="customer-return-timeline-content">
                <p className="fw-semibold mb-1">{step.label}</p>
                <p className="text-muted small mb-2">{step.description}</p>

                {/* Sub-events */}
                {step.subEvents.length > 0 ? (
                  <div className="customer-return-sub-events">
                    {step.subEvents.map((subEvent) => (
                      <div className="customer-return-sub-event" key={subEvent.key}>
                        <div className="customer-return-sub-event-icon">
                          <i className={subEvent.iconClassName} />
                        </div>

                        <div className="min-w-0">
                          <div className="fw-semibold small">
                            {subEvent.label}
                          </div>

                          {subEvent.description && (
                            <div className="text-muted small text-break">
                              {subEvent.description}
                            </div>
                          )}

                          {subEvent.createdAt && (
                            <div className="text-muted small">
                              {formatDateTime(subEvent.createdAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-light border small mb-0">
                    Tracking details will appear once this stage progresses.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!refundCompleted && !isCancelledOrRejected && (
          <div className="alert alert-light border small mb-0 mt-3 fst-italic">
            <i className="bi bi-info-circle me-2 text-primary" />
            Upcoming stages will appear here automatically as your return
            progresses.
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReturnExperienceTimeline;