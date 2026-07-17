import { NavLink, Outlet } from "react-router-dom";

interface SellerNavItem {
  label: string;
  path: string;
  icon: string;
}

const sellerNavItems: SellerNavItem[] = [
  {
    label: "Dashboard",
    path: "/seller/dashboard",
    icon: "bi bi-speedometer2"
  },
  {
    label: "Products",
    path: "/seller/products",
    icon: "bi bi-box-seam"
  },
  {
    label: "Orders",
    path: "/seller/orders",
    icon: "bi bi-receipt"
  },
  {
    label: "Questions",
    path: "/seller/questions",
    icon: "bi bi-question-circle"
  }
];

const SellerLayout = () => {
  return (
    <main className="seller-layout dashboard-layout bg-light">
      <div className="container-fluid">
        <div className="row">
          <aside className="col-lg-2 dashboard-sidebar seller-sidebar">
            <div className="dashboard-sidebar-inner seller-sidebar-inner">
              <div className="dashboard-sidebar-header mb-4">
                <h4 className="fw-bold mb-1">
                  <i className="bi bi-shop me-2 text-primary" />
                  Seller
                </h4>

                <p className="small text-muted mb-0">
                  Manage catalog and orders
                </p>
              </div>

              <nav
                className="nav nav-underline flex-column dashboard-vertical-tabs seller-vertical-tabs"
                aria-label="Seller navigation"
              >
                {sellerNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-link dashboard-vertical-tab seller-vertical-tab ${
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

          <section className="col-lg-10 dashboard-content seller-content">
            <Outlet />
          </section>
        </div>
      </div>
    </main>
  );
};

export default SellerLayout;