import { useMemo } from "react";
import { sellerRiskComplianceService } from "../../services/sellerRiskComplianceService";
import type { SellerRiskComplianceSummary } from "../../types/sellerRiskCompliance";

type SellerRiskComplianceSummaryCardsProps = {
  summary: SellerRiskComplianceSummary;
};

type SummaryCard = {
  label: string;
  value: string | number;
  iconClassName: string;
  badgeClassName: string;
};

const SellerRiskComplianceSummaryCards = ({
  summary
}: SellerRiskComplianceSummaryCardsProps) => {
  const cards: SummaryCard[] = useMemo(
    () => [
      {
        label: "Sellers",
        value: summary.totalSellers,
        iconClassName: "bi bi-shop-window",
        badgeClassName: "text-bg-primary"
      },
      {
        label: "Returns",
        value: summary.totalReturns,
        iconClassName: "bi bi-arrow-return-left",
        badgeClassName: "text-bg-info"
      },
      {
        label: "Refund Liability",
        value: sellerRiskComplianceService.formatCurrency(
          summary.totalRefundLiability
        ),
        iconClassName: "bi bi-cash-stack",
        badgeClassName: "text-bg-danger"
      },
      {
        label: "Damage Value",
        value: sellerRiskComplianceService.formatCurrency(
          summary.totalDamagedInventoryValue
        ),
        iconClassName: "bi bi-box-seam",
        badgeClassName: "text-bg-warning text-dark"
      },
      {
        label: "Disputes",
        value: summary.totalDisputes,
        iconClassName: "bi bi-shield-exclamation",
        badgeClassName: "text-bg-warning text-dark"
      },
      {
        label: "Approved Disputes",
        value: summary.approvedDisputes,
        iconClassName: "bi bi-check-circle",
        badgeClassName: "text-bg-danger"
      },
      {
        label: "QC Failed",
        value: summary.qcFailedCount,
        iconClassName: "bi bi-clipboard-x",
        badgeClassName: "text-bg-danger"
      },
      {
        label: "QC Passed",
        value: summary.qcPassedCount,
        iconClassName: "bi bi-clipboard-check",
        badgeClassName: "text-bg-success"
      },
      {
        label: "High Risk",
        value: summary.highRiskSellers + summary.criticalRiskSellers,
        iconClassName: "bi bi-graph-up-arrow",
        badgeClassName: "text-bg-danger"
      },
      {
        label: "Watchlist",
        value: summary.watchlistSellers,
        iconClassName: "bi bi-eye",
        badgeClassName: "text-bg-warning text-dark"
      },
      {
        label: "Restricted",
        value: summary.restrictedSellers,
        iconClassName: "bi bi-slash-circle",
        badgeClassName: "text-bg-danger"
      }
    ],
    [summary]
  );

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-6 col-md-4 col-xl-2" key={card.label}>
          <div className="bg-white border rounded-3 p-3 h-100 shadow-sm d-flex flex-column justify-content-between">
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
                className={`badge align-self-start rounded-pill d-inline-flex align-items-center justify-content-center p-2 ${card.badgeClassName}`}
                aria-hidden="true"
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

export default SellerRiskComplianceSummaryCards;