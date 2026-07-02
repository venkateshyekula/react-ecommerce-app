import type {
  PriceRange,
  ProductCategory,
  ProductFilters,
  RatingFilter
} from "../../types/product";

interface ProductFilterProps {
  filters: ProductFilters;
  categories: ProductCategory[];
  brands: string[];
  onFilterChange: <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) => void;
  onClearFilters: () => void;
}

const ProductFilter = ({
  filters,
  categories,
  brands,
  onFilterChange,
  onClearFilters
}: ProductFilterProps) => {
  return (
    <div className="product-filter bg-white rounded-4 shadow-sm p-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="fw-bold mb-0">
          <i className="bi bi-funnel me-2 text-primary" />
          Filters
        </h5>

        <button
          type="button"
          className="btn btn-link text-decoration-none p-0 small"
          onClick={onClearFilters}
        >
          Clear
        </button>
      </div>

      <div className="mb-3">
        <label htmlFor="categoryFilter" className="form-label fw-semibold">
          Category
        </label>

        <select
          id="categoryFilter"
          className="form-select"
          value={filters.category}
          onChange={(event) =>
            onFilterChange(
              "category",
              event.target.value as ProductCategory | ""
            )
          }
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor="brandFilter" className="form-label fw-semibold">
          Brand
        </label>

        <select
          id="brandFilter"
          className="form-select"
          value={filters.brand}
          onChange={(event) => onFilterChange("brand", event.target.value)}
        >
          <option value="">All Brands</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor="priceFilter" className="form-label fw-semibold">
          Price
        </label>

        <select
          id="priceFilter"
          className="form-select"
          value={filters.priceRange}
          onChange={(event) =>
            onFilterChange("priceRange", event.target.value as PriceRange)
          }
        >
          <option value="">All Prices</option>
          <option value="BELOW_1000">Below ₹1,000</option>
          <option value="BETWEEN_1000_10000">₹1,000 - ₹10,000</option>
          <option value="BETWEEN_10000_50000">₹10,000 - ₹50,000</option>
          <option value="ABOVE_50000">Above ₹50,000</option>
        </select>
      </div>

      <div className="mb-0">
        <label htmlFor="ratingFilter" className="form-label fw-semibold">
          Rating
        </label>

        <select
          id="ratingFilter"
          className="form-select"
          value={filters.rating}
          onChange={(event) =>
            onFilterChange("rating", event.target.value as RatingFilter)
          }
        >
          <option value="">All Ratings</option>
          <option value="ABOVE_4">4 and above</option>
          <option value="ABOVE_3">3 and above</option>
          <option value="ABOVE_2">2 and above</option>
        </select>
      </div>
    </div>
  );
};

export default ProductFilter;