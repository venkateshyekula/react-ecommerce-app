import { useEffect, useMemo, useState } from "react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { supportService } from "../../services/supportService";
import type { Order, OrderStatus } from "../../types/order";
import { formatCurrency } from "../../utils/currencyFormatter";
import {
  canReturnOrder,
  getOrderStatusBadgeClass
} from "../../utils/orderUtils";

const supportEditableStatuses: OrderStatus[] = [
  "Order Placed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Returned"
];

const SupportOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const loadOrders = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const orderList = await supportService.getOrders();

      const sortedOrders = [...orderList].sort(
        (firstOrder, secondOrder) =>
          new Date(secondOrder.orderDate).getTime() -
          new Date(firstOrder.orderDate).getTime()
      );

      setOrders(sortedOrders);
    } catch {
      setErrorMessage(
        "Unable to load orders. Please make sure JSON Server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.orderId.toLowerCase().includes(query) ||
        order.deliveryAddress.fullName.toLowerCase().includes(query) ||
        order.deliveryAddress.mobile.includes(query);

      const matchesStatus = !statusFilter || order.orderStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchText, statusFilter]);

  const handleStatusChange = async (
    order: Order,
    status: OrderStatus
  ): Promise<void> => {
    try {
      setUpdatingOrderId(order.orderId);

      const updatedOrder =
        status === "Returned"
          ? await supportService.approveReturn(order)
          : await supportService.updateOrderStatus(order, status);

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

  const handleApproveReturn = async (order: Order): Promise<void> => {
    const shouldApprove = window.confirm(
      "Approve return and mark this order as Returned?"
    );

    if (!shouldApprove) {
      return;
    }

    await handleStatusChange(order, "Returned");
  };

  if (isLoading) {
    return <Loader message="Loading support orders..." />;
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Orders Help</h1>
          <p className="text-muted mb-0">
            Assist customers with order tracking, returns, and cancellations.
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

      <div className="support-panel-card mb-4">
        <div className="row g-3">
          <div className="col-md-8">
            <input
              className="form-control"
              placeholder="Search by order ID, customer name, or mobile..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="col-md-4">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as OrderStatus | "")
              }
            >
              <option value="">All Statuses</option>
              {supportEditableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
              <option value="Cancelled">Cancelled</option>
              <option value="Return Requested">Return Requested</option>
            </select>
          </div>
        </div>
      </div>

      <div className="support-panel-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Support Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => (
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

                  <td>{formatCurrency(order.totalAmount)}</td>
                  <td>{order.paymentMethod}</td>

                  <td>
                    <div className="d-flex flex-column gap-2">
                      <select
                        className="form-select support-order-status-select"
                        value={order.orderStatus}
                        disabled={
                          updatingOrderId === order.orderId ||
                          order.orderStatus === "Cancelled" ||
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

                        {supportEditableStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      {order.orderStatus === "Return Requested" ||
                      canReturnOrder(order.orderStatus) ? (
                        <Button
                          variant="warning"
                          className="btn-sm"
                          disabled={updatingOrderId === order.orderId}
                          onClick={() => void handleApproveReturn(order)}
                        >
                          Approve Return
                        </Button>
                      ) : null}

                      {updatingOrderId === order.orderId ? (
                        <span className="spinner-border spinner-border-sm text-primary" />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No orders found.
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

export default SupportOrdersPage;