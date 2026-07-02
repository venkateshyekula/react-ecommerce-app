import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import OrderCard from "../components/orders/OrderCard";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import { orderService } from "../services/orderService";
import { productService } from "../services/productService";
import type { Order } from "../types/order";

const OrderHistoryPage = () => {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [reorderingOrderId, setReorderingOrderId] = useState<string>("");

  useEffect(() => {
    const loadOrders = async (): Promise<void> => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const userOrders = await orderService.getOrdersByUserId(
          currentUser.id
        );

        const sortedOrders = [...userOrders].sort(
          (firstOrder, secondOrder) =>
            new Date(secondOrder.orderDate).getTime() -
            new Date(firstOrder.orderDate).getTime()
        );

        setOrders(sortedOrders);
      } catch {
        setErrorMessage(
          "Unable to load order history. Please make sure JSON Server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrders();
  }, [currentUser]);

  const handleReorder = async (order: Order): Promise<void> => {
    try {
      setReorderingOrderId(order.orderId);

      for (const item of order.items) {
        const product = await productService.getProductById(item.productId);

        if (product && product.stock > 0) {
          for (let count = 0; count < item.quantity; count += 1) {
            addToCart(product);
          }
        }
      }

      navigate("/cart");
    } finally {
      setReorderingOrderId("");
    }
  };

  return (
    <main className="order-history-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">Order History</h1>
              <p className="text-muted mb-0">
                View your previous orders, track status, and reorder products.
              </p>
            </div>

            <Link to="/products" className="btn btn-outline-primary">
              <i className="bi bi-bag me-2" />
              Shop More
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-4 py-md-5">
        {isLoading ? <Loader message="Loading your orders..." /> : null}

        {!isLoading && errorMessage ? (
          <EmptyState
            title="Failed to Load Orders"
            message={errorMessage}
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise me-2" />
                Retry
              </button>
            }
          />
        ) : null}

        {!isLoading && !errorMessage && orders.length === 0 ? (
          <EmptyState
            title="No Orders Found"
            message="Looks like you haven't placed any orders yet."
            action={
              <Link to="/products" className="btn btn-primary">
                Browse Products
              </Link>
            }
          />
        ) : null}

        {!isLoading && !errorMessage && orders.length > 0 ? (
          <div>
            {orders.map((order) => (
              <OrderCard
                key={order.orderId || order.id}
                order={order}
                onReorder={handleReorder}
                isReordering={reorderingOrderId === order.orderId}
              />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
};

export default OrderHistoryPage;