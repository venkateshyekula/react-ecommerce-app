import type { Order } from "../../types/order";
import type { ReturnPolicyRule } from "../../types/returnPolicy";
import { getReturnEligibility } from "../../utils/returnEligibility";

interface OrderReturnEligibilityCardProps {
  order: Order;
  rules: ReturnPolicyRule[];
  hasExistingReturnRequest?: boolean;
  onRequestReturn?: () => void;
}

const OrderReturnEligibilityCard = ({
  order,
  rules,
  hasExistingReturnRequest = false,
  onRequestReturn
}: OrderReturnEligibilityCardProps) => {
  const eligibility = getReturnEligibility(order, rules);

  return (
    <div
      className={`order-return-eligibility-card ${
        eligibility.eligible ? "eligible" : "not-eligible"
      }`}
    >
      <div className="order-return-eligibility-icon">
        <i
          className={
            eligibility.eligible
              ? "bi bi-arrow-counterclockwise"
              : "bi bi-info-circle"
          }
        />
      </div>

      <div className="flex-grow-1">
        <h6 className="fw-bold mb-1">
          {hasExistingReturnRequest
            ? "Return Request Submitted"
            : eligibility.eligible
              ? "Return Eligible"
              : "Return Information"}
        </h6>

        <p className="text-muted small mb-2">
          {hasExistingReturnRequest
            ? "A return request already exists for this order."
            : eligibility.message}
        </p>

        <div className="order-return-tags">
          <span>{eligibility.returnWindowDays} day return window</span>

          <span>
            {eligibility.replacementAllowed
              ? "Replacement Allowed"
              : "No Replacement"}
          </span>
        </div>

        {eligibility.eligible &&
        !hasExistingReturnRequest &&
        onRequestReturn ? (
          <button
            type="button"
            className="btn btn-outline-primary btn-sm mt-3"
            onClick={onRequestReturn}
          >
            <i className="bi bi-arrow-repeat me-2" />
            Request Return
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default OrderReturnEligibilityCard;