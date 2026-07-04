import { useEffect, useState } from "react";
import Loader from "../../components/common/Loader";
import { adminService, type AdminDashboardStats } from "../../services/adminService";
import { formatCurrency } from "../../utils/currencyFormatter";
import { getOrderStatusBadgeClass } from "../../utils/orderUtils";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadDashboardStats = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const result = await adminService.getDashboardStats();
        setStats(result);
      } catch {
        setErrorMessage(
          "Unable to load admin dashboard. Please make sure JSON Server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboardStats();
  }, []);

  if (isLoading) {
    return <Loader message="Loading admin dashboard..." />;
  }

  if (errorMessage || !stats) {
    return (
      <div className="alert alert-danger" role="alert">
        {errorMessage}
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Admin Dashboard</h1>
          <p className="text-muted mb-0">
            Platform overview, revenue, orders, and inventory insights.
          </p>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3">
          <div className="admin-stat-card">
            <div className="admin-stat-icon bg-primary-subtle text-primary">
              <i className="bi bi-box-seam" />
            </div>
            <p className="text-muted mb-1">Total Products</p>
            <h3 className="fw-bold mb-0">{stats.totalProducts}</h3>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="admin-stat-card">
            <div className="admin-stat-icon bg-success-subtle text-success">
              <i className="bi bi-receipt" />
            </div>
            <p className="text-muted mb-1">Total Orders</p>
            <h3 className="fw-bold mb-0">{stats.totalOrders}</h3>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="admin-stat-card">
            <div className="admin-stat-icon bg-warning-subtle text-warning">
              <i className="bi bi-currency-rupee" />
            </div>
            <p className="text-muted mb-1">Revenue</p>
            <h3 className="fw-bold mb-0">
              {formatCurrency(stats.totalRevenue)}
            </h3>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="admin-stat-card">
            <div className="admin-stat-icon bg-danger-subtle text-danger">
              <i className="bi bi-exclamation-triangle" />
            </div>
            <p className="text-muted mb-1">Low / Out Stock</p>
            <h3 className="fw-bold mb-0">
              {stats.lowStockCount} / {stats.outOfStockCount}
            </h3>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-xl-7">
          <div className="admin-panel-card">
            <h5 className="fw-bold mb-3">Recent Orders</h5>

            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="fw-semibold">{order.orderId}</td>
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
                      <td>
                        {new Intl.DateTimeFormat("en-IN", {
                          dateStyle: "medium"
                        }).format(new Date(order.orderDate))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-xl-5">
          <div className="admin-panel-card">
            <h5 className="fw-bold mb-3">Low Stock Products</h5>

            {stats.lowStockProducts.length === 0 ? (
              <p className="text-muted mb-0">No low stock products found.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {stats.lowStockProducts.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="d-flex justify-content-between align-items-center border-bottom pb-2"
                  >
                    <div>
                      <h6 className="fw-semibold mb-1">{product.name}</h6>
                      <p className="small text-muted mb-0">{product.brand}</p>
                    </div>

                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                      Stock: {product.stock}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;