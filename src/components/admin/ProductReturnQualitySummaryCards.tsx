import { productReturnQualityService } from "../../services/productReturnQualityService";
import type { ProductReturnQualitySummary } from "../../types/productReturnQuality";

type ProductReturnQualitySummaryCardsProps = {
  summary: ProductReturnQualitySummary;
};

const ProductReturnQualitySummaryCards = ({
  summary
}: ProductReturnQualitySummaryCardsProps) => {
  const cards = [
    {
      label: "Products",
      value: summary.totalProducts,
      iconClassName: "bi bi-box-seam",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Monitored",
      value: summary.monitoredProducts,
      iconClassName: "bi bi-eye",
      badgeClassName: "text-bg-info"
    },
    {
      label: "Returns",
      value: summary.totalReturns,
      iconClassName: "bi bi-arrow-return-left",
      badgeClassName: "text-bg-info"
    },
    {
      label: "Refund Impact",
      value: productReturnQualityService.formatCurrency(
        summary.totalRefundAmount
      ),
      iconClassName: "bi bi-cash-stack",
      badgeClassName: "text-bg-success"
    },
    {
      label: "QC Passed",
      value: summary.qcPassedCount,
      iconClassName: "bi bi-shield-check",
      badgeClassName: "text-bg-success"
    },
    {
      label: "QC Failed",
      value: summary.qcFailedCount,
      iconClassName: "bi bi-shield-x",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Damaged Stock",
      value: summary.damagedInventoryCount,
      iconClassName: "bi bi-box2-heart",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Damage Value",
      value: productReturnQualityService.formatCurrency(
        summary.damagedInventoryValue
      ),
      iconClassName: "bi bi-exclamation-diamond",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "High Risk",
      value: summary.highRiskProducts + summary.criticalRiskProducts,
      iconClassName: "bi bi-exclamation-triangle",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Repeated Reasons",
      value: summary.productsWithRepeatedReasons,
      iconClassName: "bi bi-repeat",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "High Refund Value",
      value: summary.productsWithHighRefundValue,
      iconClassName: "bi bi-wallet2",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Critical",
      value: summary.criticalRiskProducts,
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
                className={`badge slign-self-start rounded-pill ${card.badgeClassName} p-2 d-inline-flex align-items-center justify-content-center`}
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

export default ProductReturnQualitySummaryCards;