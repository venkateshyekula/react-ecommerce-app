import type { AgentPerformanceSummary } from "../../types/agentPerformance";

type AgentPerformanceSummaryCardsProps = {
  summary: AgentPerformanceSummary;
};

const AgentPerformanceSummaryCards = ({
  summary
}: AgentPerformanceSummaryCardsProps) => {
  const cards = [
    {
      label: "Total Agents",
      value: summary.totalAgents,
      iconClassName: "bi bi-people",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Active Agents",
      value: summary.activeAgents,
      iconClassName: "bi bi-person-check",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Total Tasks",
      value: summary.totalTasks,
      iconClassName: "bi bi-list-task",
      badgeClassName: "text-bg-info"
    },
    {
      label: "Completed",
      value: summary.completedTasks,
      iconClassName: "bi bi-check-circle",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Attempted",
      value: summary.attemptedTasks,
      iconClassName: "bi bi-exclamation-circle",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Failed",
      value: summary.failedTasks,
      iconClassName: "bi bi-x-circle",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Verified Proofs",
      value: summary.verifiedProofs,
      iconClassName: "bi bi-shield-check",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Rejected Proofs",
      value: summary.rejectedProofs,
      iconClassName: "bi bi-shield-x",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Avg Completion",
      value: `${summary.averageCompletionRate}%`,
      iconClassName: "bi bi-graph-up-arrow",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Avg Score",
      value: summary.averagePerformanceScore,
      iconClassName: "bi bi-speedometer2",
      badgeClassName: "text-bg-dark"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-6 col-sm-4 col-md-3 col-xl" key={card.label}>
          <div className="bg-white border rounded-3 p-3 h-100 shadow-sm d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <span className="text-muted small d-block mb-1">{card.label}</span>
                <strong className="fs-5">{card.value}</strong>
              </div>

              <span
                className={`badge align-self-start rounded-circle p-2 d-inline-flex align-items-center justify-content-center ${card.badgeClassName}`}
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

export default AgentPerformanceSummaryCards;