import type { ReturnRequest } from "../../types/returnRequest";

type CustomerReturnQcSummaryCardProps = {
  request: ReturnRequest;
};

const getStringValue = (
  request: ReturnRequest,
  keys: string[],
  fallback = "Pending"
): string => {
  const source = request as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return fallback;
};

const formatStatusDisplay = (status: string): string => {
  const normalized = status.toUpperCase();

  switch (normalized) {
    case "APPROVED":
    case "PASSED":
      return "Passed";
    case "REJECTED":
    case "FAILED":
      return "Rejected";
    case "IN_PROGRESS":
    case "QC_IN_PROGRESS":
      return "In Progress";
    case "PENDING":
      return "Pending";
    default:
      return status.replace(/_/g, " ");
  }
};

const getBadgeClassName = (status: string): string => {
  const normalized = status.toUpperCase();

  if (["APPROVED", "PASSED", "COMPLETED"].includes(normalized)) {
    return "text-bg-success";
  }

  if (["REJECTED", "FAILED"].includes(normalized)) {
    return "text-bg-danger";
  }

  if (["IN_PROGRESS", "QC_IN_PROGRESS"].includes(normalized)) {
    return "text-bg-info";
  }

  return "text-bg-warning";
};

const getAlertClassName = (status: string): string => {
  const normalized = status.toUpperCase();

  if (["APPROVED", "PASSED", "COMPLETED"].includes(normalized)) {
    return "alert-success border-success-subtle";
  }

  if (["REJECTED", "FAILED"].includes(normalized)) {
    return "alert-danger border-danger-subtle";
  }

  return "alert-light border";
};

const getCustomerFriendlyMessage = (status: string): string => {
  const normalized = status.toUpperCase();

  if (["APPROVED", "PASSED", "COMPLETED"].includes(normalized)) {
    return "Product condition verified successfully. Refund is eligible.";
  }

  if (["REJECTED", "FAILED"].includes(normalized)) {
    return "Quality check did not pass. Please contact support if you need help.";
  }

  if (["IN_PROGRESS", "QC_IN_PROGRESS"].includes(normalized)) {
    return "Warehouse team is currently checking the returned product.";
  }

  return "Quality check will start once the item reaches the warehouse.";
};

const CustomerReturnQcSummaryCard = ({
  request,
}: CustomerReturnQcSummaryCardProps) => {
  const qcStatus = getStringValue(request, [
    "qcStatus",
    "qualityCheckStatus",
    "warehouseQcStatus",
  ]);

  const qcReason = getStringValue(
    request,
    ["qcCustomerRemarks", "qcRemarks", "qualityCheckRemarks", "returnRemarks"],
    getCustomerFriendlyMessage(qcStatus)
  );

  const normalizedStatus = qcStatus.toUpperCase();

  const refundEligibility = ["APPROVED", "PASSED", "COMPLETED"].includes(
    normalizedStatus
  )
    ? "Eligible"
    : ["REJECTED", "FAILED"].includes(normalizedStatus)
    ? "Not eligible"
    : "Pending";

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <div>
            <h5 className="fw-bold mb-1">Quality check summary</h5>
            <p className="text-muted small mb-0">
              Simplified warehouse QC result for your return.
            </p>
          </div>

          <span
            className={`badge align-self-start rounded-pill ${getBadgeClassName(qcStatus)}`}
          >
            {formatStatusDisplay(qcStatus)}
          </span>
        </div>

        <div className="customer-return-info-box mb-3">
          <span className="text-muted small d-block">Refund eligibility</span>
          <strong>{refundEligibility}</strong>
        </div>

        <div
          className={`alert small mb-0 d-flex align-items-start gap-2 ${getAlertClassName(
            qcStatus
          )}`}
        >
          <i className="bi bi-info-circle-fill flex-shrink-0 mt-1" />
          <div>{qcReason}</div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReturnQcSummaryCard;