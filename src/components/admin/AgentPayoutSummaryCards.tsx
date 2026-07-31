import { agentPayoutService } from "../../services/agentPayoutService";
import type { AgentPayoutSummary } from "../../types/agentPayout";

type AgentPayoutSummaryCardsProps = {
  summary: AgentPayoutSummary;
};

const AgentPayoutSummaryCards = ({ summary }: AgentPayoutSummaryCardsProps) => {
  const cards = [
    {
      label: "Agents",
      value: summary.totalAgents,
      iconClassName: "bi bi-people",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Pickups",
      value: summary.totalCompletedPickups,
      iconClassName: "bi bi-arrow-return-left",
      badgeClassName: "text-bg-info"
    },
    {
      label: "Deliveries",
      value: summary.totalCompletedDeliveries,
      iconClassName: "bi bi-truck",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Failed Attempts",
      value: summary.totalFailedAttempts,
      iconClassName: "bi bi-exclamation-circle",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Verified Proofs",
      value: summary.totalVerifiedProofs,
      iconClassName: "bi bi-patch-check",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Rejected Proofs",
      value: summary.totalRejectedProofs,
      iconClassName: "bi bi-shield-x",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Gross Amount",
      value: agentPayoutService.formatCurrency(summary.totalGrossAmount),
      iconClassName: "bi bi-cash-stack",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Deductions",
      value: agentPayoutService.formatCurrency(summary.totalDeductions),
      iconClassName: "bi bi-dash-circle",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Net Payable",
      value: agentPayoutService.formatCurrency(summary.totalNetPayableAmount),
      iconClassName: "bi bi-wallet2",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Ready for Approval",
      value: summary.readyForApprovalCount,
      iconClassName: "bi bi-check2-circle",
      badgeClassName: "text-bg-info"
    },
    {
      label: "High Risk",
      value: summary.highRiskCount,
      iconClassName: "bi bi-exclamation-triangle",
      badgeClassName: "text-bg-danger"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-6 col-md-4 col-xl-2" key={card.label}>
          <div className="bg-white border rounded-4 p-3 h-100 shadow-sm d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
              <span className="text-muted small fw-medium">{card.label}</span>
              <span
                className={`badge rounded-pill ${card.badgeClassName} d-inline-flex align-items-center justify-content-center p-2`}
              >
                <i className={card.iconClassName} aria-hidden="true" />
              </span>
            </div>
            <div>
              <strong className="fs-6 fw-bold text-dark">{card.value}</strong>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentPayoutSummaryCards;