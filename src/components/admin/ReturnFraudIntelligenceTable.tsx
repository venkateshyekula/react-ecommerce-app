import React from "react";
import Pagination from "../common/Pagination";
import {
  ReturnFraudInvestigationStatus,
  ReturnFraudPatternRecord,
  ReturnFraudRiskLevel,
  returnFraudPatternTypeLabels,
} from "../../types/returnFraudPattern";

interface ReturnFraudIntelligenceTableProps {
  records: ReturnFraudPatternRecord[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onViewPattern: (record: ReturnFraudPatternRecord) => void;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const formatDateTime = (value?: string): string => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRiskBadgeClass = (riskLevel: ReturnFraudRiskLevel): string => {
  switch (riskLevel) {
    case "CRITICAL":
      return "badge text-bg-danger";
    case "HIGH":
      return "badge text-bg-warning";
    case "MEDIUM":
      return "badge text-bg-info text-dark";
    case "LOW":
    default:
      return "badge text-bg-success";
  }
};

const getStatusBadgeClass = (
  status: ReturnFraudInvestigationStatus
): string => {
  switch (status) {
    case "ESCALATED":
      return "badge text-bg-danger";
    case "ACTION_REQUIRED":
      return "badge text-bg-warning text-dark";
    case "UNDER_REVIEW":
      return "badge text-bg-primary";
    case "CLEARED":
      return "badge text-bg-success";
    case "AUTO_FLAGGED":
    default:
      return "badge text-bg-secondary";
  }
};

const ReturnFraudIntelligenceTable: React.FC<
  ReturnFraudIntelligenceTableProps
> = ({
  records,
  loading,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onViewPattern,
}) => {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom py-3">
        <h5 className="fw-bold mb-1">Fraud Pattern Records</h5>
        <p className="text-muted mb-0 small">
          Showing {totalItems} detected fraud pattern records
        </p>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light text-secondary small text-uppercase">
            <tr>
              <th style={{ minWidth: "180px" }}>Customer</th>
              <th>Returns</th>
              <th>Refund Exposure</th>
              <th style={{ minWidth: "180px" }}>Pattern Types</th>
              <th>Risk</th>
              <th>Status</th>
              <th style={{ maxWidth: "150px" }}>Linked Seller</th>
              <th style={{ maxWidth: "150px" }}>Product</th>
              <th>Last Return</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center text-muted py-5">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                  Loading return fraud pattern intelligence...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center text-muted py-5">
                  No return fraud patterns found.
                </td>
              </tr>
            ) : (
              records.map((item) => (
                <tr key={item.id}>
                  {/* Customer Info */}
                  <td>
                    <div className="fw-semibold text-truncate" style={{ maxWidth: "180px" }}>
                      {item.customerName}
                    </div>
                    <small className="text-muted d-block text-truncate" style={{ maxWidth: "180px" }}>
                      {item.customerEmail || item.customerId}
                    </small>
                  </td>

                  {/* Return counts */}
                  <td>
                    <div className="fw-semibold">{item.totalReturns}</div>
                    <small className="text-muted">
                      Orders: {item.totalOrders}
                    </small>
                  </td>

                  {/* Refund Exposure */}
                  <td className="fw-semibold">
                    {formatCurrency(item.totalRefundAmount)}
                  </td>

                  {/* Pattern Types */}
                  <td>
                    <div className="d-flex flex-column gap-1">
                      {item.patternTypes.slice(0, 2).map((type) => (
                        <span
                          key={type}
                          className="badge rounded-pill text-bg-light border text-start text-truncate"
                          style={{ maxWidth: "180px" }}
                        >
                          {returnFraudPatternTypeLabels[type] || type.replace(/_/g, " ")}
                        </span>
                      ))}

                      {item.patternTypes.length > 2 && (
                        <small className="text-muted">
                          +{item.patternTypes.length - 2} more
                        </small>
                      )}
                    </div>
                  </td>

                  {/* Risk Level */}
                  <td>
                    <span className={getRiskBadgeClass(item.riskLevel)}>
                      {item.riskLevel}
                    </span>
                    <div>
                      <small className="text-muted">
                        Score {item.fraudScore}
                      </small>
                    </div>
                  </td>

                  {/* Investigation Status */}
                  <td>
                    <span className={getStatusBadgeClass(item.investigationStatus)}>
                      {item.investigationStatus.replace(/_/g, " ")}
                    </span>
                  </td>

                  {/* Linked Seller */}
                  <td>
                    <div className="text-truncate" style={{ maxWidth: "140px" }} title={item.sellerName}>
                      {item.sellerName || "N/A"}
                    </div>
                  </td>

                  {/* Product */}
                  <td>
                    <div className="text-truncate" style={{ maxWidth: "140px" }} title={item.productName}>
                      {item.productName || "N/A"}
                    </div>
                  </td>

                  {/* Last Return Date */}
                  <td className="small text-nowrap">
                    {formatDateTime(item.lastReturnDate)}
                  </td>

                  {/* Action */}
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onViewPattern(item)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card-footer bg-white border-top-0 py-3">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};

export default ReturnFraudIntelligenceTable;