import type { AgentProofVerificationSummary } from "../../types/agentProofVerification";

type AdminAgentProofSummaryCardsProps = {
  summary: AgentProofVerificationSummary;
};

const AdminAgentProofSummaryCards = ({
  summary
}: AdminAgentProofSummaryCardsProps) => {
  const cards = [
    {
      label: "Total Proofs",
      value: summary.totalProofs,
      iconClassName: "bi bi-card-checklist",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Pickup Proofs",
      value: summary.pickupProofs,
      iconClassName: "bi bi-arrow-return-left",
      badgeClassName: "text-bg-info"
    },
    {
      label: "Delivery Proofs",
      value: summary.deliveryProofs,
      iconClassName: "bi bi-truck",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Pending",
      value: summary.pendingProofs,
      iconClassName: "bi bi-hourglass-split",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Verified",
      value: summary.verifiedProofs,
      iconClassName: "bi bi-check-circle",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Rejected",
      value: summary.rejectedProofs,
      iconClassName: "bi bi-x-circle",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Photo Proofs",
      value: summary.photoProofs,
      iconClassName: "bi bi-image",
      badgeClassName: "text-bg-secondary"
    },
    {
      label: "OTP Proofs",
      value: summary.otpProofs,
      iconClassName: "bi bi-key",
      badgeClassName: "text-bg-dark"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-6 col-md-4 col-lg-3" key={card.label}>
          <div className="bg-white border rounded-4 p-3 h-100 shadow-sm d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <span className="text-muted small d-block mb-1">{card.label}</span>
                <strong className="fs-4 fw-bold">{card.value ?? 0}</strong>
              </div>

              <span
                className={`badge rounded-pill p-2 d-inline-flex align-items-center justify-content-center ${card.badgeClassName}`}
                style={{ width: "32px", height: "32px" }}
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

export default AdminAgentProofSummaryCards;