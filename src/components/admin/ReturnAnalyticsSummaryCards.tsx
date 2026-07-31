import { returnAnalyticsService } from "../../services/returnAnalyticsRiskService";
import type { ReturnAnalyticsSummary } from "../../types/returnAnalyticsRisk";

type ReturnAnalyticsSummaryCardsProps = {
  summary: ReturnAnalyticsSummary;
};

const ReturnAnalyticsSummaryCards = ({
  summary
}: ReturnAnalyticsSummaryCardsProps) => {
  const cards = [
    {
      label: "Total Returns",
      value: summary.totalReturns,
      iconClassName: "bi bi-arrow-return-left",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Active Returns",
      value: summary.activeReturns,
      iconClassName: "bi bi-hourglass-split",
      badgeClassName: "text-bg-info text-white"
    },
    {
      label: "Completed",
      value: summary.completedReturns,
      iconClassName: "bi bi-check-circle",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Rejected",
      value: summary.rejectedReturns,
      iconClassName: "bi bi-x-circle",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Refund Value",
      value: returnAnalyticsService.formatCurrency(summary.totalRefundValue),
      iconClassName: "bi bi-cash-stack",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Pending Refund",
      value: returnAnalyticsService.formatCurrency(summary.pendingRefundValue),
      iconClassName: "bi bi-wallet2",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "QC Failed",
      value: summary.qcFailedCount,
      iconClassName: "bi bi-shield-x",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "QC Passed",
      value: summary.qcPassedCount,
      iconClassName: "bi bi-shield-check",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Pickup Pending",
      value: summary.pickupPendingCount,
      iconClassName: "bi bi-truck",
      badgeClassName: "text-bg-info text-white"
    },
    {
      label: "Pickup Failed",
      value: summary.pickupFailedCount,
      iconClassName: "bi bi-exclamation-triangle",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Seller Disputes",
      value: summary.sellerDisputesCount,
      iconClassName: "bi bi-shield-exclamation",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "High Risk",
      value:
        summary.highRiskCustomers +
        summary.highRiskProducts +
        summary.highRiskSellers,
      iconClassName: "bi bi-graph-up-arrow",
      badgeClassName: "text-bg-danger"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-6 col-md-4 col-xl-2" key={card.label}>
          <div className="bg-white border rounded-4 p-3 h-100 shadow-sm d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div className="overflow-hidden">
                <span className="text-muted small d-block text-truncate mb-1" title={card.label}>
                  {card.label}
                </span>
                <strong className="fs-6 text-dark d-block text-truncate" title={String(card.value)}>
                  {card.value}
                </strong>
              </div>

              <span
                className={`badge align-self-start rounded-circle p-2 d-inline-flex align-items-center justify-content-center flex-shrink-0 ${card.badgeClassName}`}
                style={{ width: "32px", height: "32px" }}
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

export default ReturnAnalyticsSummaryCards;