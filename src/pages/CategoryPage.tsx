import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import ProductCard from "../components/products/ProductCard";
import SearchBar from "../components/products/SearchBar";
import { productService } from "../services/productService";
import type { PriceRange, Product, ProductCategory, RatingFilter } from "../types/product";

const validCategories: ProductCategory[] = [
  "Electronics",
  "Clothing",
  "Books",
  "Footwear",
  "Accessories"
];

const getValidCategory = (
  categoryParam: string | undefined
): ProductCategory | null => {
  if (!categoryParam) {
    return null;
  }

  const decodedCategory = decodeURIComponent(categoryParam);

  return (
    validCategories.find(
      (category) =>
        category.toLowerCase() === decodedCategory.toLowerCase()
    ) ?? null
  );
};

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();

  const selectedCategory = getValidCategory(category);

  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [priceRange, setPriceRange] = useState<PriceRange>("");
  const [rating, setRating] = useState<RatingFilter>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadCategoryProducts = async (): Promise<void> => {
      if (!selectedCategory) {
        setIsLoading(false);
        setProducts([]);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const categoryProducts = await productService.getProductsByCategory(
          selectedCategory
        );

        setProducts(categoryProducts);
      } catch {
        setErrorMessage(
          "Unable to load category products. Please make sure JSON Server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadCategoryProducts();
  }, [selectedCategory]);

  const brands = useMemo<string[]>(() => {
    return Array.from(
      new Set(products.map((product) => product.brand))
    ).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = searchText.trim().toLowerCase();

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      const matchesBrand = !brand || product.brand === brand;

      const matchesPrice =
        !priceRange ||
        (priceRange === "BELOW_1000" && product.price < 1000) ||
        (priceRange === "BETWEEN_1000_10000" &&
          product.price >= 1000 &&
          product.price <= 10000) ||
        (priceRange === "BETWEEN_10000_50000" &&
          product.price >= 10000 &&
          product.price <= 50000) ||
        (priceRange === "ABOVE_50000" && product.price > 50000);

      const matchesRating =
        !rating ||
        (rating === "ABOVE_4" && product.rating >= 4) ||
        (rating === "ABOVE_3" && product.rating >= 3) ||
        (rating === "ABOVE_2" && product.rating >= 2);

      return matchesSearch && matchesBrand && matchesPrice && matchesRating;
    });
  }, [products, searchText, brand, priceRange, rating]);

  const handleClearFilters = (): void => {
    setSearchText("");
    setBrand("");
    setPriceRange("");
    setRating("");
  };

  if (!selectedCategory) {
    return (
      <main className="category-page bg-light">
        <div className="container py-5">
          <EmptyState
            title="Category Not Found"
            message="The requested product category is invalid or does not exist."
            action={
              <Link to="/products" className="btn btn-primary">
                Browse All Products
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main className="category-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container py-4">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-2">
              <li className="breadcrumb-item">
                <Link to="/">Home</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/products">Products</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {selectedCategory}
              </li>
            </ol>
          </nav>

          <h1 className="fw-bold mb-1">{selectedCategory}</h1>
          <p className="text-muted mb-0">
            Explore latest products in {selectedCategory}.
          </p>
        </div>
      </section>

      <section className="container py-4 py-md-5">
        {isLoading ? (
          <Loader message={`Loading ${selectedCategory} products...`} />
        ) : null}

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
              <div className="product-filter bg-white rounded-4 shadow-sm p-3 product-filter-sticky">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-funnel me-2 text-primary" />
                    Filters
                  </h5>

                  <button
                    type="button"
                    className="btn btn-link text-decoration-none p-0 small"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </button>
                </div>

                <div className="mb-3">
                  <label htmlFor="categoryBrandFilter" className="form-label fw-semibold">
                    Brand
                  </label>

                  <select
                    id="categoryBrandFilter"
                    className="form-select"
                    value={brand}
                    onChange={(event) => setBrand(event.target.value)}
                  >
                    <option value="">All Brands</option>
                    {brands.map((brandName) => (
                      <option key={brandName} value={brandName}>
                        {brandName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="categoryPriceFilter" className="form-label fw-semibold">
                    Price
                  </label>

                  <select
                    id="categoryPriceFilter"
                    className="form-select"
                    value={priceRange}
                    onChange={(event) =>
                      setPriceRange(event.target.value as PriceRange)
                    }
                  >
                    <option value="">All Prices</option>
                    <option value="BELOW_1000">Below ₹1,000</option>
                    <option value="BETWEEN_1000_10000">
                      ₹1,000 - ₹10,000
                    </option>
                    <option value="BETWEEN_10000_50000">
                      ₹10,000 - ₹50,000
                    </option>
                    <option value="ABOVE_50000">Above ₹50,000</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="categoryRatingFilter" className="form-label fw-semibold">
                    Rating
                  </label>

                  <select
                    id="categoryRatingFilter"
                    className="form-select"
                    value={rating}
                    onChange={(event) =>
                      setRating(event.target.value as RatingFilter)
                    }
                  >
                    <option value="">All Ratings</option>
                    <option value="ABOVE_4">4 and above</option>
                    <option value="ABOVE_3">3 and above</option>
                    <option value="ABOVE_2">2 and above</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="col-lg-9">
              <div className="bg-white rounded-4 shadow-sm p-3 p-md-4 mb-4">
                <SearchBar
                  value={searchText}
                  onChange={setSearchText}
                  placeholder={`Search ${selectedCategory} products...`}
                />

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mt-3">
                  <p className="text-muted mb-0">
                    Showing <strong>{filteredProducts.length}</strong> of{" "}
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
                  title="No products match your filters"
                  message="Try relaxing your filters or altering your search text to see available options."
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

export default CategoryPage;