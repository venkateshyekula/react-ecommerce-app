import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
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

type OrderFilter = "ALL" | "ACTIVE" | "DELIVERED" | "CANCELLED" | "RETURNED";

const orderFilters: Array<{
  label: string;
  value: OrderFilter;
}> = [
  {
    label: "All",
    value: "ALL"
  },
  {
    label: "Active",
    value: "ACTIVE"
  },
  {
    label: "Delivered",
    value: "DELIVERED"
  },
  {
    label: "Cancelled",
    value: "CANCELLED"
  },
  {
    label: "Returns",
    value: "RETURNED"
  }
];

const OrderHistoryPage = () => {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [reorderingOrderId, setReorderingOrderId] = useState<string>("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<OrderFilter>("ALL");
  const [searchText, setSearchText] = useState<string>("");

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

  const orderSummary = useMemo(() => {
    return {
      total: orders.length,
      active: orders.filter(
        (order) =>
          order.orderStatus !== "Delivered" &&
          order.orderStatus !== "Cancelled" &&
          order.orderStatus !== "Returned"
      ).length,
      delivered: orders.filter((order) => order.orderStatus === "Delivered")
        .length,
      returns: orders.filter(
        (order) =>
          order.orderStatus === "Return Requested" ||
          order.orderStatus === "Returned"
      ).length
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter =
        activeFilter === "ALL" ||
        (activeFilter === "ACTIVE" &&
          order.orderStatus !== "Delivered" &&
          order.orderStatus !== "Cancelled" &&
          order.orderStatus !== "Returned") ||
        (activeFilter === "DELIVERED" &&
          order.orderStatus === "Delivered") ||
        (activeFilter === "CANCELLED" &&
          order.orderStatus === "Cancelled") ||
        (activeFilter === "RETURNED" &&
          (order.orderStatus === "Return Requested" ||
            order.orderStatus === "Returned"));

      const searchableText = [
        order.orderId,
        order.orderStatus,
        order.paymentMethod,
        order.items.map((item) => item.name).join(" "),
        order.items.map((item) => item.brand).join(" ")
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [orders, activeFilter, searchText]);

  const handleReorder = useCallback(
    async (order: Order): Promise<void> => {
      try {
        setReorderingOrderId(order.id);

        const productFetches = order.items.map(async (item) => {
          const product = await productService.getProductById(item.productId);
          return { product, item };
        });

        const resolvedItems = await Promise.all(productFetches);

        for (const { product, item } of resolvedItems) {
          if (product && product.stock > 0) {
            for (let count = 0; count < item.quantity; count += 1) {
              const productPayload = (
                item.selectedSize
                  ? { ...product, selectedSize: item.selectedSize }
                  : product
              ) as Product;

              addToCart(productPayload);
            }
          }
        }

        navigate("/cart");
      } catch {
        setErrorMessage(
          "Failed to accurately reorder some items. They may be out of stock."
        );
      } finally {
        setReorderingOrderId("");
      }
    },
    [addToCart, navigate]
  );

  const handleCancelOrder = useCallback(
    async (order: Order, reason: string): Promise<void> => {
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
    },
    []
  );

  const handleReturnOrder = useCallback(
    async (order: Order, reason: string): Promise<void> => {
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
    },
    []
  );

  return (
    <main className="account-page bg-light">
      <section className="container-fluid py-4">
        <div className="row g-4">
          <aside className="col-lg-3">
            <div className="account-sidebar bg-white overflow-hidden">
              <div className="account-sidebar-title p-4">
                <h5 className="fw-bold mb-2">Account</h5>
                <p className="text-muted small mb-0">
                  View orders, returns and account details.
                </p>
              </div>

              <div className="list-group list-group-flush account-nav-list">
                <Link
                  to="/profile"
                  className="list-group-item list-group-item-action"
                >
                  <i className="bi bi-person me-2" />
                  Profile Overview
                </Link>

                <Link
                  to="/orders"
                  className="list-group-item list-group-item-action active"
                >
                  <i className="bi bi-box-seam me-2" />
                  Orders & Returns
                </Link>

                <Link
                  to="/addresses"
                  className="list-group-item list-group-item-action"
                >
                  <i className="bi bi-geo-alt me-2" />
                  Addresses
                </Link>

                <Link
                  to="/wallet"
                  className="list-group-item list-group-item-action"
                >
                  <i className="bi bi-wallet2 me-2" />
                  Wallet
                </Link>
              </div>
            </div>
          </aside>

          <section className="col-lg-9">
            <div className="account-section-card bg-white">
              <div className="account-section-header p-4">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                  <div>
                    <h1 className="h4 fw-bold mb-1">
                      {currentUser?.role === "ADMIN"
                        ? "All Orders"
                        : "Orders & Returns"}
                    </h1>

                    <p className="text-muted mb-0">
                      {currentUser?.role === "ADMIN"
                        ? "Admin view of customer orders and return activity."
                        : "Track orders, manage returns and reorder products."}
                    </p>
                  </div>

                  <Link to="/products" className="btn btn-outline-dark">
                    <i className="bi bi-bag me-2" />
                    Shop More
                  </Link>
                </div>
              </div>

              <div className="p-4">
                <div className="row g-3 mb-4">
                  <div className="col-md-3 col-6">
                    <div className="account-info-tile">
                      <span>Total Orders</span>
                      <strong>{orderSummary.total}</strong>
                    </div>
                  </div>

                  <div className="col-md-3 col-6">
                    <div className="account-info-tile">
                      <span>Active</span>
                      <strong>{orderSummary.active}</strong>
                    </div>
                  </div>

                  <div className="col-md-3 col-6">
                    <div className="account-info-tile">
                      <span>Delivered</span>
                      <strong>{orderSummary.delivered}</strong>
                    </div>
                  </div>

                  <div className="col-md-3 col-6">
                    <div className="account-info-tile">
                      <span>Returns</span>
                      <strong>{orderSummary.returns}</strong>
                    </div>
                  </div>
                </div>

                <div className="orders-toolbar border rounded-4 p-3 mb-4">
                  <div className="d-flex flex-column flex-xl-row justify-content-between gap-3">
                    <div className="orders-filter-pills d-flex flex-wrap gap-2">
                      {orderFilters.map((filter) => (
                        <button
                          type="button"
                          className={`btn btn-sm ${
                            activeFilter === filter.value
                              ? "btn-dark"
                              : "btn-outline-secondary"
                          }`}
                          key={filter.value}
                          onClick={() => setActiveFilter(filter.value)}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>

                    <div className="input-group orders-search-input">
                      <span className="input-group-text bg-white">
                        <i className="bi bi-search text-muted" />
                      </span>

                      <input
                        className="form-control"
                        placeholder="Search by order ID, product or brand"
                        value={searchText}
                        onChange={(event) =>
                          setSearchText(event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {isLoading ? <Loader message="Loading your orders..." /> : null}

                {!isLoading && errorMessage ? (
                  <div className="alert alert-danger text-center p-4 rounded-4">
                    <i className="bi bi-exclamation-octagon-fill fs-3 text-danger d-block mb-2" />
                    <p className="mb-3 fw-semibold">{errorMessage}</p>

                    <button
                      type="button"
                      className="btn btn-dark px-4"
                      onClick={() => void loadOrders()}
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : null}

                {!isLoading && !errorMessage && filteredOrders.length === 0 ? (
                  <EmptyState
                    title="No Orders Found"
                    message={
                      searchText
                        ? `We couldn't find any orders matching "${searchText}". Try modifying your keywords.`
                        : "You haven't placed any orders matching this category filter yet."
                    }
                    iconClassName="bi bi-receipt"
                    action={
                      <Link to="/products" className="btn btn-outline-light px-4 account-header-action-btn">
                        Browse Products
                      </Link>
                    }
                  />
                ) : null}

                {!isLoading && !errorMessage && filteredOrders.length > 0 ? (
                  <div className="d-flex flex-column gap-4">
                    {filteredOrders.map((order) => (
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
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

export default OrderHistoryPage;