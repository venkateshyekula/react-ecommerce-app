import type { AgentEscalationSummary } from "../../types/agentEscalationReassignment";

type AgentEscalationSummaryCardsProps = {
  summary?: AgentEscalationSummary;
};

const AgentEscalationSummaryCards = ({
  summary
}: AgentEscalationSummaryCardsProps) => {
  // Guard against undefined loading states
  if (!summary) {
    return null;
  }

  const cards = [
    {
      label: "Escalation Rows",
      value: summary.totalRows,
      iconClassName: "bi bi-diagram-3",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Open",
      value: summary.openEscalations,
      iconClassName: "bi bi-exclamation-circle",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "In Progress",
      value: summary.inProgressEscalations,
      iconClassName: "bi bi-hourglass-split",
      badgeClassName: "text-bg-info text-dark"
    },
    {
      label: "Reassigned",
      value: summary.reassignedEscalations,
      iconClassName: "bi bi-arrow-left-right",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Resolved",
      value: summary.resolvedEscalations,
      iconClassName: "bi bi-check-circle",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Critical Risk",
      value: summary.criticalRiskCount,
      iconClassName: "bi bi-exclamation-octagon",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "High Risk",
      value: summary.highRiskCount,
      iconClassName: "bi bi-shield-exclamation",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Unavailable Agents",
      value: summary.unavailableAgents,
      iconClassName: "bi bi-person-x",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Overloaded Agents",
      value: summary.overloadedAgents,
      iconClassName: "bi bi-person-lines-fill",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "SLA Breaches",
      value: summary.slaBreachedRows,
      iconClassName: "bi bi-clock-history",
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
                <span className="text-secondary small d-block text-truncate fw-medium mb-1">
                  {card.label}
                </span>
                <strong className="fs-4 text-dark lh-1">{card.value}</strong>
              </div>

              <span
                className={`badge rounded-pill p-2 d-inline-flex align-items-center justify-content-center ${card.badgeClassName}`}
                style={{ width: "28px", height: "28px" }}
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

export default AgentEscalationSummaryCards;