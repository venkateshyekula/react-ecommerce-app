import type { Order } from "../../types/order";
import { formatCurrency } from "../../utils/currencyFormatter";
import Button from "../common/Button";
import OrderTrackingTimeline from "./OrderTrackingTimeline";

interface OrderCardProps {
  order: Order;
  onReorder: (order: Order) => void;
  isReordering?: boolean;
}

const OrderCard = ({
  order,
  onReorder,
  isReordering = false,
}: OrderCardProps) => {
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(order.orderDate));

  return (
    <div className="order-card bg-white rounded-4 shadow-sm p-4 mb-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-1">Order #{order.orderId}</h5>
          <p className="text-muted mb-0">
            <i className="bi bi-calendar3 me-2" />
            {formattedDate}
          </p>
        </div>

        <div className="text-lg-end">
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle mb-2">
            {order.orderStatus}
          </span>

          <h5 className="fw-bold mb-0">{formatCurrency(order.totalAmount)}</h5>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <h6 className="fw-bold mb-3">Items</h6>

          <div className="order-items-list">
            {order.items.map((item) => (
              <div
                key={`${order.orderId}-${item.productId}`}
                className="order-item-row d-flex align-items-center gap-3 mb-3"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="img-fluid rounded"
                  style={{ width: "65px", height: "65px", objectFit: "cover" }}
                />

                <div className="flex-grow-1">
                  <h6 className="mb-1 fw-semibold">{item.name}</h6>
                  <p className="text-muted small mb-1">{item.brand}</p>
                  <p className="small mb-0">
                    {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>

                <div className="fw-bold">{formatCurrency(item.subtotal)}</div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <h6 className="fw-bold mb-2">Delivery Address</h6>
            <p className="text-muted mb-0">
              {order.deliveryAddress.fullName}, {order.deliveryAddress.mobile}
              <br />
              {order.deliveryAddress.addressLine}, {order.deliveryAddress.city},{" "}
              {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
            </p>
          </div>
        </div>

        <div className="col-lg-5">
          <h6 className="fw-bold mb-3">Tracking</h6>

          <OrderTrackingTimeline
            steps={order.trackingSteps}
            currentStatus={order.orderStatus}
          />

          <div className="payment-summary bg-light rounded-4 p-3 mt-4">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Payment Method</span>
              <span className="fw-semibold">{order.paymentMethod}</span>
            </div>

            <div className="d-flex justify-content-between">
              <span className="text-muted">Total Amount</span>
              <span className="fw-bold">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>

          <Button
            variant="outline-primary"
            fullWidth
            className="mt-3"
            isLoading={isReordering}
            onClick={() => onReorder(order)}
          >
            <i className="bi bi-arrow-repeat me-2" />
            Reorder
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
