import type { AgentRoutePlanningSummary } from "../../types/agentRoutePlanning";

type AgentRoutePlanningSummaryCardsProps = {
  summary: AgentRoutePlanningSummary;
};

const AgentRoutePlanningSummaryCards = ({
  summary
}: AgentRoutePlanningSummaryCardsProps) => {
  const cards = [
    {
      label: "Route Clusters",
      value: summary?.totalClusters ?? 0,
      iconClassName: "bi bi-diagram-3",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Total Tasks",
      value: summary?.totalTasks ?? 0,
      iconClassName: "bi bi-list-task",
      badgeClassName: "text-bg-info text-dark"
    },
    {
      label: "Pickups",
      value: summary?.pickupTasks ?? 0,
      iconClassName: "bi bi-arrow-return-left",
      badgeClassName: "text-bg-secondary"
    },
    {
      label: "Deliveries",
      value: summary?.deliveryTasks ?? 0,
      iconClassName: "bi bi-truck",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Unassigned",
      value: summary?.unassignedTasks ?? 0,
      iconClassName: "bi bi-person-dash",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Assigned",
      value: summary?.assignedTasks ?? 0,
      iconClassName: "bi bi-person-check",
      badgeClassName: "text-bg-success"
    },
    {
      label: "High Priority",
      value: summary?.urgentTasks ?? 0,
      iconClassName: "bi bi-exclamation-triangle",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "No Suggestion",
      value: summary?.clustersWithNoAgentSuggestion ?? 0,
      iconClassName: "bi bi-question-circle",
      badgeClassName: "text-bg-dark"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-6 col-md-4 col-xl-3" key={card.label}>
          <div className="bg-white border rounded-3 p-3 h-100 shadow-sm">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <span className="text-muted small d-block mb-1">
                  {card.label}
                </span>
                <strong className="fs-4">{card.value.toLocaleString()}</strong>
              </div>

              <span
                className={`badge align-slef-start rounded-pill d-inline-flex align-items-center justify-content-center p-2 ${card.badgeClassName}`}
                style={{ width: "32px", height: "32px" }}
              >
                <i className={card.iconClassName} aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentRoutePlanningSummaryCards;