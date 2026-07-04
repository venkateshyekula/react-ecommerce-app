import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const SellerLayout = () => {
  const { currentUser } = useAuth();

  return (
    <main className="seller-layout bg-light">
      <div className="container-fluid">
        <div className="row">
          <aside className="col-lg-2 seller-sidebar">
            <div className="seller-sidebar-inner">
              <h4 className="fw-bold mb-1">
                <i className="bi bi-shop me-2 text-primary" />
                Seller
              </h4>

              <p className="small text-muted mb-4">
                {currentUser?.name}
              </p>

              <nav className="nav flex-column gap-2">
                <NavLink
                  to="/seller/dashboard"
                  className={({ isActive }) =>
                    `seller-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <i className="bi bi-grid-1x2 me-2" />
                  Dashboard
                </NavLink>

                <NavLink
                  to="/seller/products"
                  className={({ isActive }) =>
                    `seller-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <i className="bi bi-box-seam me-2" />
                  My Products
                </NavLink>

                <NavLink
                  to="/seller/orders"
                  className={({ isActive }) =>
                    `seller-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <i className="bi bi-receipt me-2" />
                  My Orders
                </NavLink>
              </nav>
            </div>
          </aside>

          <section className="col-lg-10 seller-content">
            <Outlet />
          </section>
        </div>
      </div>
    </main>
  );
};

export default SellerLayout;