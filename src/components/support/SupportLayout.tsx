import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const SupportLayout = () => {
  const { currentUser } = useAuth();

  return (
    <main className="support-layout bg-light">
      <div className="container-fluid">
        <div className="row">
          <aside className="col-lg-2 support-sidebar">
            <div className="support-sidebar-inner">
              <h4 className="fw-bold mb-1">
                <i className="bi bi-headset me-2 text-primary" />
                Support
              </h4>

              <p className="small text-muted mb-4">{currentUser?.name}</p>

              <nav className="nav flex-column gap-2">
                <NavLink
                  to="/support/dashboard"
                  className={({ isActive }) =>
                    `support-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <i className="bi bi-grid-1x2 me-2" />
                  Dashboard
                </NavLink>

                <NavLink
                  to="/support/orders"
                  className={({ isActive }) =>
                    `support-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <i className="bi bi-receipt me-2" />
                  Orders Help
                </NavLink>

                <NavLink
                  to="/support/tickets"
                  className={({ isActive }) =>
                    `support-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <i className="bi bi-chat-dots me-2" />
                  Tickets
                </NavLink>
              </nav>
            </div>
          </aside>

          <section className="col-lg-10 support-content">
            <Outlet />
          </section>
        </div>
      </div>
    </main>
  );
};

export default SupportLayout;