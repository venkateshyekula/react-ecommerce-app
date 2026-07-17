import type { ProductFilters, ProductViewMode } from "../../types/product";

interface ProductListingToolbarProps {
  title: string;
  totalCount: number;
  filteredCount: number;
  sortBy: ProductFilters["sortBy"];
  viewMode: ProductViewMode;
  onSortChange: (sortBy: ProductFilters["sortBy"]) => void;
  onViewModeChange: (viewMode: ProductViewMode) => void;
  onOpenMobileFilters: () => void;
}

const ProductListingToolbar = ({
  title,
  totalCount,
  filteredCount,
  sortBy,
  viewMode,
  onSortChange,
  onViewModeChange,
  onOpenMobileFilters
}: ProductListingToolbarProps) => {
  const getSortLabel = (sortValue: ProductFilters["sortBy"]): string => {
    switch (sortValue) {
      case "PRICE_LOW_TO_HIGH":
        return "Price: Low to High";
      case "PRICE_HIGH_TO_LOW":
        return "Price: High to Low";
      case "RATING_HIGH_TO_LOW":
        return "Customer Rating";
      case "DISCOUNT_HIGH_TO_LOW":
        return "Better Discount";
      case "STOCK_HIGH_TO_LOW":
        return "Availability";
      default:
        return "Recommended";
    }
  };

  return (
    <div className="marketplace-listing-toolbar">
      <div>
        <h1 className="marketplace-listing-title">{title}</h1>
        <p className="marketplace-listing-count mb-0">
          {filteredCount} of {totalCount} items
        </p>
      </div>

      <div className="marketplace-listing-actions">
        <button
          type="button"
          className="btn btn-outline-primary marketplace-mobile-filter-btn"
          onClick={onOpenMobileFilters}
        >
          <i className="bi bi-sliders me-2" />
          Filters
        </button>

        {/* ==========================================================================
           ENHANCEMENT: Pure Pseudo-CSS Dropdown (No React State / Handlers Required)
           ========================================================================== */}
        <div className="marketplace-sort-box css-dropdown">
          <button className="dropdown-toggle-btn" type="button">
            Sort by: <strong>{getSortLabel(sortBy)}</strong>
          </button>

          <ul className="css-dropdown-menu">
            <li>
              <button
                type="button"
                className={`css-dropdown-item ${sortBy === "RELEVANCE" ? "active" : ""}`}
                onClick={(e) => {
                  onSortChange("RELEVANCE");
                  e.currentTarget.blur(); // Native blur immediately shifts focus out to close the menu
                }}
              >
                Recommended
                {sortBy === "RELEVANCE" && <i className="bi bi-check2 fs-5" />}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`css-dropdown-item ${sortBy === "PRICE_LOW_TO_HIGH" ? "active" : ""}`}
                onClick={(e) => {
                  onSortChange("PRICE_LOW_TO_HIGH");
                  e.currentTarget.blur();
                }}
              >
                Price: Low to High
                {sortBy === "PRICE_LOW_TO_HIGH" && <i className="bi bi-check2 fs-5" />}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`css-dropdown-item ${sortBy === "PRICE_HIGH_TO_LOW" ? "active" : ""}`}
                onClick={(e) => {
                  onSortChange("PRICE_HIGH_TO_LOW");
                  e.currentTarget.blur();
                }}
              >
                Price: High to Low
                {sortBy === "PRICE_HIGH_TO_LOW" && <i className="bi bi-check2 fs-5" />}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`css-dropdown-item ${sortBy === "RATING_HIGH_TO_LOW" ? "active" : ""}`}
                onClick={(e) => {
                  onSortChange("RATING_HIGH_TO_LOW");
                  e.currentTarget.blur();
                }}
              >
                Customer Rating
                {sortBy === "RATING_HIGH_TO_LOW" && <i className="bi bi-check2 fs-5" />}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`css-dropdown-item ${sortBy === "DISCOUNT_HIGH_TO_LOW" ? "active" : ""}`}
                onClick={(e) => {
                  onSortChange("DISCOUNT_HIGH_TO_LOW");
                  e.currentTarget.blur();
                }}
              >
                Better Discount
                {sortBy === "DISCOUNT_HIGH_TO_LOW" && <i className="bi bi-check2 fs-5" />}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`css-dropdown-item ${sortBy === "STOCK_HIGH_TO_LOW" ? "active" : ""}`}
                onClick={(e) => {
                  onSortChange("STOCK_HIGH_TO_LOW");
                  e.currentTarget.blur();
                }}
              >
                Availability
                {sortBy === "STOCK_HIGH_TO_LOW" && <i className="bi bi-check2 fs-5" />}
              </button>
            </li>
          </ul>
        </div>

        <div className="marketplace-view-toggle" role="group">
          <button
            type="button"
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => onViewModeChange("grid")}
            aria-label="Grid view"
          >
            <i className="bi bi-grid-3x3-gap-fill" />
          </button>

          <button
            type="button"
            className={viewMode === "list" ? "active" : ""}
            onClick={() => onViewModeChange("list")}
            aria-label="List view"
          >
            <i className="bi bi-list-ul" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductListingToolbar;