import type { PaymentReconciliationSeverity } from "../../utils/paymentReconciliationUtils";
import { getReconciliationSeverityBadgeClass } from "../../utils/paymentReconciliationUtils";

interface PaymentReconciliationStatusBadgeProps {
  severity: PaymentReconciliationSeverity;
}

const PaymentReconciliationStatusBadge = ({
  severity
}: PaymentReconciliationStatusBadgeProps) => {
  return (
    <span className={`badge ${getReconciliationSeverityBadgeClass(severity)}`}>
      {severity}
    </span>
  );
};

export default PaymentReconciliationStatusBadge;