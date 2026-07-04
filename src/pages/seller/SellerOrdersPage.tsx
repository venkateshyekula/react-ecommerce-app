import { useCallback, useEffect, useState } from "react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/useAuth";
import { orderService } from "../../services/orderService";
import { sellerService } from "../../services/sellerService";
import type { Order, OrderStatus } from "../../types/order";
import type { Product } from "../../types/product";
import { formatCurrency } from "../../utils/currencyFormatter";
import { getOrderStatusBadgeClass } from "../../utils/orderUtils";

const sellerEditableStatuses: OrderStatus[] = [
  "Packed",
  "Shipped",
  "Out for Delivery"
];

const SellerOrdersPage = () => {
  const { currentUser } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const loadOrders = useCallback(async (): Promise<void> => {
    if (!currentUser) {
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const [orderList, productList] = await Promise.all([
        sellerService.getSellerOrders(currentUser.id),
        sellerService.getSellerProducts(currentUser.id)
      ]);

      const sortedOrders = [...orderList].sort(
        (firstOrder, secondOrder) =>
          new Date(secondOrder.orderDate).getTime() -
          new Date(firstOrder.orderDate).getTime()
      );

      setOrders(sortedOrders);
      setSellerProducts(productList);
    } catch {
      setErrorMessage(
        "Unable to load seller orders. Please make sure JSON Server is running."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]); // Now dependent only on currentUser

  // 3. useEffect now calls the memoized function
  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const sellerProductIds = new Set(
    sellerProducts.map((product) => product.id)
  );

  const getSellerOrderAmount = (order: Order): number => {
    return order.items.reduce((sum, item) => {
      if (!sellerProductIds.has(item.productId)) {
        return sum;
      }

      return sum + item.subtotal;
    }, 0);
  };

  const handleStatusChange = async (
    order: Order,
    status: OrderStatus
  ): Promise<void> => {
    try {
      setUpdatingOrderId(order.orderId);

      const updatedOrder = await orderService.updateOrderStatus(
        order.id,
        status
      );

      setOrders((previousOrders) =>
        previousOrders.map((existingOrder) =>
          existingOrder.id === updatedOrder.id ? updatedOrder : existingOrder
        )
      );
    } catch {
      setErrorMessage("Unable to update order status.");
    } finally {
      setUpdatingOrderId("");
    }
  };

  if (isLoading) {
    return <Loader message="Loading seller orders..." />;
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">My Orders</h1>
          <p className="text-muted mb-0">
            View and process orders containing products owned by your seller
            account.
          </p>
        </div>

        <Button variant="outline-primary" onClick={() => void loadOrders()}>
          <i className="bi bi-arrow-repeat me-2" />
          Refresh
        </Button>
      </div>

      {errorMessage ? (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <div className="seller-panel-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Seller Amount</th>
                <th>Payment</th>
                <th>Update</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <h6 className="fw-semibold mb-1">{order.orderId}</h6>
                    <p className="small text-muted mb-0">
                      {new Intl.DateTimeFormat("en-IN", {
                        dateStyle: "medium"
                      }).format(new Date(order.orderDate))}
                    </p>
                  </td>

                  <td>
                    <h6 className="fw-semibold mb-1">
                      {order.deliveryAddress.fullName}
                    </h6>
                    <p className="small text-muted mb-0">
                      {order.deliveryAddress.mobile}
                    </p>
                  </td>

                  <td>
                    <span
                      className={`badge ${getOrderStatusBadgeClass(
                        order.orderStatus
                      )}`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>

                  <td>{formatCurrency(getSellerOrderAmount(order))}</td>
                  <td>{order.paymentMethod}</td>

                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <select
                        className="form-select seller-order-status-select"
                        value={order.orderStatus}
                        disabled={
                          updatingOrderId === order.orderId ||
                          order.orderStatus === "Cancelled" ||
                          order.orderStatus === "Delivered" ||
                          order.orderStatus === "Return Requested" ||
                          order.orderStatus === "Returned"
                        }
                        onChange={(event) =>
                          void handleStatusChange(
                            order,
                            event.target.value as OrderStatus
                          )
                        }
                      >
                        <option value={order.orderStatus}>
                          {order.orderStatus}
                        </option>

                        {sellerEditableStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      {updatingOrderId === order.orderId ? (
                        <span className="spinner-border spinner-border-sm text-primary" />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}

              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No seller orders found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerOrdersPage;