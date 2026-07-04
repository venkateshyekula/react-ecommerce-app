import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import OrderCard from "../components/orders/OrderCard";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import { orderService } from "../services/orderService";
import { productService } from "../services/productService";
import type { Order } from "../types/order";
import type { Product } from "../types/product";

const OrderHistoryPage = () => {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // ALIGNED: Use the system 'id' string uniform template for clean state tracking
  const [reorderingOrderId, setReorderingOrderId] = useState<string>("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string>("");

  const loadOrders = useCallback(async (): Promise<void> => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const orderList =
        currentUser.role === "ADMIN"
          ? await orderService.getOrders()
          : await orderService.getOrdersByUserId(currentUser.id);

      const sortedOrders = [...orderList].sort(
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
  }, [currentUser]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // OPTIMIZED: Wrapped in useCallback and converted to parallel processing
  const handleReorder = useCallback(async (order: Order): Promise<void> => {
    try {
      setReorderingOrderId(order.id);

      // Fetch all products in parallel rather than blocking sequentially
      const productFetches = order.items.map(async (item) => {
        const product = await productService.getProductById(item.productId);
        return { product, item };
      });

      const resolvedItems = await Promise.all(productFetches);

      // Batch process into the context state basket
      for (const { product, item } of resolvedItems) {
        if (product && product.stock > 0) {
          for (let count = 0; count < item.quantity; count += 1) {
            // Accommodate custom variant structural additions if your context expects it
            const productPayload = (item.selectedSize 
              ? { ...product, selectedSize: item.selectedSize } 
              : product) as Product;

            addToCart(productPayload);
          }
        }
      }

      navigate("/cart");
    } catch {
      setErrorMessage("Failed to accurately reorder some items. They may be out of stock.");
    } finally {
      setReorderingOrderId("");
    }
  }, [addToCart, navigate]);

  // OPTIMIZED: Wrapped in useCallback to prevent child card list redraw noise
  const handleCancelOrder = useCallback(async (
    order: Order,
    reason: string
  ): Promise<void> => {
    try {
      setUpdatingOrderId(order.id);

      const updatedOrder = await orderService.cancelOrder(order.id, reason);

      setOrders((previousOrders) =>
        previousOrders.map((existingOrder) =>
          existingOrder.id === updatedOrder.id ? updatedOrder : existingOrder
        )
      );
    } catch {
      alert("Failed to cancel the order. Please try again later.");
    } finally {
      setUpdatingOrderId("");
    }
  }, []);

  // OPTIMIZED: Wrapped in useCallback to ensure rendering performance stays flat
  const handleReturnOrder = useCallback(async (
    order: Order,
    reason: string
  ): Promise<void> => {
    try {
      setUpdatingOrderId(order.id);

      const updatedOrder = await orderService.requestReturn(order.id, reason);

      setOrders((previousOrders) =>
        previousOrders.map((existingOrder) =>
          existingOrder.id === updatedOrder.id ? updatedOrder : existingOrder
        )
      );
    } catch {
      alert("Failed to process your return request. Please try again.");
    } finally {
      setUpdatingOrderId("");
    }
  }, []);

  return (
    <main className="order-history-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">
                {currentUser?.role === "ADMIN" ? "All Orders" : "Order History"}
              </h1>
              <p className="text-muted mb-0">
                {currentUser?.role === "ADMIN"
                  ? "Admin view of all customer orders."
                  : "View previous orders, track status, and reorder products."}
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
        {isLoading && <Loader message="Loading your orders..." />}

        {!isLoading && errorMessage && (
          <div className="alert alert-danger text-center max-w-md mx-auto p-4 rounded-4 shadow-sm">
            <i className="bi bi-exclamation-octagon-fill fs-3 text-danger d-block mb-2" />
            <p className="mb-3 fw-semibold">{errorMessage}</p>
            <button
              type="button"
              className="btn btn-primary px-4"
              onClick={() => void loadOrders()}
            >
              Retry Connection
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && orders.length === 0 && (
          <EmptyState
            title="No Orders Yet"
            message="Looks like you haven't placed any orders yet."
            action={
              <Link to="/products" className="btn btn-primary px-4 rounded-3">
                Browse Products
              </Link>
            }
          />
        )}

        {!isLoading && !errorMessage && orders.length > 0 && (
          <div className="d-flex flex-column gap-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onReorder={handleReorder}
                onCancelOrder={handleCancelOrder}
                onReturnOrder={handleReturnOrder}
                isReordering={reorderingOrderId === order.id}
                isUpdating={updatingOrderId === order.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default OrderHistoryPage;