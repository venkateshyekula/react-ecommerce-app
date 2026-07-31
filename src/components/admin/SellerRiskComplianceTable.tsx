import { useEffect, useMemo, useState } from "react";
import Pagination from "../common/Pagination";
import { sellerRiskComplianceService } from "../../services/sellerRiskComplianceService";
import type {
  SellerComplianceRiskLevel,
  SellerComplianceStatus,
  SellerRiskComplianceRow
} from "../../types/sellerRiskCompliance";

type SellerRiskComplianceTableProps = {
  rows: SellerRiskComplianceRow[];
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const getRiskBadgeClass = (riskLevel: SellerComplianceRiskLevel): string => {
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

const getComplianceBadgeClass = (status: SellerComplianceStatus): string => {
  switch (status) {
    case "RESTRICTED":
      return "text-bg-danger";
    case "HIGH_RISK":
      return "text-bg-warning text-dark";
    case "WATCHLIST":
      return "text-bg-info";
    case "COMPLIANT":
    default:
      return "text-bg-success";
  }
};

const getRiskProgressBarClass = (riskScore: number): string => {
  if (riskScore >= 85) return "bg-danger";
  if (riskScore >= 65) return "bg-warning";
  if (riskScore >= 40) return "bg-info";
  return "bg-success";
};

const SellerRiskComplianceTable = ({
  rows
}: SellerRiskComplianceTableProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);

  // Reset or adjust page bounds when row count or page size changes
  useEffect(() => {
    setCurrentPage((prevPage) => Math.min(prevPage, totalPages));
  }, [rows.length, pageSize, totalPages]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [rows, currentPage, pageSize]);

  const startItem = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, rows.length);

  return (
    <div className="card border-0 shadow-sm rounded-3">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-1">Seller Risk + Compliance Score</h5>
        <p className="small text-muted mb-3">
          Sellers ranked by return volume, QC failures, approved disputes,
          refund liability, damaged inventory value, and repeated return issues.
        </p>

        {rows.length === 0 ? (
          <div className="alert alert-light border mb-0">
            No seller risk records match the selected filters.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th scope="col">Seller</th>
                    <th scope="col">Returns</th>
                    <th scope="col">Refund / Liability</th>
                    <th scope="col">QC</th>
                    <th scope="col">Disputes</th>
                    <th scope="col">Damage</th>
                    <th scope="col">Risk Signals</th>
                    <th scope="col">Scores</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.sellerId}>
                      <td>
                        <div className="fw-semibold">{row.sellerName}</div>
                        <div className="small text-muted">{row.sellerId}</div>
                        {row.sellerEmail && (
                          <div className="small text-muted">
                            {row.sellerEmail}
                          </div>
                        )}
                        {row.sellerPhone && (
                          <div className="small text-muted">
                            {row.sellerPhone}
                          </div>
                        )}
                      </td>

                      <td>
                        <div>Total: {row.totalReturns}</div>
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
                        <div>
                          Refund:{" "}
                          {sellerRiskComplianceService.formatCurrency(
                            row.totalRefundAmount
                          )}
                        </div>
                        <div className="small text-muted">
                          Liability:{" "}
                          {sellerRiskComplianceService.formatCurrency(
                            row.refundLiabilityAmount
                          )}
                        </div>
                        <div className="small text-muted">
                          Avg:{" "}
                          {sellerRiskComplianceService.formatCurrency(
                            row.averageRefundAmount
                          )}
                        </div>
                      </td>

                      <td>
                        <div>Failed: {row.qcFailedCount}</div>
                        <div className="small text-muted">
                          Passed: {row.qcPassedCount} · Pending:{" "}
                          {row.qcPendingCount}
                        </div>
                        <div className="small text-muted">
                          Failure rate: {row.qcFailureRate}%
                        </div>
                      </td>

                      <td>
                        <div>Raised: {row.disputesRaised}</div>
                        <div className="small text-muted">
                          Approved: {row.disputesApproved} · Rejected:{" "}
                          {row.disputesRejected}
                        </div>
                        <div className="small text-muted">
                          Approval rate: {row.disputeApprovalRate}%
                        </div>
                      </td>

                      <td>
                        <div>Items: {row.damagedInventoryCount}</div>
                        <div className="small text-muted">
                          {sellerRiskComplianceService.formatCurrency(
                            row.damagedInventoryValue
                          )}
                        </div>
                      </td>

                      <td style={{ minWidth: 260 }}>
                        <ul className="small mb-0 ps-3">
                          {row.riskSignals.slice(0, 3).map((signal, index) => (
                            <li key={`${signal}-${index}`}>{signal}</li>
                          ))}
                        </ul>

                        {row.riskSignals.length > 3 && (
                          <div className="small text-muted mt-1">
                            +{row.riskSignals.length - 3} more signal(s)
                          </div>
                        )}

                        {row.topReturnReason && (
                          <div className="small text-muted mt-1">
                            Top reason: {row.topReturnReason}
                          </div>
                        )}

                        <div className="small text-muted mt-1">
                          Last return:{" "}
                          {sellerRiskComplianceService.formatDateTime(
                            row.lastReturnAt
                          )}
                        </div>
                      </td>

                      <td style={{ minWidth: 130 }}>
                        <div className="fw-semibold">
                          Risk: {row.riskScore}/100
                        </div>
                        <div className="progress mt-1" style={{ height: 6 }}>
                          <div
                            className={`progress-bar ${getRiskProgressBarClass(
                              row.riskScore
                            )}`}
                            role="progressbar"
                            style={{ width: `${row.riskScore}%` }}
                            aria-valuenow={row.riskScore}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Risk score ${row.riskScore} out of 100`}
                          />
                        </div>

                        <div className="small text-muted mt-2">
                          Compliance: {row.complianceScore}/100
                        </div>
                      </td>

                      <td>
                        <div>
                          <span
                            className={`badge align-self-start ${getRiskBadgeClass(
                              row.riskLevel
                            )}`}
                          >
                            {row.riskLevel}
                          </span>
                        </div>

                        <div className="mt-2">
                          <span
                            className={`badge align-self-start ${getComplianceBadgeClass(
                              row.complianceStatus
                            )}`}
                          >
                            {row.complianceStatus.replace(/_/g, " ")}
                          </span>
                        </div>
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
                itemsPerPageOptions={PAGE_SIZE_OPTIONS}
                startItem={startItem}
                endItem={endItem}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setPageSize}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SellerRiskComplianceTable;