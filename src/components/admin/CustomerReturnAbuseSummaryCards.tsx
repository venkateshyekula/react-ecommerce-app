import { customerReturnAbuseService } from "../../services/customerReturnAbuseService";
import type { CustomerReturnAbuseSummary } from "../../types/customerReturnAbuse";

type CustomerReturnAbuseSummaryCardsProps = {
  summary: CustomerReturnAbuseSummary;
};

const CustomerReturnAbuseSummaryCards = ({
  summary
}: CustomerReturnAbuseSummaryCardsProps) => {
  const cards = [
    {
      label: "Customers",
      value: summary.totalCustomers,
      iconClassName: "bi bi-people",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Returns",
      value: summary.totalReturns,
      iconClassName: "bi bi-arrow-return-left",
      badgeClassName: "text-bg-info"
    },
    {
      label: "Refund Value",
      value: customerReturnAbuseService.formatCurrency(
        summary.totalRefundAmount
      ),
      iconClassName: "bi bi-cash-stack",
      badgeClassName: "text-bg-success"
    },
    {
      label: "High Risk",
      value: summary.highRiskCustomers + summary.criticalRiskCustomers,
      iconClassName: "bi bi-shield-exclamation",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Repeated Reasons",
      value: summary.customersWithRepeatedReasons,
      iconClassName: "bi bi-repeat",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "High Refund Value",
      value: summary.customersWithHighRefundValue,
      iconClassName: "bi bi-wallet2",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Failed Pickup Pattern",
      value: summary.customersWithFailedPickupPattern,
      iconClassName: "bi bi-truck",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Rejected Proofs",
      value: summary.customersWithRejectedProofs,
      iconClassName: "bi bi-card-checklist",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "QC Failures",
      value: summary.customersWithQcFailures,
      iconClassName: "bi bi-clipboard-x",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Critical",
      value: summary.criticalRiskCustomers,
      iconClassName: "bi bi-exclamation-octagon",
      badgeClassName: "text-bg-danger"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-6 col-md-4 col-xl-2" key={card.label}>
          <div className="bg-white border rounded-3 p-3 h-100 shadow-sm">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div className="overflow-hidden">
                <span className="text-muted small d-block text-truncate">
                  {card.label}
                </span>
                <strong className="fs-6 text-dark d-block text-truncate">
                  {card.value}
                </strong>
              </div>

              <span
                className={`badge align-slef-start rounded-pill ${card.badgeClassName} p-2 d-inline-flex align-items-center justify-content-center`}
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

export default CustomerReturnAbuseSummaryCards;