import { useEffect, useMemo, useState } from "react";
import Pagination from "../common/Pagination";
import { customerReturnAbuseService } from "../../services/customerReturnAbuseService";
import type {
  CustomerAbuseRiskLevel,
  CustomerReturnAbuseRow
} from "../../types/customerReturnAbuse";

type CustomerReturnAbuseTableProps = {
  rows: CustomerReturnAbuseRow[];
};

const pageSizeOptions = [5, 10, 20, 50];

const getRiskBadgeClass = (riskLevel: CustomerAbuseRiskLevel): string => {
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

const CustomerReturnAbuseTable = ({ rows }: CustomerReturnAbuseTableProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);

  // Reset page when dataset or page size changes
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
        <h5 className="fw-bold mb-1">Customer Return Abuse Detection</h5>
        <p className="small text-muted mb-3">
          Customers ranked by return frequency, refund exposure, failed pickups,
          QC failures, repeated reasons, and rejected proof records.
        </p>

        {rows.length === 0 ? (
          <div className="alert alert-light border mb-0 text-muted small">
            No customer return abuse records match the selected filters.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Returns</th>
                    <th>Refund Exposure</th>
                    <th>Operational Signals</th>
                    <th>Repeated Reasons</th>
                    <th>Risk Signals</th>
                    <th>Score</th>
                    <th>Risk</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.customerId}>
                      <td>
                        <div className="fw-semibold text-dark">
                          {row.customerName}
                        </div>
                        <div className="small text-muted">
                          {row.customerEmail ?? row.customerId}
                        </div>
                        {row.customerPhone ? (
                          <div className="small text-muted">
                            {row.customerPhone}
                          </div>
                        ) : null}
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
                          {customerReturnAbuseService.formatCurrency(
                            row.totalRefundAmount
                          )}
                        </div>
                        <div className="small text-muted">
                          Avg:{" "}
                          {customerReturnAbuseService.formatCurrency(
                            row.averageRefundAmount
                          )}
                        </div>
                        <div className="small text-muted">
                          High-value: {row.highValueReturnCount}
                        </div>
                      </td>

                      <td>
                        <div>Failed pickup: {row.failedPickupAttempts}</div>
                        <div className="small text-muted">
                          QC failed: {row.qcFailedCount}
                        </div>
                        <div className="small text-muted">
                          Rejected proofs: {row.rejectedProofCount}
                        </div>
                      </td>

                      <td style={{ minWidth: 180 }}>
                        {row.repeatedReasons.length > 0 ? (
                          <ul className="small mb-0 ps-3">
                            {row.repeatedReasons
                              .slice(0, 3)
                              .map((reason, index) => (
                                <li key={`${row.customerId}-reason-${index}`}>
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
                          {row.riskSignals
                            .slice(0, 3)
                            .map((signal, index) => (
                              <li key={`${row.customerId}-signal-${index}`}>
                                {signal}
                              </li>
                            ))}
                        </ul>

                        {row.riskSignals.length > 3 ? (
                          <div className="small text-muted mt-1">
                            +{row.riskSignals.length - 3} more signal(s)
                          </div>
                        ) : null}

                        <div className="small text-muted mt-1">
                          Last return:{" "}
                          {customerReturnAbuseService.formatDateTime(
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

export default CustomerReturnAbuseTable;