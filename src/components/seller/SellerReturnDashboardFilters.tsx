import type { FC } from "react";

export type SellerReturnQcFilter =
  | "ALL"
  | "NOT_STARTED"
  | "PENDING"
  | "IN_PROGRESS"
  | "PASSED"
  | "FAILED";

export type SellerReturnRefundFilter =
  | "ALL"
  | "PENDING"
  | "PROCESSING"
  | "INITIATED"
  | "COMPLETED"
  | "FAILED";

export type SellerReturnPickupFilter =
  | "ALL"
  | "NOT_SCHEDULED"
  | "SCHEDULED"
  | "OUT_FOR_PICKUP"
  | "PICKED_UP"
  | "FAILED";

export type SellerReturnDisputeFilter =
  | "ALL"
  | "ELIGIBLE"
  | "RAISED"
  | "NOT_ELIGIBLE";

type SellerReturnDashboardFiltersProps = {
  searchText: string;
  qcFilter: SellerReturnQcFilter;
  refundFilter: SellerReturnRefundFilter;
  pickupFilter: SellerReturnPickupFilter;
  disputeFilter: SellerReturnDisputeFilter;
  hasActiveFilters: boolean;
  onSearchTextChange: (value: string) => void;
  onQcFilterChange: (value: SellerReturnQcFilter) => void;
  onRefundFilterChange: (value: SellerReturnRefundFilter) => void;
  onPickupFilterChange: (value: SellerReturnPickupFilter) => void;
  onDisputeFilterChange: (value: SellerReturnDisputeFilter) => void;
  onClearFilters: () => void;
};

const SellerReturnDashboardFilters: FC<SellerReturnDashboardFiltersProps> = ({
  searchText,
  qcFilter,
  refundFilter,
  pickupFilter,
  disputeFilter,
  hasActiveFilters,
  onSearchTextChange,
  onQcFilterChange,
  onRefundFilterChange,
  onPickupFilterChange,
  onDisputeFilterChange,
  onClearFilters
}) => {
  return (
    <div className="seller-return-filter-card bg-white border rounded-4 p-3 mb-4 shadow-sm">
      <div className="row g-3 align-items-end">
        {/* Search Control */}
        <div className="col-lg-4">
          <label className="form-label fw-semibold" htmlFor="seller-return-search">
            Search
          </label>
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search text-muted" />
            </span>
            <input
              id="seller-return-search"
              className="form-control"
              value={searchText}
              placeholder="Search return, order, product ID..."
              onChange={(event) => onSearchTextChange(event.target.value)}
            />
            {searchText ? (
              <button
                type="button"
                className="btn btn-outline-secondary border-start-0"
                onClick={() => onSearchTextChange("")}
                title="Clear search"
              >
                <i className="bi bi-x" />
              </button>
            ) : null}
          </div>
        </div>

        {/* QC Status Filter */}
        <div className="col-md-6 col-lg-2">
          <label className="form-label fw-semibold" htmlFor="seller-return-qc-filter">
            QC Status
          </label>
          <select
            id="seller-return-qc-filter"
            className="form-select"
            value={qcFilter}
            onChange={(event) =>
              onQcFilterChange(event.target.value as SellerReturnQcFilter)
            }
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {/* Refund Status Filter */}
        <div className="col-md-6 col-lg-2">
          <label className="form-label fw-semibold" htmlFor="seller-return-refund-filter">
            Refund Status
          </label>
          <select
            id="seller-return-refund-filter"
            className="form-select"
            value={refundFilter}
            onChange={(event) =>
              onRefundFilterChange(
                event.target.value as SellerReturnRefundFilter
              )
            }
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="INITIATED">Initiated</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {/* Pickup Status Filter */}
        <div className="col-md-6 col-lg-2">
          <label className="form-label fw-semibold" htmlFor="seller-return-pickup-filter">
            Pickup Status
          </label>
          <select
            id="seller-return-pickup-filter"
            className="form-select"
            value={pickupFilter}
            onChange={(event) =>
              onPickupFilterChange(
                event.target.value as SellerReturnPickupFilter
              )
            }
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_SCHEDULED">Not Scheduled</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="OUT_FOR_PICKUP">Out for Pickup</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {/* Dispute Filter */}
        <div className="col-md-6 col-lg-2">
          <label className="form-label fw-semibold" htmlFor="seller-return-dispute-filter">
            Dispute Status
          </label>
          <select
            id="seller-return-dispute-filter"
            className="form-select"
            value={disputeFilter}
            onChange={(event) =>
              onDisputeFilterChange(
                event.target.value as SellerReturnDisputeFilter
              )
            }
          >
            <option value="ALL">All Statuses</option>
            <option value="ELIGIBLE">Eligible</option>
            <option value="RAISED">Raised</option>
            <option value="NOT_ELIGIBLE">Not Eligible</option>
          </select>
        </div>

        {/* Actions */}
        <div className="col-12 d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={!hasActiveFilters}
            onClick={onClearFilters}
          >
            <i className="bi bi-x-circle me-1" />
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerReturnDashboardFilters;