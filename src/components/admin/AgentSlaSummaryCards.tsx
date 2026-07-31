import type { AgentSlaSummary } from "../../types/agentSla";

type AgentSlaSummaryCardsProps = {
  summary: AgentSlaSummary;
};

const AgentSlaSummaryCards = ({ summary }: AgentSlaSummaryCardsProps) => {
  const cards = [
    {
      label: "Total Tasks",
      value: summary.totalTasks,
      iconClassName: "bi bi-list-task",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Assigned",
      value: summary.assignedTasks,
      iconClassName: "bi bi-person-check",
      badgeClassName: "text-bg-info"
    },
    {
      label: "Unassigned",
      value: summary.unassignedTasks,
      iconClassName: "bi bi-person-dash",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Pickups",
      value: summary.pickupTasks,
      iconClassName: "bi bi-arrow-return-left",
      badgeClassName: "text-bg-secondary"
    },
    {
      label: "Deliveries",
      value: summary.deliveryTasks,
      iconClassName: "bi bi-truck",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Completed",
      value: summary.completedTasks,
      iconClassName: "bi bi-check-circle",
      badgeClassName: "text-bg-success"
    },
    {
      label: "At Risk",
      value: summary.atRiskTasks,
      iconClassName: "bi bi-hourglass-split",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "SLA Breached",
      value: summary.breachedTasks,
      iconClassName: "bi bi-exclamation-triangle",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Active Agents",
      value: summary.activeAgents,
      iconClassName: "bi bi-people",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Overloaded",
      value: summary.overloadedAgents,
      iconClassName: "bi bi-speedometer2",
      badgeClassName: "text-bg-danger"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-6 col-md-4 col-xl-2" key={card.label}>
          <div className="bg-white border rounded-4 p-3 h-100 shadow-sm d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <span className="text-muted small d-block mb-1">{card.label}</span>
                <strong className="fs-4 fw-bold">{card.value ?? 0}</strong>
              </div>

              <span
                className={`badge rounded-pill p-2 d-inline-flex align-items-center justify-content-center ${card.badgeClassName}`}
                style={{ width: "32px", height: "32px" }}
              >
                <i className={`${card.iconClassName} fs-6`} />
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentSlaSummaryCards;