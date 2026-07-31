import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Loader from "../components/common/Loader";
import Pagination from "../components/common/Pagination";
import PersonalizedRecommendationsSection from "../components/products/PersonalizedRecommendationsSection";
import ProductCard from "../components/products/ProductCard";
import ProductFilter from "../components/products/ProductFilter";
import ProductListingToolbar from "../components/products/ProductListingToolbar";

import { usePagination } from "../hooks/usePagination";

import { productService } from "../services/productService";

import type {
  Product,
  ProductCategory,
  ProductFilters,
  ProductViewMode,
} from "../types/product";

import { getDiscountedPrice } from "../utils/currencyFormatter";
import { getProductFiltersFromSearchParams } from "../utils/productFilterUrl";

/* ==========================================================================
   Constants
   ========================================================================== */

const DEFAULT_ITEMS_PER_PAGE = 8;
const DEFAULT_MAXIMUM_PRICE = 100000;

/* ==========================================================================
   Product Helpers
   ========================================================================== */

const getProductSearchableText = (product: Product): string => {
  const subcategory = product.subcategory ?? "";

  const color = product.specifications?.Color ?? "";

  const idealFor = product.specifications?.["Ideal For"] ?? "";

  return [
    product.name,
    product.brand,
    product.category,
    subcategory,
    product.sellerName,
    product.description,
    color,
    idealFor,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const getProductGender = (product: Product): string => {
  const searchableText = getProductSearchableText(product);

  if (/\bboys?\b/i.test(searchableText)) {
    return "Boys";
  }

  if (/\bgirls?\b/i.test(searchableText)) {
    return "Girls";
  }

  if (/\bwomen\b|\bwoman\b/i.test(searchableText)) {
    return "Women";
  }

  if (/\bmen\b|\bman\b/i.test(searchableText)) {
    return "Men";
  }

  return "";
};

const getProductColor = (product: Product): string => {
  return String(product.specifications?.Color ?? "").trim();
};

const getProductSellingPrice = (product: Product): number => {
  return getDiscountedPrice(product.price, product.discount);
};

/* ==========================================================================
   Filter Helpers
   ========================================================================== */

const createInitialFilters = (searchText = ""): ProductFilters => {
  return {
    searchText,
    gender: "",
    category: "",
    brand: "",
    color: "",
    priceRange: "",
    priceMin: 0,
    priceMax: DEFAULT_MAXIMUM_PRICE,
    rating: "",
    discount: "",
    availability: "",
    sortBy: "RELEVANCE",
  };
};

/* ==========================================================================
   Product List Page
   ========================================================================== */

const ProductListPage = () => {
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);

  const [filters, setFilters] = useState<ProductFilters>(() => {
    const globalSearch = searchParams.get("search") ?? "";

    return getProductFiltersFromSearchParams(
      searchParams,
      createInitialFilters(globalSearch),
    );
  });

  const [viewMode, setViewMode] = useState<ProductViewMode>("grid");

  const [itemsPerPage, setItemsPerPage] = useState<number>(
    DEFAULT_ITEMS_PER_PAGE,
  );

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [errorMessage, setErrorMessage] = useState<string>("");

  /* ==========================================================================
     Synchronize URL Filters
     ========================================================================== */

  useEffect(() => {
    const globalSearch = searchParams.get("search") ?? "";

    setFilters(
      getProductFiltersFromSearchParams(
        searchParams,
        createInitialFilters(globalSearch),
      ),
    );
  }, [searchParams]);

  /* ==========================================================================
     Load Products
     ========================================================================== */

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const productList = await productService.getProducts();

        if (!isMounted) {
          return;
        }

        setProducts(productList);
      } catch {
        if (!isMounted) {
          return;
        }

        setProducts([]);

        setErrorMessage(
          "Unable to load products. Please make sure JSON Server is running.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ==========================================================================
     Mobile Filter Drawer
     ========================================================================== */

  useEffect(() => {
    if (!isMobileFilterOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsMobileFilterOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;

      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileFilterOpen]);

  /* ==========================================================================
     Filter Options
     ========================================================================== */

  const categories = useMemo<ProductCategory[]>(() => {
    return Array.from(
      new Set(products.map((product) => product.category)),
    ).sort((first, second) => first.localeCompare(second));
  }, [products]);

  const brands = useMemo<string[]>(() => {
    return Array.from(
      new Set(products.map((product) => product.brand.trim()).filter(Boolean)),
    ).sort((first, second) => first.localeCompare(second));
  }, [products]);

  /* ==========================================================================
     Filtered and Sorted Products
     ========================================================================== */

  const filteredProducts = useMemo<Product[]>(() => {
    const normalizedSearchText = filters.searchText.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const sellingPrice = getProductSellingPrice(product);

      const matchesSearch =
        !normalizedSearchText ||
        getProductSearchableText(product).includes(normalizedSearchText);

      const matchesGender =
        !filters.gender || getProductGender(product) === filters.gender;

      const matchesCategory =
        !filters.category || product.category === filters.category;

      const matchesBrand = !filters.brand || product.brand === filters.brand;

      const matchesColor =
        !filters.color ||
        getProductColor(product).toLowerCase() === filters.color.toLowerCase();

      const matchesPrice =
        sellingPrice >= filters.priceMin && sellingPrice <= filters.priceMax;

      const matchesRating =
        !filters.rating ||
        (filters.rating === "ABOVE_5" && product.rating >= 5) ||
        (filters.rating === "ABOVE_4" && product.rating >= 4) ||
        (filters.rating === "ABOVE_3" && product.rating >= 3) ||
        (filters.rating === "ABOVE_2" && product.rating >= 2);

      const matchesDiscount =
        !filters.discount ||
        Number(filters.discount.replace("ABOVE_", "")) <= product.discount;

      const matchesAvailability =
        !filters.availability ||
        (filters.availability === "IN_STOCK" && product.stock > 0) ||
        (filters.availability === "OUT_OF_STOCK" && product.stock <= 0);

      return (
        matchesSearch &&
        matchesGender &&
        matchesCategory &&
        matchesBrand &&
        matchesColor &&
        matchesPrice &&
        matchesRating &&
        matchesDiscount &&
        matchesAvailability
      );
    });

    return [...filtered].sort((firstProduct, secondProduct) => {
      const firstSellingPrice = getProductSellingPrice(firstProduct);

      const secondSellingPrice = getProductSellingPrice(secondProduct);

      switch (filters.sortBy) {
        case "PRICE_LOW_TO_HIGH":
          return firstSellingPrice - secondSellingPrice;

        case "PRICE_HIGH_TO_LOW":
          return secondSellingPrice - firstSellingPrice;

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
  }, [filters, products]);

  /* ==========================================================================
     Pagination
     ========================================================================== */

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

  /* ==========================================================================
     Handlers
     ========================================================================== */

  const handleFilterChange = <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ): void => {
    setFilters((previousFilters) => {
      const nextFilters: ProductFilters = {
        ...previousFilters,
        [key]: value, // Fixed: computed property name
      };

      if (key === "priceMin" && typeof value === "number") {
        nextFilters.priceMin = Math.max(
          0,
          Math.min(value, previousFilters.priceMax),
        );

        nextFilters.priceRange = "";
      }

      if (key === "priceMax" && typeof value === "number") {
        nextFilters.priceMax = Math.max(value, previousFilters.priceMin);

        nextFilters.priceRange = "";
      }

      return nextFilters;
    });

    resetPage();
  };

  const handleClearFilters = (): void => {
    const globalSearch = searchParams.get("search") ?? "";

    setFilters(createInitialFilters(globalSearch));

    resetPage();
  };

  const handleItemsPerPageChange = (newItemsPerPage: number): void => {
    setItemsPerPage(newItemsPerPage);
    resetPage();
  };

  const handleMobileBackdropClick = (
    event: MouseEvent<HTMLDivElement>,
  ): void => {
    if (event.target === event.currentTarget) {
      setIsMobileFilterOpen(false);
    }
  };

  /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <main className="product-list-page bg-light">
      {/* Breadcrumb Header */}
      <section className="product-details-page-header bg-white border-bottom">
        <div className="container-fluid py-3 py-md-4">
          <nav aria-label="Breadcrumb">
            <ol className="breadcrumb product-details-breadcrumb mb-2">
              <li className="breadcrumb-item">
                <Link to="/">Home</Link>
              </li>

              <li className="breadcrumb-item active" aria-current="page">
                Products
              </li>
            </ol>
          </nav>

          <p className="product-list-page-description mb-0">
            Browse, filter, sort, compare and discover products.
          </p>
        </div>
      </section>

      {/* Product Workspace */}
      <section className="container-fluid py-4">
        {isLoading ? <Loader message="Loading products..." /> : null}

        {!isLoading && errorMessage ? (
          <div className="alert alert-danger text-center" role="alert">
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
            {/* Desktop Filters */}
            <div className="col-lg-3 marketplace-filter-desktop">
              <div className="product-filter-sticky">
                <ProductFilter
                  filters={filters}
                  categories={categories}
                  brands={brands}
                  products={products}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                />
              </div>
            </div>

            {/* Product Results */}
            <div className="col-lg-9">
              <ProductListingToolbar
                title="All Products"
                totalCount={products.length}
                filteredCount={filteredProducts.length}
                sortBy={filters.sortBy}
                viewMode={viewMode}
                onSortChange={(sortBy) => handleFilterChange("sortBy", sortBy)}
                onViewModeChange={setViewMode}
                onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
              />

              {filteredProducts.length === 0 ? (
                <div className="text-center py-5 bg-white rounded border">
                  <p className="text-muted mb-3">
                    No products match your active selection criteria.
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className={
                      viewMode === "grid"
                        ? "row g-4"
                        : "d-flex flex-column gap-3"
                    }
                  >
                    {paginatedItems.map((productItem) => (
                      <div
                        className={
                          viewMode === "grid" ? "col-sm-6 col-xl-4" : ""
                        }
                        key={productItem.id}
                      >
                        <ProductCard
                          product={productItem}
                          viewMode={viewMode}
                        />
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

      {/* Personalized Recommendations */}
      <section className="container-fluid pb-5">
        <PersonalizedRecommendationsSection
          title="More Picks for You"
          subtitle="Based on your browsing and shopping activity."
          limit={4}
        />
      </section>

      {/* Mobile Filters */}
      {isMobileFilterOpen ? (
        <div
          className="marketplace-mobile-filter-overlay"
          role="presentation"
          onMouseDown={handleMobileBackdropClick}
        >
          <aside
            className="marketplace-mobile-filter-drawer bg-white"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-product-filter-title"
          >
            <div className="marketplace-mobile-filter-header">
              <h2 id="mobile-product-filter-title" className="h5 fw-bold mb-0">
                Filters
              </h2>

              <button
                type="button"
                className="btn btn-light rounded-circle"
                onClick={() => setIsMobileFilterOpen(false)}
                aria-label="Close filters"
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>

            <ProductFilter
              filters={filters}
              categories={categories}
              brands={brands}
              products={products}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </aside>
        </div>
      ) : null}
    </main>
  );
};

export default ProductListPage;