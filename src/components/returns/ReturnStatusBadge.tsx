import type {
  ReturnPickupStatus,
  ReturnQualityCheckStatus,
  ReturnRequestStatus
} from "../../types/returnRequest";
import {
  formatReturnLabel,
  getPickupStatusBadgeClass,
  getQualityCheckBadgeClass,
  getReturnStatusBadgeClass
} from "../../utils/returnWorkflowUtils";

// Define strict pairs using a Discriminated Union
type ReturnStatusBadgeProps =
  | { type: "RETURN"; status: ReturnRequestStatus }
  | { type: "PICKUP"; status: ReturnPickupStatus }
  | { type: "QC"; status: ReturnQualityCheckStatus };

const ReturnStatusBadge = ({ type, status }: ReturnStatusBadgeProps) => {
  // TypeScript now accurately narrows the type inside each conditional branch automatically
  const getBadgeClass = (): string => {
    if (type === "RETURN") {
      return getReturnStatusBadgeClass(status);
    }
    if (type === "PICKUP") {
      return getPickupStatusBadgeClass(status);
    }
    return getQualityCheckBadgeClass(status);
  };

  return (
    <span className={`badge ${getBadgeClass()}`}>
      {formatReturnLabel(status)}
    </span>
  );
};

export default ReturnStatusBadge;