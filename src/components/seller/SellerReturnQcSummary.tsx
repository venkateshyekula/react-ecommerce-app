import type { FC } from "react";
import type { ReturnRequest } from "../../types/returnRequest";
import { formatReturnLabel } from "../../utils/sellerReturnWorkflowUtils";

type SellerReturnQcSummaryProps = {
  request: ReturnRequest;
};

const getBadgeClassName = (status?: string | null): string => {
  const normalizedStatus = status?.trim().toUpperCase() ?? "";

  if (["PASSED", "APPROVED", "COMPLETED"].includes(normalizedStatus)) {
    return "text-bg-success";
  }

  if (
    [
      "FAILED",
      "REJECTED",
      "QC_REJECTED",
      "QUALITY_CHECK_FAILED",
      "MISMATCH",
      "DAMAGED",
      "MISSING_ACCESSORY"
    ].includes(normalizedStatus)
  ) {
    return "text-bg-danger";
  }

  if (["IN_PROGRESS", "PENDING", "STARTED"].includes(normalizedStatus)) {
    return "text-bg-warning text-dark";
  }

  return "text-bg-secondary";
};

const SellerReturnQcSummary: FC<SellerReturnQcSummaryProps> = ({ request }) => {
  return (
    <div className="border rounded-4 p-3 bg-light">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
        <div>
          <h6 className="fw-bold mb-1">Warehouse QC Summary</h6>
          <p className="text-muted small mb-0">
            Seller-visible quality check result.
          </p>
        </div>

        <span
          className={`badge rounded-pill align-self-start ${getBadgeClassName(
            request.qualityCheckStatus
          )}`}
        >
          {formatReturnLabel(request.qualityCheckStatus)}
        </span>
      </div>

      <div className="small">
        <div>
          <strong>Return Status:</strong> {formatReturnLabel(request.status)}
        </div>
        <div>
          <strong>Pickup Status:</strong>{" "}
          {formatReturnLabel(request.pickupStatus)}
        </div>
        <div>
          <strong>Refund Status:</strong>{" "}
          {formatReturnLabel(request.refundStatus)}
        </div>

        {request.qualityCheckRemarks ? (
          <div className="mt-2 text-break">
            <strong>QC Remarks:</strong> {request.qualityCheckRemarks}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SellerReturnQcSummary;