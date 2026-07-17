import type { DeliveryPromiseSnapshot } from "../../types/delivery";
import { formatDeliveryPromiseDate } from "../../utils/deliveryEstimate";

interface CheckoutDeliveryPromiseProps {
  deliveryPromise: DeliveryPromiseSnapshot | null;
}

const CheckoutDeliveryPromise = ({
  deliveryPromise
}: CheckoutDeliveryPromiseProps) => {
  if (!deliveryPromise) {
    return (
      <div className="checkout-delivery-promise-card warning">
        <i className="bi bi-exclamation-triangle" />

        <div>
          <h6>Delivery estimate unavailable</h6>
          <p>
            Please enter a valid delivery pincode before placing the order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-delivery-promise-card">
      <div className="checkout-delivery-promise-icon">
        <i className="bi bi-truck" />
      </div>

      <div className="checkout-delivery-promise-content">
        <h6>
          Delivery by{" "}
          {formatDeliveryPromiseDate(deliveryPromise.estimatedDeliveryDate)}
        </h6>

        <p>
          {deliveryPromise.zoneName}
          {deliveryPromise.warehouseName
            ? ` • ${deliveryPromise.warehouseName}`
            : ""}
        </p>

        <div className="checkout-delivery-promise-tags">
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
      </div>
    </div>
  );
};

export default CheckoutDeliveryPromise;