import { NavLink, Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <main className="admin-layout bg-light">
      <div className="container-fluid">
        <div className="row">
          <aside className="col-lg-2 admin-sidebar">
            <div className="admin-sidebar-inner">
              <h4 className="fw-bold mb-4">
                <i className="bi bi-speedometer2 me-2 text-primary" />
                Admin
              </h4>

              <nav className="nav flex-column gap-2">
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) =>
                    `admin-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <i className="bi bi-grid-1x2 me-2" />
                  Dashboard
                </NavLink>

                <NavLink
                  to="/admin/analytics"
                  className={({ isActive }) =>
                    `admin-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <i className="bi bi-bar-chart-line me-2" />
                  Analytics
                </NavLink>

                <NavLink
                  to="/admin/products"
                  className={({ isActive }) =>
                    `admin-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <i className="bi bi-box-seam me-2" />
                  Products
                </NavLink>

                <NavLink
                  to="/admin/orders"
                  className={({ isActive }) =>
                    `admin-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <i className="bi bi-receipt me-2" />
                  Orders
                </NavLink>
              </nav>
            </div>
          </aside>

          <section className="col-lg-10 admin-content">
            <Outlet />
          </section>
        </div>
      </div>
    </main>
  );
};

export default AdminLayout;