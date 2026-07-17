import { useEffect, useMemo, useState } from "react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import AdminTablePagination from "../../components/admin/AdminTablePagination";
import { useAdminTablePagination } from "../../hooks/useAdminTablePagination";
import { orderService } from "../../services/orderService";
import type { FulfillmentStatus, Order } from "../../types/order";
import { formatCurrency } from "../../utils/currencyFormatter";
import { formatDeliveryPromiseDate } from "../../utils/deliveryEstimate";

const fulfillmentStatuses: FulfillmentStatus[] = [
  "PENDING",
  "ALLOCATED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED"
];

const statusLabels: Record<FulfillmentStatus, string> = {
  PENDING: "Pending",
  ALLOCATED: "Allocated",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  FAILED: "Failed"
};

const getStatusBadgeClass = (status?: FulfillmentStatus): string => {
  switch (status) {
    case "DELIVERED":
      return "bg-success";

    case "FAILED":
      return "bg-danger";

    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
      return "bg-primary";

    case "ALLOCATED":
    case "PACKED":
      return "bg-info";

    case "PENDING":
    default:
      return "bg-secondary";
  }
};

const AdminOrderFulfillmentPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<FulfillmentStatus | "">("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const loadOrders = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const orderList = await orderService.getOrders();

      setOrders(
        orderList.sort(
          (firstOrder, secondOrder) =>
            new Date(secondOrder.orderDate).getTime() -
            new Date(firstOrder.orderDate).getTime()
        )
      );
    } catch {
      setErrorMessage(
        "Unable to load order fulfillment dashboard. Please make sure JSON Server is running."
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
      const fulfillmentStatus = order.fulfillmentStatus ?? "PENDING";

      const matchesStatus =
        !statusFilter || fulfillmentStatus === statusFilter;

      const searchableText = [
        order.orderId,
        order.userId,
        order.deliveryAddress?.fullName,
        order.deliveryAddress?.mobile,
        order.deliveryAddress?.pincode,
        order.deliveryPromise?.zoneName,
        order.deliveryPromise?.warehouseName,
        order.deliveryPromise?.sellerName,
        order.orderStatus,
        fulfillmentStatus
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchText, statusFilter]);

  const {
    currentPage,
    itemsPerPage,
    paginatedItems: paginatedOrders,
    setCurrentPage,
    setItemsPerPage
  } = useAdminTablePagination({
    items: filteredOrders,
    defaultItemsPerPage: 10,
    resetDependencies: [searchText, statusFilter]
  });

  const totalOrders = orders.length;

  const pendingOrders = useMemo(() => {
    return orders.filter(
      (order) => (order.fulfillmentStatus ?? "PENDING") === "PENDING"
    ).length;
  }, [orders]);

  const shippedOrders = useMemo(() => {
    return orders.filter((order) =>
      ["SHIPPED", "OUT_FOR_DELIVERY"].includes(order.fulfillmentStatus ?? "")
    ).length;
  }, [orders]);

  const deliveredOrders = useMemo(() => {
    return orders.filter((order) => order.fulfillmentStatus === "DELIVERED")
      .length;
  }, [orders]);

  const updateFulfillmentStatus = async (
    order: Order,
    fulfillmentStatus: FulfillmentStatus
  ): Promise<void> => {
    try {
      setUpdatingOrderId(order.id);
      setErrorMessage("");
      setSuccessMessage("");

      const updatedOrder = await orderService.updateOrder(order.id, {
        fulfillmentStatus
      });

      setOrders((previousOrders) =>
        previousOrders.map((existingOrder) =>
          existingOrder.id === updatedOrder.id ? updatedOrder : existingOrder
        )
      );

      setSuccessMessage(
        `Fulfillment status updated for order ${order.orderId}.`
      );
    } catch {
      setErrorMessage("Unable to update fulfillment status.");
    } finally {
      setUpdatingOrderId("");
    }
  };

  if (isLoading) {
    return <Loader message="Loading order fulfillment dashboard..." />;
  }

  return (
    <div className="admin-order-fulfillment-page">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Order Fulfillment</h1>
          <p className="text-muted mb-0">
            Track delivery promises, warehouse allocation and fulfillment
            progress.
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

      {successMessage ? (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      ) : null}

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3">
          <div className="fulfillment-stat-card">
            <span className="fulfillment-stat-icon bg-primary-subtle text-primary">
              <i className="bi bi-box-seam" />
            </span>
            <div>
              <p className="text-muted mb-1">Total Orders</p>
              <h3 className="fw-bold mb-0">{totalOrders}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="fulfillment-stat-card">
            <span className="fulfillment-stat-icon bg-warning-subtle text-warning">
              <i className="bi bi-hourglass-split" />
            </span>
            <div>
              <p className="text-muted mb-1">Pending</p>
              <h3 className="fw-bold mb-0">{pendingOrders}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="fulfillment-stat-card">
            <span className="fulfillment-stat-icon bg-info-subtle text-info">
              <i className="bi bi-truck" />
            </span>
            <div>
              <p className="text-muted mb-1">In Transit</p>
              <h3 className="fw-bold mb-0">{shippedOrders}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="fulfillment-stat-card">
            <span className="fulfillment-stat-icon bg-success-sub-subtle text-success">
              <i className="bi bi-check2-circle" />
            </span>
            <div>
              <p className="text-muted mb-1">Delivered</p>
              <h3 className="fw-bold mb-0">{deliveredOrders}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-panel-card">
        <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 mb-3">
          <h5 className="fw-bold mb-0">Fulfillment Queue</h5>

          <div className="d-flex flex-column flex-md-row gap-2">
            <input
              className="form-control admin-search-input"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search order, pincode, zone..."
            />

            <select
              className="form-select admin-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as FulfillmentStatus | "")
              }
            >
              <option value="">All Statuses</option>
              {fulfillmentStatuses.map((status) => (
                <option value={status} key={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Delivery Promise</th>
                <th>Warehouse</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>

            <tbody>
              {paginatedOrders.map((order) => {
                const fulfillmentStatus =
                  order.fulfillmentStatus ?? "PENDING";

                return (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.orderId}</strong>
                      <p className="small text-muted mb-0">
                        {new Date(order.orderDate).toLocaleString("en-IN")}
                      </p>
                    </td>

                    <td>
                      <strong>{order.deliveryAddress.fullName}</strong>
                      <p className="small text-muted mb-0">
                        {order.deliveryAddress.mobile}
                      </p>
                      <p className="small text-muted mb-0">
                        {order.deliveryAddress.pincode}
                      </p>
                    </td>

                    <td>
                      {order.deliveryPromise ? (
                        <>
                          <strong>
                            {formatDeliveryPromiseDate(
                              order.deliveryPromise.estimatedDeliveryDate
                            )}
                          </strong>
                          <p className="small text-muted mb-0">
                            {order.deliveryPromise.zoneName}
                          </p>
                          <p className="small text-muted mb-0">
                            {order.deliveryPromise.finalDeliveryDays} days
                          </p>
                        </>
                      ) : (
                        <span className="text-muted small">
                          No promise snapshot
                        </span>
                      )}
                    </td>

                    <td>
                      {order.deliveryPromise?.warehouseName ? (
                        <>
                          <strong>{order.deliveryPromise.warehouseName}</strong>
                          <p className="small text-muted mb-0">
                            {order.deliveryPromise.sellerName ??
                              "ShopEase Seller"}
                          </p>
                        </>
                      ) : (
                        <span className="text-muted small">Not assigned</span>
                      )}
                    </td>

                    <td>
                      <strong>{formatCurrency(order.totalAmount)}</strong>
                      <p className="small text-muted mb-0">
                        {order.paymentMethod}
                      </p>
                    </td>

                    <td>
                      <span
                        className={`badge ${getStatusBadgeClass(
                          fulfillmentStatus
                        )}`}
                      >
                        {statusLabels[fulfillmentStatus]}
                      </span>
                    </td>

                    <td>
                      <select
                        className="form-select form-select-sm fulfillment-status-select"
                        value={fulfillmentStatus}
                        disabled={updatingOrderId === order.id}
                        onChange={(event) =>
                          void updateFulfillmentStatus(
                            order,
                            event.target.value as FulfillmentStatus
                          )
                        }
                      >
                        {fulfillmentStatuses.map((status) => (
                          <option value={status} key={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No fulfillment orders found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <AdminTablePagination
          totalItems={filteredOrders.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemLabel="orders"
        />
      </div>
    </div>
  );
};

export default AdminOrderFulfillmentPage;