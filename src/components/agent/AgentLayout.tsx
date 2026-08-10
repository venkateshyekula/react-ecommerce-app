import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import "./AgentLayout.css";

interface AgentNavItem {
  label: string;
  path: string;
  icon: string;
  allowedRoles?: string[];
}

const agentNavItems: AgentNavItem[] = [
  {
    label: "Dashboard",
    path: "/agent/dashboard",
    icon: "bi bi-speedometer2",
  },
  {
    label: "Agent Mobile",
    path: "/agent/mobile",
    icon: "bi bi-phone",
    allowedRoles: ["PICKUP_AGENT", "DELIVERY_AGENT", "ADMIN"],
  },
  {
    label: "Return Pickups",
    path: "/agent/returns",
    icon: "bi bi-arrow-return-left",
    allowedRoles: ["PICKUP_AGENT", "LOGISTICS_AGENT", "ADMIN"],
  },
  {
    label: "Deliveries",
    path: "/agent/deliveries",
    icon: "bi bi-truck",
    allowedRoles: ["DELIVERY_AGENT", "LOGISTICS_AGENT", "ADMIN"],
  },
];

interface AgentUserShape {
  role?: string;
}

const allowedAgentPortalRoles = [
  "PICKUP_AGENT",
  "DELIVERY_AGENT",
  "LOGISTICS_AGENT",
  "ADMIN",
];

const AgentLayout = () => {
  const { currentUser } = useAuth();
  const agentUser = currentUser as AgentUserShape | null;

  const currentRole = agentUser?.role ?? "";

  const canAccessAgentPortal =
    Boolean(currentRole) && allowedAgentPortalRoles.includes(currentRole);

  if (!canAccessAgentPortal) {
    return <Navigate to="/" replace />;
  }

  const visibleNavItems = agentNavItems.filter((item) => {
    if (!item.allowedRoles || item.allowedRoles.length === 0) {
      return true;
    }

    return item.allowedRoles.includes(currentRole);
  });

  return (
    <main className="admin-layout dashboard-layout agent-layout bg-light min-vh-100">
      <div className="container-fluid">
        <div className="row">
          {/* Sidebar Navigation */}
          <aside className="col-lg-2 dashboard-sidebar admin-sidebar agent-sidebar">
            <div className="dashboard-sidebar-inner admin-sidebar-inner agent-sidebar-inner p-3">
              <div className="dashboard-sidebar-header mb-3 pb-2 border-bottom">
                <h5 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-truck text-primary" />
                  Field Ops
                </h5>

                <p className="extra-small text-muted mb-0">
                  Manage assigned tasks
                </p>
              </div>

              <div className="nav-section-label extra-small fw-bold text-muted text-uppercase tracking-wider mb-2 px-2">
                Navigation
              </div>

              <nav
                className="nav nav-underline flex-column dashboard-vertical-tabs admin-vertical-tabs agent-vertical-tabs"
                aria-label="Agent navigation"
              >
                {visibleNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-link dashboard-vertical-tab admin-vertical-tab agent-vertical-tab ${
                        isActive ? "active" : ""
                      }`
                    }
                  >
                    <span className="dashboard-tab-icon">
                      <i className={item.icon} />
                    </span>

                    <span className="dashboard-tab-label fw-medium">
                      {item.label}
                    </span>
                  </NavLink>
                ))}
              </nav>

              {/* Live Status Indicator Box */}
              <div className="agent-status-box mt-auto p-3 rounded-4 bg-white border shadow-sm text-center">
                <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                  <span className="status-indicator bg-success" />
                  <span className="fw-semibold extra-small text-dark">
                    Active Shift
                  </span>
                </div>

                <p className="extra-small text-muted mb-0">
                  Ready to process assigned tasks.
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content Viewport */}
          <section className="col-lg-10 dashboard-content admin-content agent-content p-3 p-md-4">
            <Outlet />
          </section>
        </div>
      </div>
    </main>
  );
};

export default AgentLayout;