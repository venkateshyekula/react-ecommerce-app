import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

interface AgentUserShape {
  name?: string;
  role?: string;
  partnerId?: string;
}

const AgentDashboardPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const agentUser = currentUser as AgentUserShape | null;

  return (
    <main className="agent-dashboard-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <h1 className="fw-bold mb-1">Agent Dashboard</h1>
          <p className="text-muted mb-0">
            Welcome {agentUser?.name ?? "Agent"}. View assigned pickup and
            delivery tasks.
          </p>
        </div>
      </section>

      <section className="container-fluid py-4">
        <div className="row g-3">
          <div className="col-lg-4">
            <div className="agent-dashboard-card bg-white border shadow-sm p-4 h-100">
              <div className="agent-dashboard-icon bg-primary-subtle text-primary">
                <i className="bi bi-arrow-return-left" />
              </div>

              <h5 className="fw-bold mt-3">My Return Pickups</h5>
              <p className="text-muted small">
                View and update return pickups assigned to your partner ID.
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate("/agent/returns")}
              >
                Open Return Pickups
              </button>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="agent-dashboard-card bg-white border shadow-sm p-4 h-100">
              <div className="agent-dashboard-icon bg-success-subtle text-success">
                <i className="bi bi-truck" />
              </div>

              <h5 className="fw-bold mt-3">My Deliveries</h5>
              <p className="text-muted small">
                Delivery agent workflow will be added in Phase 12O.
              </p>

              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled
              >
                Coming Soon
              </button>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="agent-dashboard-card bg-white border shadow-sm p-4 h-100">
              <div className="agent-dashboard-icon bg-warning-subtle text-warning">
                <i className="bi bi-person-badge" />
              </div>

              <h5 className="fw-bold mt-3">Partner ID</h5>
              <p className="text-muted small mb-1">Mapped pickup partner</p>
              <strong>{agentUser?.partnerId ?? "Not mapped"}</strong>
            </div>
          </div>
        </div>
      </section>
      <pre className="bg-light border rounded-3 p-3 small">
        {JSON.stringify(currentUser, null, 2)}
      </pre>
    </main>
  );
};

export default AgentDashboardPage;
