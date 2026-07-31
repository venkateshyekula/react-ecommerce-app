import { useEffect, useMemo, useState } from "react";
import Pagination from "../common/Pagination";
import { productReturnQualityService } from "../../services/productReturnQualityService";
import type {
  ProductQualityRiskLevel,
  ProductReturnQualityRow
} from "../../types/productReturnQuality";

type ProductReturnQualityTableProps = {
  rows: ProductReturnQualityRow[];
};

const pageSizeOptions = [5, 10, 20, 50];

const getRiskBadgeClass = (riskLevel: ProductQualityRiskLevel): string => {
  switch (riskLevel) {
    case "CRITICAL":
      return "text-bg-danger";
    case "HIGH":
      return "text-bg-warning text-dark";
    case "MEDIUM":
      return "text-bg-info";
    case "LOW":
    default:
      return "text-bg-success";
  }
};

const ProductReturnQualityTable = ({ rows }: ProductReturnQualityTableProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);

  // Reset page position whenever source rows or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length, pageSize]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [rows, currentPage, pageSize]);

  const startItem = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, rows.length);

  return (
    <div className="card border-0 shadow-sm rounded-3">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-1">Product Return Quality Intelligence</h5>
        <p className="small text-muted mb-3">
          Products ranked by return volume, refund exposure, QC failures,
          damaged inventory, repeated reasons, and product quality signal score.
        </p>

        {rows.length === 0 ? (
          <div className="alert alert-light border mb-0 text-muted small">
            No product quality records match the selected filters.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Seller</th>
                    <th>Returns</th>
                    <th>Refund Exposure</th>
                    <th>QC / Damage</th>
                    <th>Reasons</th>
                    <th>Quality Signals</th>
                    <th>Score</th>
                    <th>Risk</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.productId}>
                      <td>
                        <div className="fw-semibold text-dark">{row.productName}</div>
                        <div className="small text-muted">{row.productId}</div>
                        <div className="small text-muted">
                          {row.brand ?? "Brand N/A"} ·{" "}
                          {row.category ?? "Category N/A"}
                        </div>
                      </td>

                      <td>
                        <div className="fw-medium text-dark">
                          {row.sellerName ?? "Seller N/A"}
                        </div>
                        <div className="small text-muted">
                          {row.sellerId ?? "N/A"}
                        </div>
                      </td>

                      <td>
                        <div className="fw-medium">Total: {row.totalReturns}</div>
                        <div className="small text-muted">
                          Active: {row.activeReturns} · Completed:{" "}
                          {row.completedReturns}
                        </div>
                        <div className="small text-muted">
                          Rejected: {row.rejectedReturns} · Cancelled:{" "}
                          {row.cancelledReturns}
                        </div>
                      </td>

                      <td>
                        <div className="fw-medium">
                          {productReturnQualityService.formatCurrency(
                            row.totalRefundAmount
                          )}
                        </div>
                        <div className="small text-muted">
                          Avg:{" "}
                          {productReturnQualityService.formatCurrency(
                            row.averageRefundAmount
                          )}
                        </div>
                        <div className="small text-muted">
                          High-value: {row.highValueReturnCount}
                        </div>
                      </td>

                      <td>
                        <div>QC Passed: {row.qcPassedCount}</div>
                        <div className="small text-muted">
                          QC Failed: {row.qcFailedCount}
                        </div>
                        <div className="small text-muted">
                          QC Pending: {row.qcPendingCount}
                        </div>
                        <div className="small text-muted">
                          Damaged: {row.damagedInventoryCount} ·{" "}
                          {productReturnQualityService.formatCurrency(
                            row.damagedInventoryValue
                          )}
                        </div>
                      </td>

                      <td style={{ minWidth: 180 }}>
                        {row.repeatedReasons.length > 0 ? (
                          <ul className="small mb-0 ps-3">
                            {row.repeatedReasons.slice(0, 3).map((reason, index) => (
                              <li key={`${row.productId}-reason-${index}`}>
                                {reason}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="small text-muted">None</span>
                        )}

                        {row.topReturnReason ? (
                          <div className="small text-muted mt-1">
                            Top: {row.topReturnReason}
                          </div>
                        ) : null}
                      </td>

                      <td style={{ minWidth: 260 }}>
                        <ul className="small mb-0 ps-3">
                          {row.qualitySignals.slice(0, 3).map((signal, index) => (
                            <li key={`${row.productId}-signal-${index}`}>
                              {signal}
                            </li>
                          ))}
                        </ul>

                        {row.qualitySignals.length > 3 ? (
                          <div className="small text-muted mt-1">
                            +{row.qualitySignals.length - 3} more signal(s)
                          </div>
                        ) : null}

                        <div className="small text-muted mt-1">
                          Last return:{" "}
                          {productReturnQualityService.formatDateTime(
                            row.lastReturnAt
                          )}
                        </div>
                      </td>

                      <td style={{ minWidth: 120 }}>
                        <div className="fw-semibold">{row.riskScore}/100</div>
                        <div
                          className="progress mt-1"
                          style={{ height: 6 }}
                          role="progressbar"
                          aria-label={`Risk score ${row.riskScore}`}
                          aria-valuenow={row.riskScore}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className={`progress-bar ${
                              row.riskScore >= 85
                                ? "bg-danger"
                                : row.riskScore >= 65
                                  ? "bg-warning"
                                  : row.riskScore >= 40
                                    ? "bg-info"
                                    : "bg-success"
                            }`}
                            style={{ width: `${row.riskScore}%` }}
                          />
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge align-self-start ${getRiskBadgeClass(
                            row.riskLevel
                          )} rounded-pill`}
                        >
                          {row.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={rows.length}
                pageSize={pageSize}
                itemsPerPage={pageSize}
                itemsPerPageOptions={pageSizeOptions}
                startItem={startItem}
                endItem={endItem}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(nextPageSize: number) => {
                  setPageSize(nextPageSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductReturnQualityTable;