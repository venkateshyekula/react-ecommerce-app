import type { AgentGeoTrackingSummary } from "../../types/agentGeoTracking";

type AgentGeoTrackingSummaryCardsProps = {
  summary: AgentGeoTrackingSummary;
};

const AgentGeoTrackingSummaryCards = ({
  summary
}: AgentGeoTrackingSummaryCardsProps) => {
  const avgAge = Number.isFinite(summary.averageLocationAgeMinutes)
    ? summary.averageLocationAgeMinutes
    : 0;

  const cards = [
    {
      label: "Tasks",
      value: summary.totalRows ?? 0,
      iconClassName: "bi bi-list-task",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Live",
      value: summary.liveTrackingRows ?? 0,
      iconClassName: "bi bi-broadcast",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Stale",
      value: summary.staleTrackingRows ?? 0,
      iconClassName: "bi bi-clock-history",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "No Location",
      value: summary.noLocationRows ?? 0,
      iconClassName: "bi bi-geo-alt",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Active Agents",
      value: summary.activeAgents ?? 0,
      iconClassName: "bi bi-person-check",
      badgeClassName: "text-bg-info"
    },
    {
      label: "Breached",
      value: summary.breachedTasks ?? 0,
      iconClassName: "bi bi-exclamation-octagon",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "High Risk",
      value: (summary.highRiskRows ?? 0) + (summary.criticalRiskRows ?? 0),
      iconClassName: "bi bi-shield-exclamation",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Avg Age",
      value: `${avgAge}m`,
      iconClassName: "bi bi-stopwatch",
      badgeClassName: "text-bg-secondary"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-6 col-md-3 col-xl-3" key={card.label}>
          <div className="bg-white border rounded-4 p-3 h-100 shadow-sm d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <span className="text-muted small d-block mb-1">{card.label}</span>
                <strong className="fs-5 text-dark">{card.value}</strong>
              </div>

              <span className={`badge rounded-pill p-2 ${card.badgeClassName}`}>
                <i className={`${card.iconClassName} fs-6`} aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentGeoTrackingSummaryCards;