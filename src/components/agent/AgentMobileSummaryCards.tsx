import type { AgentMobileSummary } from "../../types/agentMobileExperience";

type AgentMobileSummaryCardsProps = {
  summary: AgentMobileSummary;
};

const AgentMobileSummaryCards = ({ summary }: AgentMobileSummaryCardsProps) => {
  const cards = [
    {
      label: "Tasks",
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
      label: "In Progress",
      value: summary.inProgressTasks,
      iconClassName: "bi bi-arrow-repeat",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Reached",
      value: summary.reachedLocationTasks,
      iconClassName: "bi bi-geo-alt",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Completed",
      value: summary.completedTasks,
      iconClassName: "bi bi-check-circle",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Failed",
      value: summary.failedTasks,
      iconClassName: "bi bi-x-circle",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Proof Pending",
      value: summary.proofPendingTasks,
      iconClassName: "bi bi-camera",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "High Priority",
      value: summary.highPriorityTasks + summary.criticalPriorityTasks,
      subValue: summary.criticalPriorityTasks > 0 ? `${summary.criticalPriorityTasks} Critical` : undefined,
      iconClassName: "bi bi-exclamation-triangle",
      badgeClassName: "text-bg-danger"
    }
  ];

  return (
    <div className="row g-2 mb-3">
      {cards.map((card) => (
        <div className="col-6 col-md-3" key={card.label}>
          <div className="bg-white border rounded-4 p-3 h-100 shadow-sm">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <span className="text-muted small d-block">{card.label}</span>
                <strong className="fs-5">{card.value}</strong>
                {card.subValue && (
                  <span className="d-block text-danger fw-semibold extra-small mt-1">
                    {card.subValue}
                  </span>
                )}
              </div>

              <span
                className={`badge rounded-pill ${card.badgeClassName} p-2 d-inline-flex align-items-center justify-content-center`}
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

export default AgentMobileSummaryCards;