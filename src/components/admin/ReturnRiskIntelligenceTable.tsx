import { returnAnalyticsService } from "../../services/returnAnalyticsRiskService";
import type {
  CustomerReturnRiskRow,
  ProductReturnRiskRow,
  ReturnAnalyticsRiskLevel,
  SellerReturnRiskRow
} from "../../types/returnAnalyticsRisk";

type ReturnAnalyticsRiskTablesProps = {
  customerRows: CustomerReturnRiskRow[];
  productRows: ProductReturnRiskRow[];
  sellerRows: SellerReturnRiskRow[];
};

const getRiskBadgeClass = (riskLevel: ReturnAnalyticsRiskLevel): string => {
  switch (riskLevel) {
    case "CRITICAL":
      return "text-bg-danger";
    case "HIGH":
      return "text-bg-warning text-dark";
    case "MEDIUM":
      return "text-bg-info text-white";
    case "LOW":
      return "text-bg-success";
    default:
      return "text-bg-secondary";
  }
};

const RiskBadge = ({ riskLevel }: { riskLevel: ReturnAnalyticsRiskLevel }) => (
  <span className={`badge ${getRiskBadgeClass(riskLevel)}`}>{riskLevel}</span>
);

const ReturnAnalyticsRiskTables = ({
  customerRows,
  productRows,
  sellerRows
}: ReturnAnalyticsRiskTablesProps) => {
  const topCustomerRows = customerRows.slice(0, 10);
  const topProductRows = productRows.slice(0, 10);
  const topSellerRows = sellerRows.slice(0, 10);

  return (
    <div className="row g-4">
      {/* Customer Return Risk */}
      <div className="col-12">
        <div className="card border-0 rounded-4 shadow-sm">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Customer Return Risk</h5>
            <p className="text-muted small mb-3">
              Customers ranked by return frequency, refund value, failed QC, and repeated reasons.
            </p>

            {topCustomerRows.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th>Customer</th>
                      <th>Returns</th>
                      <th>Refund Value</th>
                      <th>Failed QC</th>
                      <th>Repeated Reasons</th>
                      <th>Score</th>
                      <th>Risk</th>
                    </tr>
                  </thead>

                  <tbody>
                    {topCustomerRows.map((row) => (
                      <tr key={row.userId}>
                        <td>
                          <div className="fw-semibold">{row.customerName}</div>
                          <div className="small text-muted">
                            {row.customerEmail ?? row.userId}
                          </div>
                        </td>
                        <td>
                          <div>Total: {row.totalReturns}</div>
                          <div className="small text-muted">
                            Active: {row.activeReturns} · Completed: {row.completedReturns}
                          </div>
                        </td>
                        <td className="fw-semibold">
                          {returnAnalyticsService.formatCurrency(row.totalRefundValue)}
                        </td>
                        <td>{row.failedQcCount}</td>
                        <td className="small">
                          {row.repeatedReasons.length > 0
                            ? row.repeatedReasons.join(", ")
                            : "None"}
                        </td>
                        <td>
                          <span className="fw-semibold">{row.riskScore}</span>
                          <span className="text-muted small">/100</span>
                        </td>
                        <td>
                          <RiskBadge riskLevel={row.riskLevel} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-light border mb-0 text-center text-muted">
                No customer risk data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Return Quality Risk */}
      <div className="col-12">
        <div className="card border-0 rounded-4 shadow-sm">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Product Return Quality Risk</h5>
            <p className="text-muted small mb-3">
              Products ranked by return volume, refund impact, QC failures, and damaged inventory.
            </p>

            {topProductRows.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th>Product</th>
                      <th>Seller</th>
                      <th>Returns</th>
                      <th>Refund Value</th>
                      <th>QC Breakdown</th>
                      <th>Top Reason</th>
                      <th>Score</th>
                      <th>Risk</th>
                    </tr>
                  </thead>

                  <tbody>
                    {topProductRows.map((row) => (
                      <tr key={row.productId}>
                        <td>
                          <div className="fw-semibold">{row.productName}</div>
                          <div className="small text-muted">
                            {row.brand ?? "Brand N/A"} · {row.category ?? "Category N/A"}
                          </div>
                        </td>
                        <td>{row.sellerName ?? row.sellerId ?? "N/A"}</td>
                        <td>{row.totalReturns}</td>
                        <td className="fw-semibold">
                          {returnAnalyticsService.formatCurrency(row.totalRefundValue)}
                        </td>
                        <td className="small">
                          <span className="text-danger">Failed: {row.qcFailedCount}</span> ·{" "}
                          <span className="text-success">Passed: {row.qcPassedCount}</span>
                        </td>
                        <td className="small">{row.mostCommonReason ?? "N/A"}</td>
                        <td>
                          <span className="fw-semibold">{row.riskScore}</span>
                          <span className="text-muted small">/100</span>
                        </td>
                        <td>
                          <RiskBadge riskLevel={row.riskLevel} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-light border mb-0 text-center text-muted">
                No product risk data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seller Risk + Compliance Score */}
      <div className="col-12">
        <div className="card border-0 rounded-4 shadow-sm">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Seller Risk + Compliance Score</h5>
            <p className="text-muted small mb-3">
              Sellers ranked by return volume, QC failures, approved disputes, and damaged inventory value.
            </p>

            {topSellerRows.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th>Seller</th>
                      <th>Returns</th>
                      <th>Refund Value</th>
                      <th>QC Breakdown</th>
                      <th>Disputes</th>
                      <th>Damage Value</th>
                      <th>Score</th>
                      <th>Risk</th>
                    </tr>
                  </thead>

                  <tbody>
                    {topSellerRows.map((row) => (
                      <tr key={row.sellerId}>
                        <td>
                          <div className="fw-semibold">{row.sellerName}</div>
                          <div className="small text-muted">{row.sellerId}</div>
                        </td>
                        <td>{row.totalReturns}</td>
                        <td className="fw-semibold">
                          {returnAnalyticsService.formatCurrency(row.totalRefundValue)}
                        </td>
                        <td className="small">
                          <span className="text-danger">Failed: {row.qcFailedCount}</span> ·{" "}
                          <span className="text-success">Passed: {row.qcPassedCount}</span>
                        </td>
                        <td className="small">
                          Raised: {row.disputesRaised} · Approved: {row.disputesApproved}
                        </td>
                        <td className="fw-semibold text-danger">
                          {returnAnalyticsService.formatCurrency(row.damagedInventoryValue)}
                        </td>
                        <td>
                          <span className="fw-semibold">{row.riskScore}</span>
                          <span className="text-muted small">/100</span>
                        </td>
                        <td>
                          <RiskBadge riskLevel={row.riskLevel} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-light border mb-0 text-center text-muted">
                No seller risk data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnAnalyticsRiskTables;