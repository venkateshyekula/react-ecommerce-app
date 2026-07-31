export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startItem?: number;
  endItem?: number;
  itemsPerPage?: number;
  itemsPerPageOptions?: number[];
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  className?: string;
  pageSize?: number;
}

const getPaginationItems = (
  currentPage: number,
  totalPages: number
): Array<number | "..."> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages
  ];
};

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemsPerPage = pageSize ?? 10,
  itemsPerPageOptions = [10, 20, 50],
  startItem = (currentPage - 1) * itemsPerPage + 1,
  endItem = Math.min(currentPage * itemsPerPage, totalItems),
  onPageChange,
  onItemsPerPageChange,
  className = ""
}: PaginationProps) => {
  const paginationItems = getPaginationItems(currentPage, totalPages);

  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={`pagination-wrapper bg-white rounded-4 shadow-sm p-3 mt-4 ${className}`.trim()}
    >
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3">
        <div className="pagination-summary text-muted small">
          Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of{" "}
          <strong>{totalItems}</strong> items
        </div>

        <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
          {/* Items Per Page Selector (Only rendered if callback is provided) */}
          {onItemsPerPageChange && (
            <div className="d-flex align-items-center gap-2">
              <label
                htmlFor="itemsPerPage"
                className="small fw-semibold text-muted mb-0"
              >
                Items per page
              </label>

              <select
                id="itemsPerPage"
                className="form-select form-select-sm pagination-page-size"
                value={itemsPerPage}
                onChange={(event) =>
                  onItemsPerPageChange(Number(event.target.value))
                }
              >
                {itemsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          <nav aria-label="Table pagination">
            <ul className="pagination pagination-sm mb-0 flex-wrap">
              {/* Previous Button */}
              <li
                className={`page-item ${
                  currentPage === 1 ? "disabled" : ""
                }`}
              >
                <button
                  type="button"
                  className="page-link"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
              </li>

              {/* Page Number Buttons */}
              {paginationItems.map((item, index) => {
                if (item === "...") {
                  return (
                    <li
                      key={`ellipsis-${index}`}
                      className="page-item disabled"
                    >
                      <span className="page-link">...</span>
                    </li>
                  );
                }

                return (
                  <li
                    key={item}
                    className={`page-item ${
                      currentPage === item ? "active" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => onPageChange(item)}
                    >
                      {item}
                    </button>
                  </li>
                );
              })}

              {/* Next Button */}
              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  type="button"
                  className="page-link"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;