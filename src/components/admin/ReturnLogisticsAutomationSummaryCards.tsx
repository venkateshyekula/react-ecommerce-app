import type { ReturnLogisticsAutomationSummary } from "../../types/returnLogisticsAutomationRule";

type ReturnLogisticsAutomationSummaryCardsProps = {
  summary: ReturnLogisticsAutomationSummary;
};

const ReturnLogisticsAutomationSummaryCards = ({
  summary
}: ReturnLogisticsAutomationSummaryCardsProps) => {
  const cards = [
    {
      label: "Total Rules",
      value: summary.totalRules,
      iconClassName: "bi bi-sliders",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Active",
      value: summary.activeRules,
      iconClassName: "bi bi-check-circle",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Inactive",
      value: summary.inactiveRules,
      iconClassName: "bi bi-pause-circle",
      badgeClassName: "text-bg-secondary"
    },
    {
      label: "Critical",
      value: summary.criticalRules,
      iconClassName: "bi bi-exclamation-triangle",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Executions",
      value: summary.totalExecutions.toLocaleString(),
      iconClassName: "bi bi-lightning-charge",
      badgeClassName: "text-bg-info"
    },
    {
      label: "Success Rate",
      value: `${summary.successRate}%`,
      iconClassName: "bi bi-graph-up",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Pickup Rules",
      value: summary.pickupRules,
      iconClassName: "bi bi-truck",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "QC Rules",
      value: summary.qcRules,
      iconClassName: "bi bi-clipboard-check",
      badgeClassName: "text-bg-info"
    },
    {
      label: "Refund Rules",
      value: summary.refundRules,
      iconClassName: "bi bi-cash-stack",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Escalation Rules",
      value: summary.escalationRules,
      iconClassName: "bi bi-arrow-up-circle",
      badgeClassName: "text-bg-danger"
    }
  ];

  return (
    <div className="row row-cols-2 row-cols-md-3 row-cols-xl-5 g-3 mb-4">
      {cards.map((card) => (
        <div className="col" key={card.label}>
          <div className="bg-white border rounded-4 p-3 h-100 shadow-sm">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <span className="text-muted small d-block mb-1">{card.label}</span>
                <strong className="fs-5 fw-bold text-dark">{card.value}</strong>
              </div>

              <span
                className={`badge rounded-pill ${card.badgeClassName} p-2 d-inline-flex align-items-center justify-content-center`}
              >
                <i className={`${card.iconClassName} fs-6`} aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReturnLogisticsAutomationSummaryCards;