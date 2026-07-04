interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  itemsPerPage: number;
  itemsPerPageOptions?: number[];
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
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
  startItem,
  endItem,
  itemsPerPage,
  itemsPerPageOptions = [8, 12, 16],
  onPageChange,
  onItemsPerPageChange
}: PaginationProps) => {
  const paginationItems = getPaginationItems(currentPage, totalPages);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="pagination-wrapper bg-white rounded-4 shadow-sm p-3 mt-4">
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3">
        <div className="pagination-summary text-muted">
          Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of{" "}
          <strong>{totalItems}</strong> products
        </div>

        <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
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

          <nav aria-label="Products pagination">
            <ul className="pagination pagination-sm mb-0 flex-wrap">
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