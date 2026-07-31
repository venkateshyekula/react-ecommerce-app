import type { ReturnOperationsAuditSummary } from "../../types/returnOperationsAudit";

type ReturnOperationsAuditSummaryCardsProps = {
  summary: ReturnOperationsAuditSummary;
};

const ReturnOperationsAuditSummaryCards = ({
  summary
}: ReturnOperationsAuditSummaryCardsProps) => {
  const cards = [
    {
      id: "total-audit-records",
      label: "Audit Records",
      value: summary.totalAuditRecords,
      iconClassName: "bi bi-journal-text",
      badgeClassName: "text-bg-primary"
    },
    {
      id: "return-events",
      label: "Return Events",
      value: summary.returnRequestEvents,
      iconClassName: "bi bi-arrow-return-left",
      badgeClassName: "text-bg-info"
    },
    {
      id: "refund-events",
      label: "Refund Events",
      value: summary.refundEvents,
      iconClassName: "bi bi-cash-stack",
      badgeClassName: "text-bg-success"
    },
    {
      id: "proof-events",
      label: "Proof Events",
      value: summary.pickupProofEvents + summary.deliveryProofEvents,
      iconClassName: "bi bi-card-checklist",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      id: "seller-disputes",
      label: "Seller Disputes",
      value: summary.sellerDisputeEvents,
      iconClassName: "bi bi-shield-exclamation",
      badgeClassName: "text-bg-danger"
    },
    {
      id: "automation-events",
      label: "Automation Events",
      value: summary.automationRuleEvents,
      iconClassName: "bi bi-sliders",
      badgeClassName: "text-bg-primary"
    },
    {
      id: "high-severity",
      label: "High Severity",
      value: summary.highSeverityEvents + summary.criticalSeverityEvents,
      iconClassName: "bi bi-exclamation-triangle",
      badgeClassName: "text-bg-danger"
    },
    {
      id: "review-required",
      label: "Review Required",
      value: summary.reviewRequiredEvents,
      iconClassName: "bi bi-eye",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      id: "non-compliant",
      label: "Non-Compliant",
      value: summary.nonCompliantEvents,
      iconClassName: "bi bi-x-octagon",
      badgeClassName: "text-bg-danger"
    },
    {
      id: "exportable-records",
      label: "Exportable",
      value: summary.exportableRecords,
      iconClassName: "bi bi-download",
      badgeClassName: "text-bg-success"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-6 col-md-4 col-xl-2" key={card.id}>
          <div className="bg-white border rounded-4 p-3 h-100 shadow-sm">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <span className="text-muted small d-block mb-1">{card.label}</span>
                <strong className="fs-6">{card.value.toLocaleString()}</strong>
              </div>

              <span className={`badge rounded-pill ${card.badgeClassName} p-2 d-inline-flex align-items-center justify-content-center`}>
                <i className={card.iconClassName} />
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReturnOperationsAuditSummaryCards;