import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import ProductCard from "../components/products/ProductCard";
import ProductFilter from "../components/products/ProductFilter";
import SearchBar from "../components/products/SearchBar";
import { productService } from "../services/productService";
import type {
  Product,
  ProductCategory,
  ProductFilters
} from "../types/product";

const initialFilters: ProductFilters = {
  searchText: "",
  category: "",
  brand: "",
  priceRange: "",
  rating: ""
};

const ProductListPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
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
          "Unable to load products. Please make sure JSON Server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadProducts();
  }, []);

  const categories = useMemo<ProductCategory[]>(() => {
    return Array.from(
      new Set(products.map((product) => product.category))
    );
  }, [products]);

  const brands = useMemo<string[]>(() => {
    return Array.from(
      new Set(products.map((product) => product.brand))
    ).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchText = filters.searchText.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        product.name.toLowerCase().includes(searchText) ||
        product.category.toLowerCase().includes(searchText) ||
        product.brand.toLowerCase().includes(searchText);

      const matchesCategory =
        !filters.category || product.category === filters.category;

      const matchesBrand =
        !filters.brand || product.brand === filters.brand;

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

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesPrice &&
        matchesRating
      );
    });
  }, [products, filters]);

  const handleFilterChange = <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ): void => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      [key]: value, // FIXED: Using [key] instead of literal 'value'
    }));
  };

  const handleClearFilters = (): void => {
    setFilters(initialFilters);
  };

  return (
    <main className="product-list-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">Products</h1>
              <p className="text-muted mb-0">
                Browse products, search by name, and filter by category, brand,
                price, and rating.
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
          <div className="text-center py-5">
            <p className="text-danger mb-3">{errorMessage}</p>
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
              <div className="bg-white rounded-4 shadow-sm p-3 p-md-4 mb-4">
                <SearchBar
                  value={filters.searchText}
                  onChange={(value) =>
                    handleFilterChange("searchText", value)
                  }
                />

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mt-3">
                  <p className="text-muted mb-0">
                    Showing{" "}
                    <strong>{filteredProducts.length}</strong> of{" "}
                    <strong>{products.length}</strong> products
                  </p>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={handleClearFilters}
                  >
                    <i className="bi bi-x-circle me-1" />
                    Clear Filters
                  </button>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <EmptyState
                  title="No products found"
                  message="Try adjusting your search or filters."
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
                <div className="row g-4">
                  {filteredProducts.map((product) => (
                    <div className="col-sm-6 col-xl-4" key={product.id}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
};

export default ProductListPage;