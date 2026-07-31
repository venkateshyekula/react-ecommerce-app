import { useMemo, useState, useEffect } from "react";
import type { SellerLiabilitySummary } from "../../types/returnLossDashboard";
import { returnLossDashboardService } from "../../services/returnLossDashboardService";
import Pagination from "../common/Pagination";

type AdminSellerLiabilityTableProps = {
  sellers: SellerLiabilitySummary[];
  pageSize?: number;
};

const getRiskBadgeClassName = (riskLevel: string): string => {
  switch (riskLevel) {
    case "CRITICAL":
      return "text-bg-danger";
    case "HIGH":
      return "text-bg-warning text-dark";
    case "MEDIUM":
      return "text-bg-info text-dark";
    case "LOW":
    default:
      return "text-bg-success";
  }
};

const AdminSellerLiabilityTable = ({
  sellers,
  pageSize = 10
}: AdminSellerLiabilityTableProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Calculate total pages safely
  const totalPages = Math.ceil((sellers?.length ?? 0) / pageSize);

  // Reset to first page when filtered sellers list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sellers]);

  // Compute paginated slice for display
  const paginatedSellers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return (sellers ?? []).slice(startIndex, startIndex + pageSize);
  }, [sellers, currentPage, pageSize]);

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
          <div>
            <h5 className="fw-bold mb-1">Seller Liability Summary</h5>
            <p className="text-muted small mb-0">
              Seller-wise return impact, disputes, recovery, damaged loss, and
              risk score.
            </p>
          </div>
        </div>

        {!sellers || sellers.length === 0 ? (
          <div className="alert alert-light border mb-0 rounded-3">
            No seller return liability data available.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light small text-uppercase text-muted">
                  <tr>
                    <th>Seller</th>
                    <th>Returns</th>
                    <th>Returned Value</th>
                    <th>Disputes</th>
                    <th>Restocked</th>
                    <th>Open Box</th>
                    <th>Damaged Loss</th>
                    <th>Risk</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedSellers.map((seller) => (
                    <tr key={seller.sellerId}>
                      <td>
                        <div className="fw-semibold text-dark">
                          {seller.sellerName ?? "Unknown Seller"}
                        </div>
                        <div className="small text-muted">
                          {seller.sellerId}
                        </div>
                      </td>

                      <td className="text-nowrap">
                        <div className="fw-medium">
                          {seller.totalReturns ?? 0}
                        </div>
                        <div className="small text-muted">
                          Items: {seller.totalReturnedItems ?? 0}
                        </div>
                      </td>

                      <td className="text-nowrap fw-medium">
                        {returnLossDashboardService.formatCurrency(
                          seller.totalReturnedValue ?? 0
                        )}
                      </td>

                      <td className="text-nowrap">
                        <div>Total: {seller.totalDisputes ?? 0}</div>
                        <div className="small text-muted">
                          Pending: {seller.pendingDisputes ?? 0} · Approved:{" "}
                          {seller.approvedDisputes ?? 0} · Rejected:{" "}
                          {seller.rejectedDisputes ?? 0}
                        </div>
                      </td>

                      <td className="text-nowrap text-success fw-medium">
                        {returnLossDashboardService.formatCurrency(
                          seller.restockedValue ?? 0
                        )}
                      </td>

                      <td className="text-nowrap fw-medium">
                        {returnLossDashboardService.formatCurrency(
                          seller.openBoxValue ?? 0
                        )}
                      </td>

                      <td className="text-nowrap text-danger fw-medium">
                        {returnLossDashboardService.formatCurrency(
                          seller.damagedLoss ?? 0
                        )}
                      </td>

                      <td className="text-nowrap">
                        <span
                          className={`badge rounded-pill ${getRiskBadgeClassName(
                            seller.riskLevel
                          )}`}
                        >
                          {seller.riskLevel ?? "LOW"}
                        </span>
                        <div className="small text-muted mt-1">
                          Score: {seller.riskScore ?? 0}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              className="mt-4 pt-3 border-top"
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sellers.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSellerLiabilityTable;