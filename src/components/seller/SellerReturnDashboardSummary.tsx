import type { FC } from "react";

type SellerReturnDashboardSummaryProps = {
  totalReturns: number;
  totalItems: number;
  totalReturnValue: string;
  disputeEligibleCount: number;
  disputesRaisedCount: number;
  qcPendingCount: number;
  qcFailedCount: number;
  restockReadyCount: number;
};

type SummaryTileItem = {
  label: string;
  value: string;
  iconClassName: string;
  badgeClassName: string;
};

const SellerReturnDashboardSummary: FC<SellerReturnDashboardSummaryProps> = ({
  totalReturns,
  totalItems,
  totalReturnValue,
  disputeEligibleCount,
  disputesRaisedCount,
  qcPendingCount,
  qcFailedCount,
  restockReadyCount
}) => {
  const summaryItems: SummaryTileItem[] = [
    {
      label: "Total Returns",
      value: String(totalReturns),
      iconClassName: "bi bi-arrow-return-left",
      badgeClassName: "text-bg-primary"
    },
    {
      label: "Returned Items",
      value: String(totalItems),
      iconClassName: "bi bi-box-seam",
      badgeClassName: "text-bg-info"
    },
    {
      label: "Return Value",
      value: totalReturnValue,
      iconClassName: "bi bi-cash-stack",
      badgeClassName: "text-bg-success"
    },
    {
      label: "Dispute Eligible",
      value: String(disputeEligibleCount),
      iconClassName: "bi bi-shield-exclamation",
      badgeClassName: "text-bg-warning text-dark"
    },
    {
      label: "Disputes Raised",
      value: String(disputesRaisedCount),
      iconClassName: "bi bi-shield-check",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "QC Pending",
      value: String(qcPendingCount),
      iconClassName: "bi bi-hourglass-split",
      badgeClassName: "text-bg-secondary"
    },
    {
      label: "QC Failed",
      value: String(qcFailedCount),
      iconClassName: "bi bi-x-circle",
      badgeClassName: "text-bg-danger"
    },
    {
      label: "Restock Ready",
      value: String(restockReadyCount),
      iconClassName: "bi bi-box-arrow-in-down",
      badgeClassName: "text-bg-success"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {summaryItems.map((item) => (
        <div className="col-6 col-sm-4 col-lg-3" key={item.label}>
          <div className="seller-return-summary-tile bg-white border rounded-4 p-3 h-100 shadow-sm">
            <div className="d-flex align-items-start justify-content-between gap-2">
              <div className="overflow-hidden">
                <span className="text-muted small d-block text-truncate">
                  {item.label}
                </span>
                <strong className="fs-5 text-break">{item.value}</strong>
              </div>

              <span
                className={`badge rounded-pill p-2 d-inline-flex align-items-center justify-content-center ${item.badgeClassName}`}
                style={{ width: 36, height: 36 }}
              >
                <i className={`${item.iconClassName} fs-6`} />
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SellerReturnDashboardSummary;