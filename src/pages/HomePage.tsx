import { useEffect, useMemo, useRef, useState } from "react";
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
  "Accessories",
  "Men",
  "Women",
  "Kids",
  "Home",
  "Beauty",
];

const carouselSlides: Array<{
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryLink: string;
  secondaryLabel: string;
  secondaryLink: string;
  icon: string;
  themeClass: string;
}> = [
  {
    id: "electronics-sale",
    eyebrow: "Big Tech Deals",
    title: "Upgrade your gadgets with smart offers",
    description:
      "Explore smartphones, laptops, headphones, speakers, and accessories with fresh marketplace deals.",
    primaryLabel: "Shop Electronics",
    primaryLink: "/categories/Electronics",
    secondaryLabel: "View All Products",
    secondaryLink: "/products",
    icon: "bi bi-phone",
    themeClass: "home-carousel-slide-blue",
  },
  {
    id: "fashion-sale",
    eyebrow: "Fashion Marketplace",
    title: "Refresh your style for every occasion",
    description:
      "Discover clothing, footwear, accessories, size guides, wishlist, and similar product recommendations.",
    primaryLabel: "Shop Fashion",
    primaryLink: "/categories/Clothing",
    secondaryLabel: "Explore Footwear",
    secondaryLink: "/categories/Footwear",
    icon: "bi bi-bag-heart",
    themeClass: "home-carousel-slide-pink",
  },
  {
    id: "home-beauty-sale",
    eyebrow: "Home & Beauty Picks",
    title: "Curated essentials for daily living",
    description:
      "Shop home decor, beauty essentials, books, and lifestyle products with a smooth checkout experience.",
    primaryLabel: "Shop Beauty",
    primaryLink: "/categories/Beauty",
    secondaryLabel: "Shop Home",
    secondaryLink: "/categories/Home",
    icon: "bi bi-stars",
    themeClass: "home-carousel-slide-green",
  },
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

    case "Men":
      return "bi bi-person-standing";

    case "Women":
      return "bi bi-person";

    case "Kids":
      return "bi bi-emoji-smile";

    case "Home":
      return "bi bi-house-heart";

    case "Beauty":
      return "bi bi-stars";

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
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  const sectionRefs = useRef<
    Partial<Record<ProductCategory, HTMLElement | null>>
  >({});

  useEffect(() => {
    const loadProducts = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const products = await productService.getProducts();

        const availableProducts = products.filter(
          (product) => product.stock > 0,
        );

        setAllProducts(availableProducts);
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

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setActiveSlideIndex((previousIndex) =>
        previousIndex === carouselSlides.length - 1 ? 0 : previousIndex + 1,
      );
    }, 5000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const visibleCategories = useMemo(() => {
    if (allProducts.length === 0) {
      return categories;
    }

    return categories.filter((category) =>
      allProducts.some(
        (product) => product.category.toLowerCase() === category.toLowerCase(),
      ),
    );
  }, [allProducts]);

  useEffect(() => {
    if (isLoading || allProducts.length === 0) {
      return;
    }

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: "-145px 0px -60% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]): void => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const categoryName = entry.target.getAttribute(
          "data-category",
        ) as ProductCategory | null;

        if (categoryName && visibleCategories.includes(categoryName)) {
          setActiveCategory(categoryName);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    visibleCategories.forEach((category) => {
      const section = sectionRefs.current[category];

      if (section) {
        observer.observe(section);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [isLoading, allProducts, visibleCategories]);

  const scrollToSection = (category: ProductCategory): void => {
    const element = sectionRefs.current[category];

    if (!element) {
      return;
    }

    const navbarOffset = 145;
    const elementPosition =
      element.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - navbarOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });

    setActiveCategory(category);
  };

  const activeSlide = carouselSlides[activeSlideIndex];

  const getCategoryAccentColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case "men":
        return "#ee5f73";

      case "women":
        return "#fb56c1";

      case "kids":
        return "#f26a10";

      case "home":
        return "#f2c210";

      case "beauty":
        return "#0db7af";

      case "electronics":
        return "#2563eb";

      case "clothing":
        return "#ff6b35";

      case "books":
        return "#7c3aed";

      case "footwear":
        return "#14b8a6";

      case "accessories":
        return "#f97316";

      case "sports":
        return "#10b981";

      case "grocery":
        return "#22c55e";

      case "furniture":
        return "#a16207";

      case "appliances":
        return "#0ea5e9";

      default:
        return "#2563eb";
    }
  };

  return (
    <main className="home-page">
      <section className={`home-carousel-section ${activeSlide.themeClass}`}>
        <div className="container">
          <div className="home-carousel-card">
            <div className="row align-items-center g-4">
              <div className="col-lg-7">
                <span className="home-carousel-eyebrow">
                  {activeSlide.eyebrow}
                </span>

                <h1 className="home-carousel-title">{activeSlide.title}</h1>

                <p className="home-carousel-description">
                  {activeSlide.description}
                </p>

                <div className="d-flex flex-column flex-sm-row gap-3">
                  <Link
                    to={activeSlide.primaryLink}
                    className="btn btn-light btn-lg px-4 home-carousel-primary-btn"
                  >
                    <i className="bi bi-bag me-2" />
                    {activeSlide.primaryLabel}
                  </Link>

                  <Link
                    to={activeSlide.secondaryLink}
                    className="btn btn-outline-light btn-lg px-4"
                  >
                    {activeSlide.secondaryLabel}
                  </Link>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="home-carousel-visual">
                  <div className="home-carousel-icon">
                    <i className={activeSlide.icon} />
                  </div>

                  <div className="home-carousel-floating-card one">
                    <i className="bi bi-heart-fill text-danger" />
                    Wishlist ready
                  </div>

                  <div className="home-carousel-floating-card two">
                    <i className="bi bi-stars text-warning" />
                    Smart recommendations
                  </div>

                  <div className="home-carousel-floating-card three">
                    <i className="bi bi-truck text-success" />
                    Track orders easily
                  </div>
                </div>
              </div>
            </div>

            <div className="home-carousel-controls">
              {carouselSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={activeSlideIndex === index ? "active" : ""}
                  onClick={() => setActiveSlideIndex(index)}
                  aria-label={`Show slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <nav
        className="home-category-navbar bg-white"
        aria-label="Home categories"
      >
        <div className="container-fluid h-100">
          <div className="home-category-navbar-inner">
            <span className="home-category-title">Categories:</span>
            <ul className="home-category-list no-scrollbar">
              {visibleCategories.map((category) => {
                const isActive = activeCategory === category;

                return (
                  /* 1. Outermost element now correctly holds the key prop */
                  <li className="home-category-list-item" key={category}>
                    <a
                      href={`#${category.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(category);
                      }}
                      /* 2. Added 'fw-bold' utility class here to handle font styling natively */
                      className={`home-category-link fw-bold ${isActive ? "active" : ""}`}
                      style={
                        {
                          "--category-accent": getCategoryAccentColor(category),
                        } as React.CSSProperties
                      }
                    >
                      <i className={getCategoryIcon(category)} />
                      <span>{category}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>

      <div className="container-fluid py-5">
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
            {visibleCategories.map((category) => {
              const targetedProducts = allProducts
                .filter(
                  (product) =>
                    product.category.toLowerCase() === category.toLowerCase(),
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
                          Trending picks from our {category.toLowerCase()}{" "}
                          shelf.
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/categories/${encodeURIComponent(category)}`}
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
