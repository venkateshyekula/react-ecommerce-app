import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import ProductCard from "../components/products/ProductCard";
import { productService } from "../services/productService";
import type { Product, ProductCategory } from "../types/product";

const categories: ProductCategory[] = [
  "Electronics",
  "Clothing",
  "Books",
  "Footwear",
  "Accessories"
];

const getCategoryIcon = (category: ProductCategory): string => {
  switch (category) {
    case "Electronics":
      return "bi bi-phone";
    case "Clothing":
      return "bi bi-bag-heart";
    case "Books":
      return "bi bi-book";
    case "Footwear":
      return "bi bi-bootstrap-reboot";
    case "Accessories":
      return "bi bi-watch";
    default:
      return "bi bi-grid";
  }
};

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadFeaturedProducts = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const products = await productService.getProducts();

        const availableProducts = products.filter(
          (product) => product.stock > 0
        );

        setFeaturedProducts(availableProducts.slice(0, 4));
      } catch {
        setErrorMessage(
          "Unable to load featured products. Please make sure JSON Server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadFeaturedProducts();
  }, []);

  return (
    <main>
      <section className="hero-section bg-primary text-white">
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <span className="badge bg-white text-primary mb-3">
                New Season Deals
              </span>

              <h1 className="display-6 fw-medium mb-2">
                Shop smarter with ShopEase
              </h1>

              <p className="lead text-white-75 mb-4">
                Discover electronics, fashion, books, footwear, and accessories
                with a clean shopping experience, secure checkout, and easy
                order tracking.
              </p>

              <div className="d-flex flex-column flex-sm-row gap-3">
                <Link to="/products" className="btn btn-light btn-lg px-4">
                  <i className="bi bi-bag me-2" />
                  Start Shopping
                </Link>

                <Link
                  to="/register"
                  className="btn btn-outline-light btn-lg px-4"
                >
                  Create Account
                </Link>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="hero-card bg-white text-dark rounded-4 shadow-lg p-4">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="hero-icon bg-primary-subtle text-primary">
                    <i className="bi bi-cart-check" />
                  </div>

                  <div>
                    <h5 className="fw-bold mb-1">Fast checkout</h5>
                    <p className="text-muted mb-0">
                      Cart, payment, and order history included.
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="hero-icon bg-success-subtle text-success">
                    <i className="bi bi-shield-check" />
                  </div>

                  <div>
                    <h5 className="fw-bold mb-1">Protected routes</h5>
                    <p className="text-muted mb-0">
                      Profile, cart, checkout, and orders are secured.
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="hero-icon bg-warning-subtle text-warning">
                    <i className="bi bi-truck" />
                  </div>

                  <div>
                    <h5 className="fw-bold mb-1">Order tracking</h5>
                    <p className="text-muted mb-0">
                      Track order from placed to delivered.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="section-heading text-center mb-4">
          <h2 className="fw-bold mb-2">Shop by Category</h2>
          <p className="text-muted mb-0">
            Browse products from popular shopping categories.
          </p>
        </div>

        <div className="row g-4">
          {categories.map((category) => (
            <div className="col-6 col-md-4 col-lg" key={category}>
              <Link
                to={`/categories/${category}`}
                className="category-card text-decoration-none bg-white shadow-sm rounded-4 p-4 d-block text-center h-100"
              >
                <div className="category-icon mx-auto mb-3">
                  <i className={getCategoryIcon(category)} />
                </div>

                <h6 className="fw-bold text-dark mb-0">{category}</h6>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="featured-section bg-light py-5">
        <div className="container">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h2 className="fw-bold mb-1">Featured Products</h2>
              <p className="text-muted mb-0">
                Top picks from our latest product catalog.
              </p>
            </div>

            <Link to="/products" className="btn btn-outline-primary">
              View All Products
            </Link>
          </div>

          {isLoading ? (
            <Loader message="Loading featured products..." />
          ) : null}

          {/* Fixed Syntax Error Here */}
          {!isLoading && errorMessage ? (
            <div className="text-center py-4">
              <p className="text-danger mb-3">{errorMessage}</p>
              <Link to="/products" className="btn btn-primary">
                Try Products Page
              </Link>
            </div>
          ) : null}

          {!isLoading && !errorMessage && featuredProducts.length === 0 ? (
            <EmptyState
              title="No products found"
              message="Featured products will appear here when data is available."
            />
          ) : null}

          {!isLoading && !errorMessage && featuredProducts.length > 0 ? (
            <div className="row g-4">
              {featuredProducts.map((product) => (
                <div className="col-sm-6 col-lg-3" key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
};

export default HomePage;