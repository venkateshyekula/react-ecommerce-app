import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";

import { productService } from "../services/productService";

import type { Product, ProductCategory } from "../types/product";

import "./HomePage.css";

/* ==========================================================================
   Types
   ========================================================================== */

interface CarouselSlide {
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
}

interface CategoryOffer {
  id: string;
  title: string;
  subtitle: string;
  category: ProductCategory;
  icon: string;
  themeClass: string;
}

/* ==========================================================================
   Carousel Configuration
   ========================================================================== */

const carouselSlides: CarouselSlide[] = [
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
    themeClass: "home-carousel-slide-blue"
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
    themeClass: "home-carousel-slide-pink"
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
    themeClass: "home-carousel-slide-green"
  },
  {
    id: "book-sale",
    eyebrow: "Reading Festival",
    title: "Discover stories, knowledge, and inspiration",
    description:
      "Browse fiction, educational books, business titles, and inspiring reads at attractive prices.",
    primaryLabel: "Shop Books",
    primaryLink: "/categories/Books",
    secondaryLabel: "Explore All",
    secondaryLink: "/products",
    icon: "bi bi-book",
    themeClass: "home-carousel-slide-purple"
  }
];

/* ==========================================================================
   Marketplace Category Cards
   ========================================================================== */

const categoryOffers: CategoryOffer[] = [
  {
    id: "electronics",
    title: "Electronics",
    subtitle: "Smartphones, laptops and audio",
    category: "Electronics",
    icon: "bi bi-phone",
    themeClass: "category-offer-blue"
  },
  {
    id: "clothing",
    title: "Fashion",
    subtitle: "Latest everyday fashion styles",
    category: "Clothing",
    icon: "bi bi-bag-heart",
    themeClass: "category-offer-pink"
  },
  {
    id: "men",
    title: "Men's Wear",
    subtitle: "Casual, formal and ethnic wear",
    category: "Men",
    icon: "bi bi-person-standing",
    themeClass: "category-offer-red"
  },
  {
    id: "women",
    title: "Women's Wear",
    subtitle: "Indian and western collections",
    category: "Women",
    icon: "bi bi-person",
    themeClass: "category-offer-purple"
  },
  {
    id: "kids",
    title: "Kid's Fashion",
    subtitle: "Clothing, footwear and accessories",
    category: "Kids",
    icon: "bi bi-emoji-smile",
    themeClass: "category-offer-orange"
  },
  {
    id: "footwear",
    title: "Footwear",
    subtitle: "Casual, sports and formal shoes",
    category: "Footwear",
    icon: "bi bi-bootstrap-reboot",
    themeClass: "category-offer-teal"
  },
  {
    id: "accessories",
    title: "Accessories",
    subtitle: "Watches, bags and daily essentials",
    category: "Accessories",
    icon: "bi bi-watch",
    themeClass: "category-offer-yellow"
  },
  {
    id: "beauty",
    title: "Beauty",
    subtitle: "Makeup, skincare and fragrance",
    category: "Beauty",
    icon: "bi bi-stars",
    themeClass: "category-offer-rose"
  },
  {
    id: "home",
    title: "Home & Living",
    subtitle: "Decor, furnishing and essentials",
    category: "Home",
    icon: "bi bi-house-heart",
    themeClass: "category-offer-green"
  },
  {
    id: "books",
    title: "Books",
    subtitle: "Popular stories and educational reads",
    category: "Books",
    icon: "bi bi-book",
    themeClass: "category-offer-indigo"
  }
];

/*
 * This helper supports the common discount field names without changing
 * Product or ProductCard. ProductCard still receives the original Product,
 * so its existing product.ts-based discount behavior remains unchanged.
 */
const getProductDiscount = (product: Product): number => {
  const discountProduct = product as Product & {
    discount?: number;
    discountPercentage?: number;
    discountPercent?: number;
  };

  const possibleDiscount =
    discountProduct.discountPercentage ??
    discountProduct.discountPercent ??
    discountProduct.discount ??
    0;

  const numericDiscount = Number(possibleDiscount);

  if (!Number.isFinite(numericDiscount) || numericDiscount <= 0) {
    return 0;
  }

  return Math.min(100, Math.round(numericDiscount));
};

/* ==========================================================================
   Home Page
   ========================================================================== */

const HomePage = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  /* ==========================================================================
     Load Products
     ========================================================================== */

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const products = await productService.getProducts();

        if (!isMounted) {
          return;
        }

        const availableProducts = products.filter(
          (product) => product.stock > 0
        );

        setAllProducts(availableProducts);
      } catch {
        if (!isMounted) {
          return;
        }

        setAllProducts([]);
        setErrorMessage(
          "Unable to load products. Please make sure JSON Server is running."
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
     Carousel Auto Rotation
     ========================================================================== */

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setActiveSlideIndex((previousIndex) =>
        previousIndex === carouselSlides.length - 1
          ? 0
          : previousIndex + 1
      );
    }, 5000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  /* ==========================================================================
     Derived Values
     ========================================================================== */

  const visibleCategoryOffers = useMemo<CategoryOffer[]>(() => {
    if (allProducts.length === 0) {
      return categoryOffers;
    }

    return categoryOffers.filter((offer) =>
      allProducts.some(
        (product) =>
          product.category.toLowerCase() === offer.category.toLowerCase()
      )
    );
  }, [allProducts]);

  const categoryDiscounts = useMemo<Record<string, number>>(() => {
    return categoryOffers.reduce<Record<string, number>>(
      (discountResult, offer) => {
        const highestDiscount = allProducts
          .filter(
            (product) =>
              product.category.toLowerCase() ===
              offer.category.toLowerCase()
          )
          .reduce(
            (currentHighestDiscount, product) =>
              Math.max(
                currentHighestDiscount,
                getProductDiscount(product)
              ),
            0
          );

        discountResult[offer.category] = highestDiscount;

        return discountResult;
      },
      {}
    );
  }, [allProducts]);

  const activeSlide = carouselSlides[activeSlideIndex];

  const showPreviousSlide = (): void => {
    setActiveSlideIndex((previousIndex) =>
      previousIndex === 0
        ? carouselSlides.length - 1
        : previousIndex - 1
    );
  };

  const showNextSlide = (): void => {
    setActiveSlideIndex((previousIndex) =>
      previousIndex === carouselSlides.length - 1
        ? 0
        : previousIndex + 1
    );
  };

  /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <main className="home-page">
      {/* ================================================================
          Promotional Carousel
          ================================================================ */}

      <section
        className={`home-carousel-section mt-4 py-4 ${activeSlide.themeClass}`}
        aria-label="ShopEase featured promotions"
      >
        <div className="container-fluid px-lg-4">
          <div className="home-carousel-card position-relative overflow-hidden">
            <div className="row align-items-center g-4">
              <div className="col-12 col-lg-7">
                <div className="home-carousel-content">
                  <span className="home-carousel-eyebrow">
                    <i
                      className={`${activeSlide.icon} me-2`}
                      aria-hidden="true"
                    />
                    {activeSlide.eyebrow}
                  </span>

                  <h1 className="home-carousel-title">
                    {activeSlide.title}
                  </h1>

                  <p className="home-carousel-description">
                    {activeSlide.description}
                  </p>

                  <div className="d-flex flex-column flex-sm-row gap-3">
                    <Link
                      to={activeSlide.primaryLink}
                      className="btn btn-light btn-lg px-4 home-carousel-primary-btn"
                    >
                      <i
                        className="bi bi-bag me-2"
                        aria-hidden="true"
                      />
                      {activeSlide.primaryLabel}
                    </Link>

                    <Link
                      to={activeSlide.secondaryLink}
                      className="btn btn-outline-light btn-lg px-4"
                    >
                      {activeSlide.secondaryLabel}
                      <i
                        className="bi bi-arrow-right ms-2"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-5">
                <div className="home-carousel-visual">
                  <div className="home-carousel-icon">
                    <i
                      className={activeSlide.icon}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="home-carousel-floating-card one">
                    <i
                      className="bi bi-heart-fill text-danger"
                      aria-hidden="true"
                    />
                    Wishlist ready
                  </div>

                  <div className="home-carousel-floating-card two">
                    <i
                      className="bi bi-stars text-warning"
                      aria-hidden="true"
                    />
                    Smart recommendations
                  </div>

                  <div className="home-carousel-floating-card three">
                    <i
                      className="bi bi-truck text-success"
                      aria-hidden="true"
                    />
                    Track orders easily
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="home-carousel-arrow home-carousel-arrow-previous"
              aria-label="Show previous promotion"
              onClick={showPreviousSlide}
            >
              <i className="bi bi-chevron-left" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="home-carousel-arrow home-carousel-arrow-next"
              aria-label="Show next promotion"
              onClick={showNextSlide}
            >
              <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>

            <div
              className="home-carousel-controls"
              role="group"
              aria-label="Featured promotion slides"
            >
              {carouselSlides.map((slide, index) => {
                const isActive = activeSlideIndex === index;

                return (
                  <button
                    key={slide.id}
                    type="button"
                    className={isActive ? "active" : ""}
                    aria-label={`Show slide ${index + 1}: ${
                      slide.eyebrow
                    }`}
                    aria-pressed={isActive}
                    onClick={() => setActiveSlideIndex(index)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          Loading State
          ================================================================ */}

      {isLoading ? (
        <div className="container-fluid py-5">
          <div className="d-flex align-items-center justify-content-center py-5">
            <Loader />
          </div>
        </div>
      ) : null}

      {/* ================================================================
          Error State
          ================================================================ */}

      {!isLoading && errorMessage ? (
        <div className="container-fluid py-5">
          <EmptyState
            title="Unable to load products"
            message={errorMessage}
            icon="bi bi-exclamation-triangle"
          />

          <div className="text-center mt-4">
            <Link
              to="/products"
              className="btn btn-primary rounded-pill px-4"
            >
              Try Products Page
              <i
                className="bi bi-arrow-right ms-2"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      ) : null}

      {/* ================================================================
          Empty State
          ================================================================ */}

      {!isLoading && !errorMessage && allProducts.length === 0 ? (
        <div className="container-fluid py-5">
          <EmptyState
            title="No products available"
            message="There are currently no in-stock products available. Please check again later."
            icon="bi bi-box-seam"
          />

          <div className="text-center mt-4">
            <Link
              to="/products"
              className="btn btn-outline-primary rounded-pill px-4"
            >
              Browse All Products
              <i
                className="bi bi-arrow-right ms-2"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      ) : null}

      {!isLoading && !errorMessage && allProducts.length > 0 ? (
        <>
          {/* ============================================================
              Shop By Category
              This is a content grid, not a navigation menu.
              ============================================================ */}

          <section className="home-shop-category-section py-5">
            <div className="container-fluid px-lg-4">
              <div className="home-section-heading text-center mb-5">
                <span className="home-section-eyebrow">
                  Explore the marketplace
                </span>

                <h2 className="home-section-title mb-2">
                  Shop By Category
                </h2>

                <p className="home-section-description text-muted mb-0">
                  Discover popular products and the best available
                  discounts across ShopEase.
                </p>
              </div>

              <div className="row g-3 g-lg-4">
                {visibleCategoryOffers.map((offer) => {
                  const discount = categoryDiscounts[offer.category] ?? 0;

                  return (
                    <div
                      className="col-6 col-md-4 col-lg-3 col-xl-2"
                      key={offer.id}
                    >
                      <Link
                        to={`/categories/${encodeURIComponent(
                          offer.category
                        )}`}
                        className={`home-category-offer-card ${offer.themeClass}`}
                        aria-label={`Shop ${offer.title}${
                          discount > 0
                            ? ` with discounts up to ${discount} percent`
                            : ""
                        }`}
                      >
                        <div className="home-category-offer-icon">
                          <i
                            className={offer.icon}
                            aria-hidden="true"
                          />
                        </div>

                        <div className="home-category-offer-content">
                          <h3 className="home-category-offer-title">
                            {offer.title}
                          </h3>

                          <p className="home-category-offer-subtitle">
                            {offer.subtitle}
                          </p>

                          {discount > 0 ? (
                            <span className="home-category-discount">
                              Up to {discount}% OFF
                            </span>
                          ) : (
                            <span className="home-category-discount">
                              Explore Collection
                            </span>
                          )}
                        </div>

                        <span className="home-category-offer-action">
                          Shop Now
                          <i
                            className="bi bi-arrow-right ms-1"
                            aria-hidden="true"
                          />
                        </span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
};

export default HomePage;