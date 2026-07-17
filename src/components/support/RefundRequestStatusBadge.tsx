import type { RefundStatus } from "../../types/refund";
import {
  formatRefundStatusLabel,
  getRefundStatusBadgeClass
} from "../../utils/refundWorkflowUtils";

interface RefundRequestStatusBadgeProps {
  status: RefundStatus;
}

const RefundRequestStatusBadge = ({
  status
}: RefundRequestStatusBadgeProps) => {
  return (
    <span className={`badge align-self-start refund-request-mode-badge ${getRefundStatusBadgeClass(status)}`}>
      {formatRefundStatusLabel(status)}
    </span>
  );
};

export default RefundRequestStatusBadge;