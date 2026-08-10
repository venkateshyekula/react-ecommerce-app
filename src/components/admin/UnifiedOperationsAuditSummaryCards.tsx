import type { UnifiedOperationsAuditSummary } from "../../types/unifiedOperationsAudit";

type UnifiedOperationsAuditSummaryCardsProps = {
  summary?: UnifiedOperationsAuditSummary;
};

const UnifiedOperationsAuditSummaryCards = ({
  summary
}: UnifiedOperationsAuditSummaryCardsProps) => {
  // Return early or handle null/undefined if summary isn't available yet
  if (!summary) {
    return null;
  }

  const cards = [
    {
      label: "Audit Records",
      value: summary.totalRecords,
      iconClassName: "bi bi-journal-text",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Return Events",
      value: summary.returnEvents,
      iconClassName: "bi bi-arrow-return-left",
      badgeClassName: "text-bg-info"
    },
    {
      label: "Refund Events",
      value: summary.refundEvents,
      iconClassName: "bi bi-cash-stack",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Proof Events",
      value: summary.proofEvents,
      iconClassName: "bi bi-card-checklist",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Automation",
      value: summary.automationEvents,
      iconClassName: "bi bi-sliders",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "SLA Escalations",
      value: summary.slaEscalationEvents,
      iconClassName: "bi bi-clock-history",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Agent Escalations",
      value: summary.agentEscalationEvents,
      iconClassName: "bi bi-diagram-3",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Seller Payouts",
      value: summary.sellerPayoutEvents,
      iconClassName: "bi bi-wallet2",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Review Required",
      value: summary.reviewRequiredEvents,
      iconClassName: "bi bi-eye",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Exportable",
      value: summary.exportableRecords,
      iconClassName: "bi bi-download",
      badgeClassName: "text-bg-success"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-6 col-md-4 col-xl-2" key={card.label}>
          <div className="bg-white border rounded-4 p-3 h-100 shadow-sm">
            <div className="d-flex justify-content-between gap-2">
              <div>
                <span className="text-muted small d-block">{card.label}</span>
                <strong className="fs-6">
                  {(card.value ?? 0).toLocaleString()}
                </strong>
              </div>

              <span className={`badge align-self-start rounded-pill ${card.badgeClassName}`}>
                <i className={card.iconClassName} aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UnifiedOperationsAuditSummaryCards;