interface AdminTablePaginationProps {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemLabel?: string;
}

const AdminTablePagination = ({
  totalItems,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemLabel = "items"
}: AdminTablePaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const startItem =
    totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="admin-table-pagination">
      <div className="admin-table-pagination-info">
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{" "}
        <strong>{totalItems}</strong> {itemLabel}
      </div>

      <div className="admin-table-pagination-actions">
        <select
          className="form-select admin-table-page-size"
          value={itemsPerPage}
          onChange={(event) => {
            onItemsPerPageChange(Number(event.target.value));
            onPageChange(1);
          }}
        >
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>

        <button
          type="button"
          className="admin-pagination-icon-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          aria-label="Previous page"
          title="Previous"
        >
          <i className="bi bi-chevron-left" />
        </button>

        <span className="admin-table-page-indicator">
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
        </span>

        <button
          type="button"
          className="admin-pagination-icon-btn"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          aria-label="Next page"
          title="Next"
        >
          <i className="bi bi-chevron-right" />
        </button>
      </div>
    </div>
  );
};

export default AdminTablePagination;