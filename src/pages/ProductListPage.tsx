import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Loader from "../components/common/Loader";
import Pagination from "../components/common/Pagination";
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
import { getProductFiltersFromSearchParams } from "../utils/productFilterUrl";
import PersonalizedRecommendationsSection from "../components/products/PersonalizedRecommendationsSection";

const DEFAULT_ITEMS_PER_PAGE = 8;

const getProductSearchableText = (product: Product): string => {
  const subcategory = String(
    (product as Product & { subcategory?: string }).subcategory ?? "",
  );

  const color = String(product.specifications?.Color ?? "");
  const idealFor = String(product.specifications?.["Ideal For"] ?? "");
  const sellerName = String(product.sellerName ?? "");

  return [
    product.name,
    product.brand,
    product.category,
    subcategory,
    sellerName,
    product.description,
    color,
    idealFor,
  ]
    .join(" ")
    .toLowerCase();
};

const getProductGender = (product: Product): string => {
  const searchableText = getProductSearchableText(product);

  if (searchableText.includes("boys")) return "Boys";
  if (searchableText.includes("girls")) return "Girls";
  if (searchableText.includes("women")) return "Women";
  if (searchableText.includes("men")) return "Men";
  return "";
};

const getProductColor = (product: Product): string => {
  return String(product.specifications?.Color ?? "").trim();
};

const createInitialFilters = (searchText = ""): ProductFilters => ({
  searchText,
  gender: "",
  category: "",
  brand: "",
  color: "",
  priceRange: "",
  priceMin: 0,
  priceMax: 100000,
  rating: "",
  discount: "",
  availability: "",
  sortBy: "RELEVANCE",
});

const ProductListPage = () => {
  const [searchParams] = useSearchParams();
  const globalSearch = searchParams.get("search") ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<ProductFilters>(() =>
    getProductFiltersFromSearchParams(
      searchParams,
      createInitialFilters(globalSearch),
    ),
  );
  const [viewMode, setViewMode] = useState<ProductViewMode>("grid");
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    DEFAULT_ITEMS_PER_PAGE,
  );
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
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
  return Array.from(
    new Set(products.map((product) => product.category as ProductCategory))
  );
}, [products]);

  const brands = useMemo<string[]>(() => {
    return Array.from(new Set(products.map((product) => product.brand))).sort();
  }, [products]);

  const filteredProducts = useMemo<Product[]>(() => {
    const filtered = products.filter((product) => {
      const searchText = filters.searchText.trim().toLowerCase();

      const matchesSearch =
        !searchText || getProductSearchableText(product).includes(searchText);

      const matchesGender =
        !filters.gender || getProductGender(product) === filters.gender;

      const matchesCategory =
        !filters.category || product.category === filters.category;

      const matchesBrand = !filters.brand || product.brand === filters.brand;

      const matchesColor =
        !filters.color ||
        getProductColor(product).toLowerCase() === filters.color.toLowerCase();

      const matchesPrice =
        product.price >= filters.priceMin && product.price <= filters.priceMax;

      const matchesRating =
        !filters.rating ||
        (filters.rating === "ABOVE_5" && product.rating >= 5) ||
        (filters.rating === "ABOVE_4" && product.rating >= 4) ||
        (filters.rating === "ABOVE_3" && product.rating >= 3) ||
        (filters.rating === "ABOVE_2" && product.rating >= 2);

      const matchesDiscount =
        !filters.discount ||
        (filters.discount === "ABOVE_10" && product.discount >= 10) ||
        (filters.discount === "ABOVE_20" && product.discount >= 20) ||
        (filters.discount === "ABOVE_30" && product.discount >= 30) ||
        (filters.discount === "ABOVE_40" && product.discount >= 40) ||
        (filters.discount === "ABOVE_50" && product.discount >= 50) ||
        (filters.discount === "ABOVE_60" && product.discount >= 60) ||
        (filters.discount === "ABOVE_70" && product.discount >= 70) ||
        (filters.discount === "ABOVE_80" && product.discount >= 80) ||
        (filters.discount === "ABOVE_90" && product.discount >= 90);

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

  const handleFilterChange = <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ): void => {
    setFilters((previousFilters) => {
      const normalizedFilters = {
        ...previousFilters,
        [key]: value,
      } as ProductFilters;

      let nextFilters: ProductFilters;

      if (key === "priceMin" && typeof value === "number") {
        const clampedMin = Math.min(value, previousFilters.priceMax);
        nextFilters = {
          ...normalizedFilters,
          priceMin: clampedMin,
          priceRange: "",
        };
      } else if (key === "priceMax" && typeof value === "number") {
        const clampedMax = Math.max(value, previousFilters.priceMin);
        nextFilters = {
          ...normalizedFilters,
          priceMax: clampedMax,
          priceRange: "",
        };
      } else {
        nextFilters = {
          ...normalizedFilters,
          priceRange: "",
        };
      }

      return nextFilters;
    });

    resetPage();
  };

  const handleClearFilters = (): void => {
    const nextFilters = createInitialFilters("");

    setFilters(nextFilters);
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
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-2">
              <li className="breadcrumb-item">
                <Link to="/">Home</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Products
              </li>
            </ol>
          </nav>
          <p className="text-muted mb-0">
            Browse, filter, sort, compare and discover products.
          </p>
        </div>
      </section>

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

      <section className="container-fluid pb-5">
        <PersonalizedRecommendationsSection
          title="More Picks for You"
          subtitle="Based on your browsing and shopping activity."
          limit={4}
        />
      </section>

      {isMobileFilterOpen ? (
        <div className="marketplace-mobile-filter-overlay">
          <aside className="marketplace-mobile-filter-drawer bg-white">
            <div className="marketplace-mobile-filter-header">
              <h5 className="fw-bold mb-0">Filters</h5>
              <button
                type="button"
                className="btn btn-light rounded-circle"
                onClick={() => setIsMobileFilterOpen(false)}
                aria-label="Close filters"
              >
                <i className="bi bi-x-lg" />
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