import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import Pagination from "../components/common/Pagination";
import ProductCard from "../components/products/ProductCard";
import ProductFilter from "../components/products/ProductFilter";
import AdvancedSearchBox from "../components/products/AdvancedSearchBox";
import { usePagination } from "../hooks/usePagination";
import { productService } from "../services/productService";
import type {
  Product,
  ProductCategory,
  ProductFilters,
  ProductViewMode,
} from "../types/product";

const initialFilters: ProductFilters = {
  searchText: "",
  category: "",
  brand: "",
  priceRange: "",
  rating: "",
  discount: "",
  availability: "",
  sortBy: "RELEVANCE",
};

const priceRangeLabels: Record<
  Exclude<ProductFilters["priceRange"], "">,
  string
> = {
  BELOW_1000: "Below ₹1,000",
  BETWEEN_1000_10000: "₹1,000 - ₹10,000",
  BETWEEN_10000_50000: "₹10,000 - ₹50,000",
  ABOVE_50000: "Above ₹50,000",
};

const ratingLabels: Record<Exclude<ProductFilters["rating"], "">, string> = {
  ABOVE_4: "4★ and above",
  ABOVE_3: "3★ and above",
  ABOVE_2: "2★ and above",
};

const discountLabels: Record<
  Exclude<ProductFilters["discount"], "">,
  string
> = {
  ABOVE_10: "10% and above",
  ABOVE_20: "20% and above",
  ABOVE_30: "30% and above",
};

const DEFAULT_ITEMS_PER_PAGE = 8;

const ProductListPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [viewMode, setViewMode] = useState<ProductViewMode>("grid");
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    DEFAULT_ITEMS_PER_PAGE,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadProducts = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const productList = await productService.getProducts();
        setProducts(productList);
      } catch {
        setErrorMessage(
          "Unable to load products. Please make sure JSON Server is running.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadProducts();
  }, []);

  const categories = useMemo<ProductCategory[]>(() => {
    return Array.from(new Set(products.map((product) => product.category)));
  }, [products]);

  const brands = useMemo<string[]>(() => {
    return Array.from(new Set(products.map((product) => product.brand))).sort();
  }, [products]);

  const filteredProducts = useMemo<Product[]>(() => {
    const filtered = products.filter((product) => {
      const searchText = filters.searchText.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        product.name.toLowerCase().includes(searchText) ||
        product.category.toLowerCase().includes(searchText) ||
        product.brand.toLowerCase().includes(searchText) ||
        product.sellerName?.toLowerCase().includes(searchText);

      const matchesCategory =
        !filters.category || product.category === filters.category;

      const matchesBrand = !filters.brand || product.brand === filters.brand;

      const matchesPrice =
        !filters.priceRange ||
        (filters.priceRange === "BELOW_1000" && product.price < 1000) ||
        (filters.priceRange === "BETWEEN_1000_10000" &&
          product.price >= 1000 &&
          product.price <= 10000) ||
        (filters.priceRange === "BETWEEN_10000_50000" &&
          product.price >= 10000 &&
          product.price <= 50000) ||
        (filters.priceRange === "ABOVE_50000" && product.price > 50000);

      const matchesRating =
        !filters.rating ||
        (filters.rating === "ABOVE_4" && product.rating >= 4) ||
        (filters.rating === "ABOVE_3" && product.rating >= 3) ||
        (filters.rating === "ABOVE_2" && product.rating >= 2);

      const matchesDiscount =
        !filters.discount ||
        (filters.discount === "ABOVE_10" && product.discount >= 10) ||
        (filters.discount === "ABOVE_20" && product.discount >= 20) ||
        (filters.discount === "ABOVE_30" && product.discount >= 30);

      const matchesAvailability =
        !filters.availability ||
        (filters.availability === "IN_STOCK" && product.stock > 0) ||
        (filters.availability === "OUT_OF_STOCK" && product.stock <= 0);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesPrice &&
        matchesRating &&
        matchesDiscount &&
        matchesAvailability
      );
    });

    return [...filtered].sort((firstProduct, secondProduct) => {
      switch (filters.sortBy) {
        case "PRICE_LOW_TO_HIGH":
          return firstProduct.price - secondProduct.price;

        case "PRICE_HIGH_TO_LOW":
          return secondProduct.price - firstProduct.price;

        case "RATING_HIGH_TO_LOW":
          return secondProduct.rating - firstProduct.rating;

        case "DISCOUNT_HIGH_TO_LOW":
          return secondProduct.discount - firstProduct.discount;

        case "STOCK_HIGH_TO_LOW":
          return secondProduct.stock - firstProduct.stock;

        case "RELEVANCE":
        default:
          return 0;
      }
    });
  }, [products, filters]);

  const {
    currentPage,
    totalPages,
    startItem,
    endItem,
    paginatedItems,
    setCurrentPage,
    resetPage,
  } = usePagination<Product>({
    items: filteredProducts,
    itemsPerPage,
  });

  const appliedFilters = useMemo(() => {
    const chips: Array<{
      key: keyof ProductFilters;
      label: string;
    }> = [];

    if (filters.searchText) {
      chips.push({
        key: "searchText",
        label: `Search: ${filters.searchText}`,
      });
    }

    if (filters.category) {
      chips.push({
        key: "category",
        label: `Category: ${filters.category}`,
      });
    }

    if (filters.brand) {
      chips.push({
        key: "brand",
        label: `Brand: ${filters.brand}`,
      });
    }

    if (filters.priceRange) {
      chips.push({
        key: "priceRange",
        label: `Price: ${priceRangeLabels[filters.priceRange]}`,
      });
    }

    if (filters.rating) {
      chips.push({
        key: "rating",
        label: `Rating: ${ratingLabels[filters.rating]}`,
      });
    }

    if (filters.discount) {
      chips.push({
        key: "discount",
        label: `Discount: ${discountLabels[filters.discount]}`,
      });
    }

    if (filters.availability) {
      chips.push({
        key: "availability",
        label:
          filters.availability === "IN_STOCK"
            ? "Availability: In Stock"
            : "Availability: Out of Stock",
      });
    }

    return chips;
  }, [filters]);

  const handleFilterChange = <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ): void => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      [key]: value,
    }));

    resetPage();
  };

  const handleClearSingleFilter = (key: keyof ProductFilters): void => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      [key]: initialFilters[key],
    }));

    resetPage();
  };

  const handleClearFilters = (): void => {
    setFilters(initialFilters);
    resetPage();
  };

  const handleItemsPerPageChange = (newItemsPerPage: number): void => {
    setItemsPerPage(newItemsPerPage);
    resetPage();
  };

  return (
    <main className="product-list-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">Products</h1>
              <p className="text-muted mb-0">
                Discover products with search, filters, sorting, pagination, and
                view options.
              </p>
            </div>

            <Link to="/" className="btn btn-outline-primary">
              <i className="bi bi-house me-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-4 py-md-5">
        {isLoading ? <Loader message="Loading products..." /> : null}

        {!isLoading && errorMessage ? (
          <div className="alert alert-danger text-center">
            <p>{errorMessage}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : null}

        {!isLoading && !errorMessage ? (
          <div className="row g-4">
            <div className="col-lg-3">
              <div className="product-filter-sticky">
                <ProductFilter
                  filters={filters}
                  categories={categories}
                  brands={brands}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                />
              </div>
            </div>

            <div className="col-lg-9">
              <div className="advanced-product-toolbar bg-white rounded-4 shadow-sm p-3 p-md-4 mb-4">
                <AdvancedSearchBox
                  value={filters.searchText}
                  products={products}
                  onChange={(value) => handleFilterChange("searchText", value)}
                />

                <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mt-3">
                  <div>
                    <p className="text-muted mb-1">
                      Showing <strong>{filteredProducts.length}</strong> of{" "}
                      <strong>{products.length}</strong> products
                    </p>

                    <p className="small text-muted mb-0">
                      Page <strong>{currentPage}</strong> of{" "}
                      <strong>{totalPages}</strong>
                    </p>
                  </div>

                  <div className="d-flex flex-column flex-sm-row gap-2">
                    <select
                      className="form-select product-sort-select"
                      value={filters.sortBy}
                      onChange={(event) =>
                        handleFilterChange(
                          "sortBy",
                          event.target.value as ProductFilters["sortBy"],
                        )
                      }
                    >
                      <option value="RELEVANCE">Sort: Relevance</option>
                      <option value="PRICE_LOW_TO_HIGH">
                        Price: Low to High
                      </option>
                      <option value="PRICE_HIGH_TO_LOW">
                        Price: High to Low
                      </option>
                      <option value="RATING_HIGH_TO_LOW">
                        Rating: High to Low
                      </option>
                      <option value="DISCOUNT_HIGH_TO_LOW">
                        Discount: High to Low
                      </option>
                      <option value="STOCK_HIGH_TO_LOW">
                        Stock: High to Low
                      </option>
                    </select>

                    <div className="btn-group product-view-toggle">
                      <button
                        type="button"
                        className={`btn ${
                          viewMode === "grid"
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        onClick={() => setViewMode("grid")}
                        aria-label="Grid view"
                      >
                        <i className="bi bi-grid-3x3-gap" />
                      </button>

                      <button
                        type="button"
                        className={`btn ${
                          viewMode === "list"
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        onClick={() => setViewMode("list")}
                        aria-label="List view"
                      >
                        <i className="bi bi-list-ul" />
                      </button>
                    </div>
                  </div>
                </div>

                {appliedFilters.length > 0 ? (
                  <div className="applied-filter-chips mt-3">
                    {appliedFilters.map((chip) => (
                      <button
                        key={chip.key}
                        type="button"
                        className="applied-filter-chip"
                        onClick={() => handleClearSingleFilter(chip.key)}
                      >
                        {chip.label}
                        <i className="bi bi-x ms-1" />
                      </button>
                    ))}

                    <button
                      type="button"
                      className="applied-filter-chip clear-all"
                      onClick={handleClearFilters}
                    >
                      Clear All
                    </button>
                  </div>
                ) : null}
              </div>

              {filteredProducts.length === 0 ? (
                <EmptyState
                  title="No products found"
                  message="Try adjusting your filters to find what you're looking for."
                  action={
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleClearFilters}
                    >
                      Clear Filters
                    </button>
                  }
                />
              ) : (
                <>
                  <div
                    className={
                      viewMode === "grid"
                        ? "row g-4"
                        : "d-flex flex-column gap-3"
                    }
                  >
                    {paginatedItems.map((product) => (
                      <div
                        className={
                          viewMode === "grid" ? "col-sm-6 col-xl-4" : ""
                        }
                        key={product.id}
                      >
                        <ProductCard product={product} viewMode={viewMode} />
                      </div>
                    ))}
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredProducts.length}
                    startItem={startItem}
                    endItem={endItem}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                </>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
};

export default ProductListPage;
