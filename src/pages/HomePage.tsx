import { useEffect, useRef, useState } from "react";
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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [activeCategory, setActiveCategory] =
    useState<ProductCategory>("Electronics");

  const sectionRefs = useRef<Record<ProductCategory, HTMLElement | null>>({
    Electronics: null,
    Clothing: null,
    Books: null,
    Footwear: null,
    Accessories: null
  });

  useEffect(() => {
    const loadProducts = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const products = await productService.getProducts();

        const availableProducts = products.filter(
          (product) => product.stock > 0
        );

        setAllProducts(availableProducts);
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

  useEffect(() => {
    if (isLoading || allProducts.length === 0) {
      return;
    }

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: "-145px 0px -60% 0px",
      threshold: 0
    };

    const observerCallback = (
      entries: IntersectionObserverEntry[]
    ): void => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const categoryName = entry.target.getAttribute(
          "data-category"
        ) as ProductCategory | null;

        if (categoryName && categories.includes(categoryName)) {
          setActiveCategory(categoryName);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    Object.values(sectionRefs.current).forEach((section) => {
      if (section) {
        observer.observe(section);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [isLoading, allProducts]);

  const scrollToSection = (category: ProductCategory): void => {
    const element = sectionRefs.current[category];

    if (!element) {
      return;
    }

    const navbarOffset = 145;
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - navbarOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });

    setActiveCategory(category);
  };

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
                with a clean shopping experience.
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

      <div className="home-category-navbar bg-white">
        <div className="container h-100">
          <div className="home-category-navbar-inner">
            <span className="home-category-title">Categories:</span>

            <div className="home-category-scroll no-scrollbar">
              {categories.map((category) => {
                const isActive = activeCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => scrollToSection(category)}
                    className={`home-category-pill ${
                      isActive ? "active" : ""
                    }`}
                  >
                    <i className={getCategoryIcon(category)} />
                    <span>{category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        {isLoading ? (
          <Loader message="Assembling custom curated shopping catalogs..." />
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="text-center py-5">
            <p className="text-danger mb-3">{errorMessage}</p>

            <Link to="/products" className="btn btn-primary">
              Try Products Page
            </Link>
          </div>
        ) : null}

        {!isLoading && !errorMessage && allProducts.length === 0 ? (
          <EmptyState
            title="Warehouse Inventory Empty"
            message="No products are ready for delivery right now."
          />
        ) : null}

        {!isLoading && !errorMessage && allProducts.length > 0 ? (
          <div className="d-flex flex-column gap-5">
            {categories.map((category) => {
              const targetedProducts = allProducts
                .filter(
                  (product) =>
                    product.category.toLowerCase() === category.toLowerCase()
                )
                .slice(0, 4);

              if (targetedProducts.length === 0) {
                return null;
              }

              return (
                <section
                  key={category}
                  data-category={category}
                  ref={(element) => {
                    sectionRefs.current[category] = element;
                  }}
                  className="category-scroll-block py-3 border-bottom"
                >
                  <div className="d-flex align-items-center justify-content-between mb-4 gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="home-category-section-icon bg-primary-subtle text-primary rounded-3 fs-4 d-flex align-items-center justify-content-center">
                        <i className={getCategoryIcon(category)} />
                      </div>

                      <div>
                        <h3 className="fw-bold mb-0 text-dark h4">
                          {category}
                        </h3>

                        <p className="text-muted small mb-0">
                          Trending picks from our {category.toLowerCase()} shelf.
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/categories/${category}`}
                      className="btn btn-sm btn-outline-primary rounded-pill px-3 flex-shrink-0"
                    >
                      Explore All
                      <i className="bi bi-arrow-right ms-1" />
                    </Link>
                  </div>

                  <div className="row g-4">
                    {targetedProducts.map((product) => (
                      <div
                        className="col-sm-6 col-md-4 col-lg-3"
                        key={product.id}
                      >
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}
      </div>
    </main>
  );
};

export default HomePage;