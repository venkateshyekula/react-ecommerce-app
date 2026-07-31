import { sellerPayoutSettlementService } from "../../services/sellerPayoutSettlementService";
import type { SellerPayoutSettlementSummary } from "../../types/sellerPayoutSettlement";

type SellerPayoutSettlementSummaryCardsProps = {
  summary: SellerPayoutSettlementSummary;
};

const SellerPayoutSettlementSummaryCards = ({
  summary
}: SellerPayoutSettlementSummaryCardsProps) => {
  const cards = [
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
      label: "Refund Amount",
      value: sellerPayoutSettlementService.formatCurrency(
        summary.totalRefundAmount
      ),
      iconClassName: "bi bi-cash",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Seller Liability",
      value: sellerPayoutSettlementService.formatCurrency(
        summary.totalSellerLiabilityAmount
      ),
      iconClassName: "bi bi-exclamation-triangle",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Damage Value",
      value: sellerPayoutSettlementService.formatCurrency(
        summary.totalDamagedInventoryValue
      ),
      iconClassName: "bi bi-box-seam",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Payout Adjustment",
      value: sellerPayoutSettlementService.formatCurrency(
        summary.totalPayoutAdjustmentAmount
      ),
      iconClassName: "bi bi-wallet2",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Pending",
      value: summary.pendingSettlements,
      iconClassName: "bi bi-hourglass-split",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "On Hold",
      value: summary.onHoldSettlements,
      iconClassName: "bi bi-pause-circle",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Settled",
      value: summary.settledSettlements,
      iconClassName: "bi bi-check-circle",
      badgeClassName: "text-bg-success"
    },
    {
      label: "High Risk",
      value: summary.highRiskSellers + summary.criticalRiskSellers,
      iconClassName: "bi bi-shield-exclamation",
      badgeClassName: "text-bg-danger"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-6 col-sm-4 col-md-3 col-xl-2" key={card.label}>
          <div className="bg-white border rounded-3 p-3 h-100 shadow-sm d-flex justify-content-between align-items-start gap-2">
            <div>
              <span className="text-muted small d-block mb-1">{card.label}</span>
              <strong className="fs-6 text-dark">{card.value}</strong>
            </div>

            <span className={`badge align-self-start rounded-pill p-2 ${card.badgeClassName}`}>
              <i className={`${card.iconClassName} fs-6`} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SellerPayoutSettlementSummaryCards;