import { useEffect, useMemo, useState } from "react";
import Pagination from "../common/Pagination";
import { sellerPayoutSettlementService } from "../../services/sellerPayoutSettlementService";
import type {
  SellerPayoutRiskLevel,
  SellerPayoutSettlementAction,
  SellerPayoutSettlementRow,
  SellerPayoutSettlementStatus
} from "../../types/sellerPayoutSettlement";

type SellerPayoutSettlementTableProps = {
  rows: SellerPayoutSettlementRow[];
  onSettlementAction: (
    row: SellerPayoutSettlementRow,
    action: SellerPayoutSettlementAction
  ) => void;
};

const pageSizeOptions = [5, 10, 20, 50];

const getRiskBadgeClass = (riskLevel: SellerPayoutRiskLevel): string => {
  if (riskLevel === "CRITICAL") {
    return "text-bg-danger";
  }

  if (riskLevel === "HIGH") {
    return "text-bg-warning text-dark";
  }

  if (riskLevel === "MEDIUM") {
    return "text-bg-info";
  }

  return "text-bg-success";
};

const getStatusBadgeClass = (status: SellerPayoutSettlementStatus): string => {
  if (status === "ON_HOLD" || status === "REJECTED") {
    return "text-bg-danger";
  }

  if (status === "PENDING") {
    return "text-bg-warning text-dark";
  }

  if (status === "UNDER_REVIEW") {
    return "text-bg-info";
  }

  if (status === "SETTLED") {
    return "text-bg-success";
  }

  return "text-bg-primary";
};

const SellerPayoutSettlementTable = ({
  rows,
  onSettlementAction
}: SellerPayoutSettlementTableProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);

  // Reset to page 1 if total rows change or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length, pageSize]);

  // Ensure current page doesn't exceed total pages if rows filter down
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [rows, currentPage, pageSize]);

  const startItem = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, rows.length);

  return (
    <div className="card border-0 shadow-sm rounded-3">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-1">
          Seller Payout Adjustment + Liability Settlement
        </h5>
        <p className="small text-muted mb-3">
          Manage seller liability deductions, payout holds, settlement approvals,
          and final payable amounts.
        </p>

        {rows.length === 0 ? (
          <div className="alert alert-light border mb-0">
            No seller payout settlement records match the selected filters.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Seller</th>
                    <th>Returns / Disputes</th>
                    <th>Liability</th>
                    <th>Payout Calculation</th>
                    <th>Reasons</th>
                    <th>Risk</th>
                    <th>Status</th>
                    <th className="text-end">Settlement Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.sellerId}>
                      <td>
                        <div className="fw-semibold text-dark">{row.sellerName}</div>
                        <div className="small text-muted">{row.sellerId}</div>
                        {row.storeName && (
                          <div className="small text-muted">{row.storeName}</div>
                        )}
                        {row.sellerEmail && (
                          <div className="small text-muted">{row.sellerEmail}</div>
                        )}
                      </td>

                      <td>
                        <div>Returns: {row.totalReturns}</div>
                        <div className="small text-muted">
                          Completed: {row.completedReturns} · Active:{" "}
                          {row.activeReturns}
                        </div>
                        <div className="small text-muted">
                          Disputes: {row.disputesRaised} · Approved:{" "}
                          {row.disputesApproved}
                        </div>
                      </td>

                      <td>
                        <div>
                          Refund:{" "}
                          {sellerPayoutSettlementService.formatCurrency(
                            row.totalRefundAmount
                          )}
                        </div>
                        <div className="small text-muted">
                          Seller Liability:{" "}
                          {sellerPayoutSettlementService.formatCurrency(
                            row.sellerLiabilityAmount
                          )}
                        </div>
                        <div className="small text-muted">
                          Damage:{" "}
                          {sellerPayoutSettlementService.formatCurrency(
                            row.damagedInventoryValue
                          )}
                        </div>
                        <div className="small text-muted">
                          Liability rate: {row.liabilityRate}%
                        </div>
                      </td>

                      <td>
                        <div>
                          Base:{" "}
                          {sellerPayoutSettlementService.formatCurrency(
                            row.payoutBaseAmount
                          )}
                        </div>
                        <div className="small text-muted">
                          Hold:{" "}
                          {sellerPayoutSettlementService.formatCurrency(
                            row.payoutHoldAmount
                          )}
                        </div>
                        <div className="small text-muted">
                          Deduction:{" "}
                          {sellerPayoutSettlementService.formatCurrency(
                            row.payoutDeductionAmount
                          )}
                        </div>
                        <div className="fw-semibold text-dark">
                          Final:{" "}
                          {sellerPayoutSettlementService.formatCurrency(
                            row.finalPayableAmount
                          )}
                        </div>
                      </td>

                      <td style={{ minWidth: 260 }}>
                        <ul className="small mb-0 ps-3">
                          {row.settlementReasons.slice(0, 3).map((reason, index) => (
                            <li key={`${reason}-${index}`}>{reason}</li>
                          ))}
                        </ul>
                        <div className="small text-muted mt-1">
                          Last return:{" "}
                          {sellerPayoutSettlementService.formatDateTime(
                            row.lastReturnAt
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge align-self-start ${getRiskBadgeClass(row.riskLevel)}`}
                        >
                          {row.riskLevel}
                        </span>
                        <div className="small text-muted mt-1">
                          Score {row.riskScore}/100
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge align-self-start ${getStatusBadgeClass(
                            row.settlementStatus
                          )}`}
                        >
                          {row.settlementStatus.replace(/_/g, " ")}
                        </span>
                        <div className="small text-muted mt-1">
                          {row.adjustmentType.replace(/_/g, " ")}
                        </div>
                      </td>

                      <td className="text-end" style={{ minWidth: 220 }}>
                        <div className="d-flex flex-wrap justify-content-end gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning"
                            onClick={() =>
                              onSettlementAction(row, "HOLD_PAYOUT")
                            }
                          >
                            Hold
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              onSettlementAction(row, "APPROVE_SETTLEMENT")
                            }
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() =>
                              onSettlementAction(row, "MARK_SETTLED")
                            }
                          >
                            Settle
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() =>
                              onSettlementAction(row, "SEND_TO_REVIEW")
                            }
                          >
                            Review
                          </button>
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

export default SellerPayoutSettlementTable;