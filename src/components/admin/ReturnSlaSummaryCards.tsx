import type { ReturnSlaMonitoringSummary } from "../../types/returnSlaMonitoring";

type ReturnSlaSummaryCardsProps = {
  summary: ReturnSlaMonitoringSummary;
};

type SummaryCard = {
  id: string;
  label: string;
  value: number;
  iconClassName: string;
  badgeClassName: string;
};

const ReturnSlaSummaryCards = ({ summary }: ReturnSlaSummaryCardsProps) => {
  const cards: SummaryCard[] = [
    {
      id: "sla-records",
      label: "SLA Records",
      value: summary.totalSlaRows,
      iconClassName: "bi bi-clock-history",
      badgeClassName: "text-bg-primary"
    },
    {
      id: "within-sla",
      label: "Within SLA",
      value: summary.withinSlaCount,
      iconClassName: "bi bi-check-circle",
      badgeClassName: "text-bg-success"
    },
    {
      id: "warnings",
      label: "Warnings",
      value: summary.warningCount,
      iconClassName: "bi bi-exclamation-circle",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      id: "breached",
      label: "Breached",
      value: summary.breachedCount,
      iconClassName: "bi bi-x-octagon",
      badgeClassName: "text-bg-danger"
    },
    {
      id: "escalated",
      label: "Escalated",
      value: summary.escalatedCount,
      iconClassName: "bi bi-arrow-up-circle",
      badgeClassName: "text-bg-danger"
    },
    {
      id: "completed",
      label: "Completed",
      value: summary.completedCount,
      iconClassName: "bi bi-check2-circle",
      badgeClassName: "text-bg-success"
    },
    {
      id: "pickup-breaches",
      label: "Pickup Breaches",
      value: summary.pickupBreaches,
      iconClassName: "bi bi-truck",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      id: "qc-breaches",
      label: "QC Breaches",
      value: summary.qcBreaches,
      iconClassName: "bi bi-clipboard-check",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      id: "refund-breaches",
      label: "Refund Breaches",
      value: summary.refundBreaches,
      iconClassName: "bi bi-cash-stack",
      badgeClassName: "text-bg-danger"
    },
    {
      id: "open-escalations",
      label: "Open Escalations",
      value: summary.openEscalations,
      iconClassName: "bi bi-headset",
      badgeClassName: "text-bg-danger"
    }
  ];

  return (
    <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-3 mb-4">
      {cards.map((card) => (
        <div className="col" key={card.id}>
          <div className="bg-white border rounded-4 p-3 h-100 shadow-sm d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <span className="text-muted small d-block text-truncate">
                  {card.label}
                </span>
                <strong className="fs-5">{card.value}</strong>
              </div>

              <span
                className={`badge rounded-pill d-inline-flex align-items-center justify-content-center ${card.badgeClassName}`}
                style={{ width: "2rem", height: "2rem" }}
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

export default ReturnSlaSummaryCards;