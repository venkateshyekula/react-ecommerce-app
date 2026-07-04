import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import OrderTrackingTimeline from "../components/orders/OrderTrackingTimeline";
import { orderService } from "../services/orderService";
import type { Order } from "../types/order";
import { formatCurrency } from "../utils/currencyFormatter";

const getLocalOrderStatusBadgeClass = (status: string): string => {
  if (status === "Order Placed") {
    return "bg-primary-subtle text-primary border border-primary-subtle px-3 py-2";
  }
  if (
    status === "Cancelled" ||
    status === "Canceled" ||
    status === "Order Cancelled"
  ) {
    return "bg-danger-subtle text-danger border border-danger-subtle px-3 py-2";
  }
  return "bg-success-subtle text-success border border-success-subtle px-3 py-2";
};

const OrderSuccessPage = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string>("");

  useEffect(() => {
    const loadOrder = async (): Promise<void> => {
      if (!orderId) {
        setErrorMessage("Order ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const orderDetails = await orderService.getOrderByOrderId(orderId);

        if (!orderDetails) {
          setErrorMessage("Order details not found.");
          setOrder(null);
          return;
        }

        setOrder(orderDetails);
      } catch {
        setErrorMessage(
          "Unable to load order details. Please make sure JSON Server is running.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrder();
  }, [orderId]);

  const handleCancelOrder = async (): Promise<void> => {
    if (!order) return;

    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this order? This action cannot be undone.",
    );
    if (!confirmCancel) return;

    try {
      setIsCancelling(true);
      setCancelError("");

      const updatedOrder = await orderService.cancelOrder(
        order.id,
        "Cancelled by customer from order confirmation screen.",
      );
      setOrder(updatedOrder);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred during cancellation.";
      setCancelError(message);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <main className="order-success-page bg-light">
        <div className="container py-5">
          <Loader message="Loading order confirmation..." />
        </div>
      </main>
    );
  }

  if (errorMessage || !order) {
    return (
      <main className="order-success-page bg-light">
        <div className="container py-5">
          <EmptyState
            title="Order details unavailable"
            message={errorMessage}
            iconClassName="bi bi-receipt"
            action={
              <Link to="/products" className="btn btn-primary">
                Continue Shopping
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(order.orderDate));

  const currentStatusStr = order.orderStatus as string;
  const isEligibleForCancellation = currentStatusStr === "Order Placed";
  const isCancelled =
    currentStatusStr === "Cancelled" || currentStatusStr === "Canceled";

  return (
    <main className="order-success-page bg-light">
      <section className="container py-5">
        <div className="row justify-content-center">
          <div className="col-xl-10">
            {cancelError ? (
              <div className="alert alert-danger mb-4 rounded-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2" />
                {cancelError}
              </div>
            ) : null}

            <div className="order-success-card bg-white rounded-4 shadow-sm p-4 p-md-5 text-center mb-4">
              <div
                className={`success-icon mx-auto mb-3 ${isCancelled ? "bg-danger-subtle text-danger" : ""}`}
              >
                <i
                  className={`bi ${isCancelled ? "bi-x-lg" : "bi-check-lg"}`}
                />
              </div>

              <h1 className="fw-bold mb-2">
                {isCancelled ? "Order Cancelled" : "Order Placed Successfully!"}
              </h1>

              <p className="text-muted mb-4">
                {isCancelled
                  ? "This package pipeline sequence was completely canceled. Distribution steps are terminated."
                  : "Thank you for shopping with ShopEase. Your order has been created and tracking has started."}
              </p>

              <div className="order-success-summary bg-light rounded-4 p-4 mb-4">
                <div className="row g-3 text-start">
                  <div className="col-md-4">
                    <p className="small text-muted mb-1">Order ID</p>
                    <h6 className="fw-bold mb-0">{order.orderId}</h6>
                  </div>

                  <div className="col-md-4">
                    <p className="small text-muted mb-1">Order Date</p>
                    <h6 className="fw-bold mb-0">{formattedDate}</h6>
                  </div>

                  <div className="col-md-4">
                    <p className="small text-muted mb-1">Total Amount</p>
                    <h6 className="fw-bold mb-0">
                      {formatCurrency(order.totalAmount)}
                    </h6>
                  </div>

                  <div className="col-md-4">
                    <p className="small text-muted mb-1">Payment Method</p>
                    <h6 className="fw-bold mb-0">{order.paymentMethod}</h6>
                  </div>

                  <div className="col-md-4">
                    <p className="small text-muted mb-1">Order Status</p>
                    <span
                      className={`badge ${getLocalOrderStatusBadgeClass(currentStatusStr)}`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>

                  <div className="col-md-4">
                    <p className="small text-muted mb-1">Items</p>
                    <h6 className="fw-bold mb-0">
                      {order.items.length} item
                      {order.items.length > 1 ? "s" : ""}
                    </h6>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                <Link to="/orders" className="btn btn-primary px-4">
                  <i className="bi bi-receipt me-2" />
                  View My Orders
                </Link>

                <Link to="/products" className="btn btn-outline-primary px-4">
                  Continue Shopping
                </Link>

                {isEligibleForCancellation ? (
                  <Button
                    variant="outline-danger"
                    className="px-4"
                    isLoading={isCancelling}
                    onClick={handleCancelOrder}
                  >
                    <i className="bi bi-x-circle me-2" />
                    Cancel Order
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="bg-white rounded-4 shadow-sm p-4 p-md-5">
              <h4 className="fw-bold mb-4">Advanced Order Tracking</h4>

              {/* FIXED: Removed the unaccepted events property completely to satisfy TS(2322) and ESLint rules */}
              <OrderTrackingTimeline
                steps={order.trackingSteps || []}
                currentStatus={order.orderStatus}
              />

              <hr className="my-4" />

              <h5 className="fw-bold mb-3">Ordered Items</h5>

              <div className="order-items-list">
                {order.items.map((item) => (
                  <div
                    key={`${order.orderId}-${item.productId}`}
                    className="order-item-row d-flex align-items-center gap-3 mb-3"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="order-item-image"
                    />

                    <div className="flex-grow-1">
                      <h6 className="fw-semibold mb-1">{item.name}</h6>
                      <p className="text-muted small mb-1">{item.brand}</p>

                      {item.selectedSize ? (
                        <span className="order-size-badge">
                          Size: {item.selectedSize}
                        </span>
                      ) : null}

                      <p className="small mb-0 mt-1">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>

                    <div className="fw-bold">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              <hr className="my-4" />

              <h5 className="fw-bold mb-3">Delivery Address</h5>

              <p className="text-muted mb-0">
                {order.deliveryAddress.fullName}, {order.deliveryAddress.mobile}
                <br />
                {order.deliveryAddress.addressLine},{" "}
                {order.deliveryAddress.city}, {order.deliveryAddress.state} -{" "}
                {order.deliveryAddress.pincode}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default OrderSuccessPage;
