import type { ReturnRequest } from "../../types/returnRequest";

type CustomerRefundStatusCardProps = {
  request: ReturnRequest;
};

const getStringValue = (
  request: ReturnRequest,
  keys: string[],
  fallback = "Not available"
): string => {
  const source = request as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return fallback;
};

const getNumberValue = (
  request: ReturnRequest,
  keys: string[],
  fallback = 0
): number => {
  const source = request as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
};

const formatCurrency = (amount: number): string => {
  if (amount <= 0) return "Pending calculation";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr === "Not available") return dateStr;

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(parsed);
};

const getBadgeClassName = (status: string): string => {
  const normalized = status.toUpperCase();

  if (["COMPLETED", "SUCCESS", "SETTLED"].includes(normalized)) {
    return "text-bg-success";
  }

  if (["FAILED", "REJECTED"].includes(normalized)) {
    return "text-bg-danger";
  }

  if (["PROCESSING", "INITIATED"].includes(normalized)) {
    return "text-bg-info";
  }

  if (["ON_HOLD", "HOLD"].includes(normalized)) {
    return "text-bg-warning";
  }

  return "text-bg-secondary";
};

const CustomerRefundStatusCard = ({ request }: CustomerRefundStatusCardProps) => {
  const refundAmount = getNumberValue(request, [
    "refundAmount",
    "settlementAmount",
    "returnRefundAmount",
    "amount"
  ]);

  const refundMode = getStringValue(request, [
    "refundMode",
    "settlementMode",
    "paymentMode"
  ]);

  const refundStatus = getStringValue(
    request,
    ["refundStatus", "settlementStatus", "returnRefundStatus"],
    "Pending"
  );

  const rawExpectedDate = getStringValue(request, [
    "expectedRefundDate",
    "refundExpectedDate",
    "estimatedRefundDate"
  ]);

  const expectedRefundDate = formatDate(rawExpectedDate);

  const refundReferenceId = getStringValue(request, [
    "refundReferenceId",
    "settlementReferenceId",
    "transactionReferenceId"
  ]);

  const normalizedStatus = refundStatus.toUpperCase();

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <div>
            <h5 className="fw-bold mb-1">Refund status</h5>
            <p className="text-muted small mb-0">
              Refund will be processed after successful quality check.
            </p>
          </div>

          <span
            className={`badge align-self-start rounded-pill ${getBadgeClassName(refundStatus)}`}
          >
            {refundStatus}
          </span>
        </div>

        <div className="row g-3">
          <div className="col-sm-6">
            <div className="customer-return-info-box">
              <span className="text-muted small d-block">Refund amount</span>
              <strong>{formatCurrency(refundAmount)}</strong>
            </div>
          </div>

          <div className="col-sm-6">
            <div className="customer-return-info-box">
              <span className="text-muted small d-block">Refund mode</span>
              <strong>{refundMode}</strong>
            </div>
          </div>

          <div className="col-sm-6">
            <div className="customer-return-info-box">
              <span className="text-muted small d-block">Expected refund date</span>
              <strong>{expectedRefundDate}</strong>
            </div>
          </div>

          <div className="col-sm-6">
            <div className="customer-return-info-box">
              <span className="text-muted small d-block">Reference ID</span>
              <strong>{refundReferenceId}</strong>
            </div>
          </div>
        </div>

        {["FAILED", "REJECTED"].includes(normalizedStatus) && (
          <div className="alert alert-warning small mt-3 mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
            <div>
              Your refund needs attention. Please contact support for quick help.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerRefundStatusCard;