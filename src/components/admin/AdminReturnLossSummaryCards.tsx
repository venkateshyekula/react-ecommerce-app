import type { ReturnLossDashboardSummary } from "../../types/returnLossDashboard";
import { returnLossDashboardService } from "../../services/returnLossDashboardService";

type AdminReturnLossSummaryCardsProps = {
  summary: ReturnLossDashboardSummary;
};

const getSeverityClassName = (severity: string): string => {
  switch (severity) {
    case "CRITICAL":
      return "text-bg-danger";
    case "HIGH":
      return "text-bg-warning text-dark";
    case "MEDIUM":
      return "text-bg-info text-dark";
    case "LOW":
    default:
      return "text-bg-success";
  }
};

const AdminReturnLossSummaryCards = ({
  summary
}: AdminReturnLossSummaryCardsProps) => {
  const cards = [
    {
      label: "Total Returns",
      value: String(summary.totalReturns ?? 0),
      iconClassName: "bi bi-arrow-return-left",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Returned Value",
      value: returnLossDashboardService.formatCurrency(
        summary.totalReturnedValue ?? 0
      ),
      iconClassName: "bi bi-cash-stack",
      badgeClassName: "text-bg-info text-dark"
    },
    {
      label: "Refunded Amount",
      value: returnLossDashboardService.formatCurrency(
        summary.totalRefundedAmount ?? 0
      ),
      iconClassName: "bi bi-credit-card",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Recovered Value",
      value: returnLossDashboardService.formatCurrency(
        summary.recoveryValue ?? 0
      ),
      iconClassName: "bi bi-box-arrow-in-down",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Damaged Loss",
      value: returnLossDashboardService.formatCurrency(
        summary.totalDamagedLoss ?? 0
      ),
      iconClassName: "bi bi-exclamation-triangle",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Disputed Value",
      value: returnLossDashboardService.formatCurrency(
        summary.totalDisputedValue ?? 0
      ),
      iconClassName: "bi bi-shield-exclamation",
      badgeClassName: "text-bg-secondary"
    },
    {
      label: "Estimated Net Loss",
      value: returnLossDashboardService.formatCurrency(
        summary.estimatedNetLoss ?? 0
      ),
      iconClassName: "bi bi-graph-down-arrow",
      badgeClassName: getSeverityClassName(summary.lossSeverity)
    },
    {
      label: "Loss Severity",
      value: summary.lossSeverity ?? "LOW",
      iconClassName: "bi bi-speedometer2",
      badgeClassName: getSeverityClassName(summary.lossSeverity)
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-6 col-lg-3" key={card.label}>
          <div className="bg-white border rounded-4 p-3 h-100 shadow-sm d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <span className="text-muted small d-block mb-1">{card.label}</span>
                <strong className="fs-5 text-dark text-break">{card.value}</strong>
              </div>

              <span
                className={`badge rounded-circle p-2 d-inline-flex align-items-center justify-content-center ${card.badgeClassName}`}
                style={{ width: "36px", height: "36px" }}
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

export default AdminReturnLossSummaryCards;