import { useEffect, useMemo, useState } from "react";
import Loader from "../../components/common/Loader";
import {
  analyticsService,
  type AdminAnalytics,
} from "../../services/analyticsService";
import { formatCurrency } from "../../utils/currencyFormatter";

const getBarWidth = (value: number, maxValue: number): string => {
  if (maxValue <= 0) {
    return "0%";
  }

  return `${Math.max(4, Math.round((value / maxValue) * 100))}%`;
};

const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadAnalytics = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const result = await analyticsService.getAdminAnalytics();
        setAnalytics(result);
      } catch {
        setErrorMessage(
          "Unable to load analytics dashboard. Please make sure JSON Server is running.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadAnalytics();
  }, []);

  const maxMonthlyRevenue = useMemo(() => {
    if (!analytics) {
      return 0;
    }

    return Math.max(
      ...analytics.monthlySales.map((metric) => metric.revenue),
      0,
    );
  }, [analytics]);

  const maxCategoryRevenue = useMemo(() => {
    if (!analytics) {
      return 0;
    }

    return Math.max(
      ...analytics.categoryRevenue.map((metric) => metric.revenue),
      0,
    );
  }, [analytics]);

  if (isLoading) {
    return <Loader message="Loading analytics dashboard..." />;
  }

  if (errorMessage || !analytics) {
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
          <h1 className="fw-bold mb-1">Analytics Dashboard</h1>
          <p className="text-muted mb-0">
            Sales performance, inventory insights, top products, and customer
            metrics.
          </p>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3">
          <div className="analytics-stat-card">
            <div className="analytics-stat-icon bg-primary-subtle text-primary">
              <i className="bi bi-currency-rupee" />
            </div>
            <p className="text-muted mb-1">Total Revenue</p>
            <h3 className="fw-bold mb-0">
              {formatCurrency(analytics.totalRevenue)}
            </h3>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="analytics-stat-card">
            <div className="analytics-stat-icon bg-success-subtle text-success">
              <i className="bi bi-receipt" />
            </div>
            <p className="text-muted mb-1">Total Orders</p>
            <h3 className="fw-bold mb-0">{analytics.totalOrders}</h3>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="analytics-stat-card">
            <div className="analytics-stat-icon bg-warning-subtle text-warning">
              <i className="bi bi-bag-check" />
            </div>
            <p className="text-muted mb-1">Average Order Value</p>
            <h3 className="fw-bold mb-0">
              {formatCurrency(analytics.averageOrderValue)}
            </h3>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="analytics-stat-card">
            <div className="analytics-stat-icon bg-info-subtle text-info">
              <i className="bi bi-people" />
            </div>
            <p className="text-muted mb-1">Active Customers</p>
            <h3 className="fw-bold mb-0">
              {analytics.activeCustomers} / {analytics.totalCustomers}
            </h3>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-xl-7">
          <div className="analytics-panel-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-1">Monthly Sales</h5>
                <p className="small text-muted mb-0">
                  Revenue and order count by month.
                </p>
              </div>
            </div>

            {analytics.monthlySales.length === 0 ? (
              <p className="text-muted mb-0">No sales data available.</p>
            ) : (
              <div className="analytics-bar-chart">
                {analytics.monthlySales.map((metric) => (
                  <div className="analytics-bar-row" key={metric.month}>
                    <div className="analytics-bar-label">{metric.month}</div>

                    <div className="analytics-bar-track">
                      <div
                        className="analytics-bar-fill"
                        style={{
                          width: getBarWidth(metric.revenue, maxMonthlyRevenue),
                        }}
                      />
                    </div>

                    <div className="analytics-bar-value">
                      <strong>{formatCurrency(metric.revenue)}</strong>
                      <span>{metric.orders} orders</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-xl-5">
          <div className="analytics-panel-card">
            <h5 className="fw-bold mb-3">Inventory Insights</h5>

            <div className="inventory-insight-grid">
              <div className="inventory-insight-box">
                <p className="text-muted mb-1">Total Products</p>
                <h4 className="fw-bold mb-0">
                  {analytics.inventory.totalProducts}
                </h4>
              </div>

              <div className="inventory-insight-box">
                <p className="text-muted mb-1">Stock Units</p>
                <h4 className="fw-bold mb-0">
                  {analytics.inventory.totalStockUnits}
                </h4>
              </div>

              <div className="inventory-insight-box">
                <p className="text-muted mb-1">Low Stock</p>
                <h4 className="fw-bold text-warning mb-0">
                  {analytics.inventory.lowStockProducts.length}
                </h4>
              </div>

              <div className="inventory-insight-box">
                <p className="text-muted mb-1">Out of Stock</p>
                <h4 className="fw-bold text-danger mb-0">
                  {analytics.inventory.outOfStockProducts.length}
                </h4>
              </div>
            </div>

            <hr />

            <h6 className="fw-bold mb-3">Low Stock Products</h6>

            {analytics.inventory.lowStockProducts.length === 0 ? (
              <p className="text-muted mb-0">No low stock products found.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {analytics.inventory.lowStockProducts
                  .slice(0, 5)
                  .map((product) => (
                    <div
                      className="d-flex justify-content-between align-items-center border-bottom pb-2"
                      key={product.id}
                    >
                      <div>
                        <h6 className="fw-semibold mb-1">{product.name}</h6>
                        <p className="small text-muted mb-0">{product.brand}</p>
                      </div>

                      <span className="badge bg-warning text-dark">
                        Stock: {product.stock}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-xl-6">
          <div className="analytics-panel-card">
            <h5 className="fw-bold mb-3">Category Revenue</h5>

            {analytics.categoryRevenue.length === 0 ? (
              <p className="text-muted mb-0">No category revenue found.</p>
            ) : (
              <div className="analytics-category-list">
                {analytics.categoryRevenue.map((metric) => (
                  <div
                    className="analytics-category-item"
                    key={metric.category}
                  >
                    <div className="d-flex justify-content-between mb-2">
                      <div>
                        <h6 className="fw-bold mb-0">{metric.category}</h6>
                        <p className="small text-muted mb-0">
                          {metric.quantity} units sold
                        </p>
                      </div>

                      <strong>{formatCurrency(metric.revenue)}</strong>
                    </div>

                    <div className="analytics-category-track">
                      <div
                        className="analytics-category-fill"
                        style={{
                          width: getBarWidth(
                            metric.revenue,
                            maxCategoryRevenue,
                          ),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-xl-6">
          <div className="analytics-panel-card">
            <h5 className="fw-bold mb-3">Customer Metrics</h5>

            <div className="customer-metric-summary mb-4">
              <div>
                <p className="text-muted mb-1">Registered Customers</p>
                <h4 className="fw-bold mb-0">{analytics.totalCustomers}</h4>
              </div>

              <div>
                <p className="text-muted mb-1">Active Customers</p>
                <h4 className="fw-bold mb-0">{analytics.activeCustomers}</h4>
              </div>
            </div>

            <h6 className="fw-bold mb-3">Top Customers</h6>

            {analytics.topCustomers.length === 0 ? (
              <p className="text-muted mb-0">
                No customer purchase data found.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Orders</th>
                      <th>Spent</th>
                    </tr>
                  </thead>

                  <tbody>
                    {analytics.topCustomers.map((customer) => (
                      <tr key={customer.userId}>
                        <td>
                          <h6 className="fw-semibold mb-1">{customer.name}</h6>
                          <p className="small text-muted mb-0">
                            {customer.email}
                          </p>
                        </td>
                        <td>{customer.totalOrders}</td>
                        <td>{formatCurrency(customer.totalSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="analytics-panel-card">
        <h5 className="fw-bold mb-3">Top Selling Products</h5>

        {analytics.topSellingProducts.length === 0 ? (
          <p className="text-muted mb-0">No top selling products found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>

              <tbody>
                {analytics.topSellingProducts.map((product) => (
                  <tr key={product.productId}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="rounded-3 border object-fit-cover"
                          style={{ width: "75px", height: "75px" }}
                        />

                        <div>
                          <h6 className="fw-semibold mb-1">{product.name}</h6>
                          <p className="small text-muted mb-0">
                            {product.brand}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td>{product.category}</td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        {product.quantitySold}
                      </span>
                    </td>
                    <td>{formatCurrency(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
