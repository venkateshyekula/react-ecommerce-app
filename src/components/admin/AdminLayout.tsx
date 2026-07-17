import { NavLink, Outlet } from "react-router-dom";

interface AdminNavItem {
  label: string;
  path: string;
  icon: string;
}

const adminNavItems: AdminNavItem[] = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: "bi bi-speedometer2",
  },
  {
    label: "Analytics",
    path: "/admin/analytics",
    icon: "bi bi-bar-chart-line",
  },
  {
    label: "Products",
    path: "/admin/products",
    icon: "bi bi-box-seam",
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: "bi bi-receipt",
  },
  {
  label: "Wallet",
  path: "/wallet",
  icon: "bi bi-wallet2"
},
{
  label: "Reward Rules",
  path: "/admin/reward-rules",
  icon: "bi bi-stars"
},
  {
    label: "Fulfillment",
    path: "/admin/order-fulfillment",
    icon: "bi bi-box-seam",
  },
  {
    label: "Return Policies",
    path: "/admin/return-policies",
    icon: "bi bi-arrow-counterclockwise",
  },
  {
    label: "Return Requests",
    path: "/admin/return-requests",
    icon: "bi bi-arrow-return-left",
  },
  {
    label: "Refunds",
    path: "/admin/refunds",
    icon: "bi bi-cash-coin",
  },
  {
  label: "Wallet Credits",
  path: "/admin/wallet-credits",
  icon: "bi bi-wallet2"
},
  {
    label: "Delivery",
    path: "/admin/delivery",
    icon: "bi bi-truck",
  },
  {
    label: "Delivery SLA",
    path: "/admin/delivery-sla",
    icon: "bi bi-speedometer2",
  },
  {
    label: "Seller Fulfillment",
    path: "/admin/seller-fulfillment",
    icon: "bi bi-diagram-3",
  },
  {
    label: "Delivery Analytics",
    path: "/admin/delivery-analytics",
    icon: "bi bi-graph-up-arrow",
  },
  {
    label: "Coupons",
    path: "/admin/coupons",
    icon: "bi bi-ticket-perforated",
  },
  {
    label: "Reviews",
    path: "/admin/reviews",
    icon: "bi bi-chat-square-text",
  },
  {
    label: "Questions",
    path: "/admin/questions",
    icon: "bi bi-question-circle",
  },
];

const AdminLayout = () => {
  return (
    <main className="admin-layout dashboard-layout bg-light">
      <div className="container-fluid">
        <div className="row">
          <aside className="col-lg-2 dashboard-sidebar admin-sidebar">
            <div className="dashboard-sidebar-inner admin-sidebar-inner">
              <div className="dashboard-sidebar-header mb-2">
                <h4 className="fw-bold mb-1">
                  <i className="bi bi-shield-check me-2 text-primary" />
                  Admin
                </h4>

                <p className="small text-muted mb-0">Manage store operations</p>
              </div>

              <nav
                className="nav nav-underline flex-column dashboard-vertical-tabs admin-vertical-tabs"
                aria-label="Admin navigation"
              >
                {adminNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-link dashboard-vertical-tab admin-vertical-tab ${
                        isActive ? "active" : ""
                      }`
                    }
                  >
                    <span className="dashboard-tab-icon">
                      <i className={item.icon} />
                    </span>

                    <span className="dashboard-tab-label">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>

          <section className="col-lg-10 dashboard-content admin-content">
            <Outlet />
          </section>
        </div>
      </div>
    </main>
  );
};

export default AdminLayout;