import type { DeliveryPromiseSnapshot } from "../../types/delivery";
import { formatDeliveryPromiseDate } from "../../utils/deliveryEstimate";

interface OrderDeliveryPromiseCardProps {
  deliveryPromise?: DeliveryPromiseSnapshot | null;
}

const OrderDeliveryPromiseCard = ({
  deliveryPromise
}: OrderDeliveryPromiseCardProps) => {
  if (!deliveryPromise) {
    return null;
  }

  return (
    <div className="order-delivery-promise-card mt-3">
      <div className="order-delivery-promise-icon">
        <i className="bi bi-truck" />
      </div>

      <div className="flex-grow-1">
        <h6 className="fw-bold mb-1">
          Delivery by{" "}
          {formatDeliveryPromiseDate(deliveryPromise.estimatedDeliveryDate)}
        </h6>

        <p className="text-muted mb-2">
          {deliveryPromise.zoneName}
          {deliveryPromise.warehouseName
            ? ` • ${deliveryPromise.warehouseName}`
            : ""}
        </p>

        <div className="order-delivery-promise-tags">
          <span>
            <i className="bi bi-clock-history" />
            {deliveryPromise.finalDeliveryDays} days
          </span>

          <span>
            <i className="bi bi-wallet2" />
            {deliveryPromise.cashOnDelivery ? "COD Available" : "No COD"}
          </span>

          <span>
            <i className="bi bi-gift" />
            {deliveryPromise.freeDelivery ? "Free Delivery" : "Paid Delivery"}
          </span>
        </div>

        {deliveryPromise.fulfillmentMessage ? (
          <p className="small text-muted mt-2 mb-0">
            {deliveryPromise.fulfillmentMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default OrderDeliveryPromiseCard;