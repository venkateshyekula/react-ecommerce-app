import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Link,
  useNavigate,
  useParams
} from "react-router-dom";

import Button from "../components/common/Button";
import Loader from "../components/common/Loader";

import ProductCard from "../components/products/ProductCard";
import ProductComparisonDetails from "../components/products/ProductComparisonDetails";
import ProductDeliveryChecker from "../components/products/ProductDeliveryChecker";
import ProductDetailsTabs, {
  type ProductDetailsTab
} from "../components/products/ProductDetailsTabs";
import ProductHighlights from "../components/products/ProductHighlights";
import ProductImageGallery from "../components/products/ProductImageGallery";
import ProductOffersPanel from "../components/products/ProductOffersPanel";
import ProductQuestions from "../components/products/ProductQuestions";
import ProductReviews from "../components/products/ProductReviews";
import ProductSellerSummary from "../components/products/ProductSellerSummary";
import ProductSizeChart from "../components/products/ProductSizeChart";
import ProductSizeRecommendationCard from "../components/products/ProductSizeRecommendationCard";
import ProductSizeSelector from "../components/products/ProductSizeSelector";
import ProductTrustHighlights from "../components/products/ProductTrustHighlights";
import RecentlyViewedProductsSection from "../components/products/RecentlyViewedProductsSection";
import RecommendedProductsSection from "../components/products/RecommendedProductsSection";

import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import { useWishlist } from "../context/useWishlist";

import { productService } from "../services/productService";

import type { Product } from "../types/product";

import {
  formatCurrency,
  getDiscountedPrice
} from "../utils/currencyFormatter";
import { saveRecentlyViewedProduct } from "../utils/recentlyViewedStorage";

import "./ProductDetailsPage.css";

/* ==========================================================================
   Constants
   ========================================================================== */

const SIMILAR_PRODUCT_LIMIT = 4;
const PRODUCT_HIGHLIGHT_LIMIT = 6;

/* ==========================================================================
   Helpers
   ========================================================================== */

const hasText = (
  value: string | undefined
): value is string => {
  return Boolean(value?.trim());
};

const getProductCategoryPath = (
  category: string
): string => {
  return `/categories/${encodeURIComponent(
    category
  )}`;
};

const getProductRatingLabel = (
  rating: number
): string => {
  if (!Number.isFinite(rating)) {
    return "Not rated";
  }

  return rating.toFixed(
    rating % 1 === 0 ? 0 : 1
  );
};

const getProductRatingCountLabel = (
  count: number
): string => {
  return new Intl.NumberFormat("en-IN").format(
    count
  );
};

/* ==========================================================================
   Product Details Page
   ========================================================================== */

const ProductDetailsPage = () => {
  const { id } = useParams<{
    id: string;
  }>();

  const navigate = useNavigate();

  const { currentUser } = useAuth();

  const { addToCart } = useCart();

  const {
    isInWishlist,
    toggleWishlist
  } = useWishlist();

  const [product, setProduct] =
    useState<Product | null>(null);

  const [
    similarProducts,
    setSimilarProducts
  ] = useState<Product[]>([]);

  const [activeTab, setActiveTab] =
    useState<ProductDetailsTab>(
      "description"
    );

  const [selectedSize, setSelectedSize] =
    useState<string>("");

  const [sizeError, setSizeError] =
    useState<string>("");

  const [
    isSizeChartOpen,
    setIsSizeChartOpen
  ] = useState<boolean>(false);

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const [errorMessage, setErrorMessage] =
    useState<string>("");

  /* ==========================================================================
     Role-Based Shopping Access
     ========================================================================== */

  const userRole = currentUser?.role;

  const canUseShoppingFeatures =
    !currentUser ||
    userRole === "CUSTOMER" ||
    userRole === "ADMIN";

  const canUseWishlist =
    !currentUser ||
    userRole === "CUSTOMER" ||
    userRole === "ADMIN";

  /* ==========================================================================
     Load Product
     ========================================================================== */

  useEffect(() => {
    let isMounted = true;

    const resetProductState = (): void => {
      setProduct(null);
      setSimilarProducts([]);
      setActiveTab("description");
      setSelectedSize("");
      setSizeError("");
      setIsSizeChartOpen(false);
      setErrorMessage("");
    };

    const loadProduct =
      async (): Promise<void> => {
        if (!id) {
          if (isMounted) {
            resetProductState();
            setErrorMessage(
              "Product ID is missing."
            );
            setIsLoading(false);
          }

          return;
        }

        try {
          setIsLoading(true);
          resetProductState();

          const productDetails =
            await productService.getProductById(
              id
            );

          if (!isMounted) {
            return;
          }

          if (!productDetails) {
            setErrorMessage(
              "Product not found."
            );

            return;
          }

          setProduct(productDetails);

          saveRecentlyViewedProduct(
            productDetails
          );

          try {
            const allProducts =
              await productService.getProducts();

            if (!isMounted) {
              return;
            }

            const relatedProducts =
              allProducts
                .filter(
                  (item) =>
                    item.category ===
                      productDetails.category &&
                    item.id !== productDetails.id
                )
                .slice(
                  0,
                  SIMILAR_PRODUCT_LIMIT
                );

            setSimilarProducts(
              relatedProducts
            );
          } catch {
            /*
             * Product details can still render when
             * the secondary similar-products request
             * fails.
             */
            if (isMounted) {
              setSimilarProducts([]);
            }
          }
        } catch {
          if (!isMounted) {
            return;
          }

          setProduct(null);

          setErrorMessage(
            "Unable to load product details. Please make sure JSON Server is running."
          );
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  /* ==========================================================================
     Derived Product Information
     ========================================================================== */

  const specificationHighlights =
    useMemo(() => {
      if (
        !product ||
        !product.specifications
      ) {
        return [];
      }

      return Object.entries(
        product.specifications
      ).slice(
        0,
        PRODUCT_HIGHLIGHT_LIMIT
      );
    }, [product]);

  const productDetailsList =
    useMemo<string[]>(() => {
      if (!product) {
        return [];
      }

      return (
        product.productDetails?.filter(
          (detail) =>
            Boolean(detail.trim())
        ) ?? []
      );
    }, [product]);

  const materialAndCareList =
    useMemo<string[]>(() => {
      if (!product) {
        return [];
      }

      return (
        product.materialAndCare?.filter(
          (detail) =>
            Boolean(detail.trim())
        ) ?? []
      );
    }, [product]);

  /* ==========================================================================
     Loading State
     ========================================================================== */

  if (isLoading) {
    return (
      <main className="product-details-page bg-light">
        <div className="container-fluid py-5">
          <Loader message="Loading product details..." />
        </div>
      </main>
    );
  }

  /* ==========================================================================
     Error State
     ========================================================================== */

  if (errorMessage || !product) {
    return (
      <main className="product-details-page bg-light">
        <div className="container-fluid py-5">
          <div className="product-details-error-state">
            <span className="product-details-error-icon">
              <i
                className="bi bi-exclamation-triangle"
                aria-hidden="true"
              />
            </span>

            <h1>Product Unavailable</h1>

            <p>
              {errorMessage ||
                "Product data is unavailable."}
            </p>

            <Link
              to="/products"
              className="btn btn-primary"
            >
              <i
                className="bi bi-arrow-left me-2"
                aria-hidden="true"
              />

              Back to Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================================
     Current Product Values
     ========================================================================== */

  const discountedPrice =
    getDiscountedPrice(
      product.price,
      product.discount
    );

  const savedAmount = Math.max(
    0,
    product.price - discountedPrice
  );

  const isOutOfStock =
    product.stock <= 0;

  const isWishlisted =
    isInWishlist(product.id);

  const hasSizeOptions = Boolean(
    product.sizeOptions?.length
  );

  const hasSpecifications =
    Object.keys(
      product.specifications ?? {}
    ).length > 0;

  const totalRatings =
    product.ratingSummary?.totalRatings;

  const totalReviews =
    product.ratingSummary?.totalReviews;

  /* ==========================================================================
     Size Validation
     ========================================================================== */

  const validateSelectedSize =
    (): boolean => {
      if (
        hasSizeOptions &&
        !selectedSize
      ) {
        setSizeError(
          "Please select a size before continuing."
        );

        return false;
      }

      if (
        selectedSize &&
        !product.sizeOptions?.includes(
          selectedSize
        )
      ) {
        setSizeError(
          "The selected size is not available."
        );

        return false;
      }

      setSizeError("");

      return true;
    };

  /* ==========================================================================
     Shopping Handlers
     ========================================================================== */

  const handleAddToCart = (): void => {
    if (
      isOutOfStock ||
      !canUseShoppingFeatures
    ) {
      return;
    }

    if (!validateSelectedSize()) {
      return;
    }

    addToCart(
      product,
      selectedSize || undefined
    );
  };

  const handleBuyNow = (): void => {
    if (
      isOutOfStock ||
      !canUseShoppingFeatures
    ) {
      return;
    }

    if (!validateSelectedSize()) {
      return;
    }

    addToCart(
      product,
      selectedSize || undefined
    );

    navigate("/cart");
  };

  const handleWishlistClick =
    (): void => {
      if (!canUseWishlist) {
        return;
      }

      toggleWishlist(product);
    };

  const handleSizeChange = (
    size: string
  ): void => {
    setSelectedSize(size);
    setSizeError("");
  };

  /* ==========================================================================
     Tab Handling
     ========================================================================== */

  const handleTabChange = (
    tab: ProductDetailsTab
  ): void => {
    setActiveTab(tab);
  };

  /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <main className="product-details-page bg-light">
      {/* Breadcrumb Header */}
      <section className="product-details-page-header bg-white border-bottom">
        <div className="container-fluid py-3 py-md-4">
          <nav aria-label="Breadcrumb">
            <ol className="breadcrumb product-details-breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Home</Link>
              </li>

              <li className="breadcrumb-item">
                <Link to="/products">
                  Products
                </Link>
              </li>

              <li className="breadcrumb-item">
                <Link
                  to={getProductCategoryPath(
                    product.category
                  )}
                >
                  {product.category}
                </Link>
              </li>

              {hasText(
                product.subcategory
              ) ? (
                <li className="breadcrumb-item d-none d-md-item">
                  {product.subcategory.trim()}
                </li>
              ) : null}

              <li
                className="breadcrumb-item active"
                aria-current="page"
              >
                {product.name}
              </li>
            </ol>
          </nav>
        </div>
      </section>

      <section className="container-fluid py-2">
        {/* Main Product Section */}
        <div className="row g-4">
          {/* Gallery */}
          <div className="col-lg-5">
            <div className="product-details-gallery-sticky">
              <ProductImageGallery
                product={product}
              />
            </div>
          </div>

          {/* Product Information */}
          <div className="col-lg-7">
            <article className="product-details-info-card bg-white">
              {/* Product Badges */}
              <div className="product-details-badges">
                <span className="product-details-badge category">
                  {product.category}
                </span>

                <span className="product-details-badge brand">
                  {product.brand}
                </span>

                {hasText(product.sellerName) ? (
                  <span className="product-details-badge seller">
                    Sold by{" "}
                    {product.sellerName}
                  </span>
                ) : null}

                <span
                  className={`product-details-badge ${
                    isOutOfStock
                      ? "out-of-stock"
                      : "in-stock"
                  }`}
                >
                  {isOutOfStock
                    ? "Out of Stock"
                    : "In Stock"}
                </span>

                {product.discount > 0 ? (
                  <span className="product-details-badge discount">
                    {product.discount}% OFF
                  </span>
                ) : null}
              </div>

              {/* Product Identity */}
              <header className="product-details-identity">
                <p className="product-details-brand">
                  {product.brand}
                </p>

                <h1 className="product-details-name">
                  {product.name}
                </h1>

                {hasText(
                  product.subcategory
                ) ? (
                  <p className="product-details-subcategory">
                    {product.subcategory.trim()}
                  </p>
                ) : null}
              </header>

              {/* Rating */}
              <div className="product-details-rating-row">
                <span
                  className="product-details-rating-badge"
                  aria-label={`${getProductRatingLabel(
                    product.rating
                  )} out of 5 stars`}
                >
                  {getProductRatingLabel(
                    product.rating
                  )}

                  <i
                    className="bi bi-star-fill"
                    aria-hidden="true"
                  />
                </span>

                {typeof totalRatings ===
                  "number" &&
                totalRatings >= 0 ? (
                  <span className="product-details-rating-count">
                    {getProductRatingCountLabel(
                      totalRatings
                    )}{" "}
                    ratings
                  </span>
                ) : null}

                {typeof totalReviews ===
                  "number" &&
                totalReviews >= 0 ? (
                  <button
                    type="button"
                    className="product-details-review-link"
                    onClick={() =>
                      handleTabChange(
                        "reviews"
                      )
                    }
                  >
                    {getProductRatingCountLabel(
                      totalReviews
                    )}{" "}
                    reviews
                  </button>
                ) : null}
              </div>

              <p className="product-details-short-description">
                {product.description}
              </p>

              {/* Price */}
              <div className="product-details-price-section">
                <div className="product-details-price-row">
                  <span className="product-details-selling-price">
                    {formatCurrency(
                      discountedPrice
                    )}
                  </span>

                  {product.discount > 0 ? (
                    <>
                      <span className="product-details-original-price">
                        {formatCurrency(
                          product.price
                        )}
                      </span>

                      <span className="product-details-discount-label">
                        {product.discount}% OFF
                      </span>
                    </>
                  ) : null}
                </div>

                {savedAmount > 0 ? (
                  <p className="product-details-savings">
                    You save{" "}
                    <strong>
                      {formatCurrency(
                        savedAmount
                      )}
                    </strong>
                  </p>
                ) : null}

                {product.isTaxInclusive ? (
                  <p className="product-details-tax-note">
                    Inclusive of applicable
                    taxes
                  </p>
                ) : null}
              </div>

              {/* Stock Status */}
              <div
                className={`product-stock-info ${
                  isOutOfStock
                    ? "out-of-stock"
                    : product.stock <= 5
                      ? "low-stock"
                      : "in-stock"
                }`}
              >
                <div>
                  <span className="product-stock-label">
                    Availability
                  </span>

                  <strong>
                    {isOutOfStock
                      ? "Currently unavailable"
                      : product.stock <= 5
                        ? `Only ${product.stock} left`
                        : "Available"}
                  </strong>
                </div>

                {!isOutOfStock ? (
                  <span className="product-stock-count">
                    {product.stock} in stock
                  </span>
                ) : null}
              </div>

              {/* Size Selection */}
              <ProductSizeSelector
                product={product}
                selectedSize={selectedSize}
                errorMessage={sizeError}
                onSizeChange={
                  handleSizeChange
                }
                onOpenSizeChart={() =>
                  setIsSizeChartOpen(true)
                }
              />

              <ProductSizeRecommendationCard
                product={product}
                selectedSize={selectedSize}
                onSelectSize={
                  handleSizeChange
                }
              />

              {/* Shopping Actions */}
              {canUseShoppingFeatures ? (
                <div className="product-details-actions">
                  <Button
                    type="button"
                    variant="primary"
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    className="product-details-action-button"
                  >
                    <i
                      className="bi bi-bag-plus me-2"
                      aria-hidden="true"
                    />

                    {isOutOfStock
                      ? "Out of Stock"
                      : "Add to Bag"}
                  </Button>

                  <Button
                    type="button"
                    variant="success"
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className="product-details-action-button"
                  >
                    <i
                      className="bi bi-lightning-charge me-2"
                      aria-hidden="true"
                    />

                    Buy Now
                  </Button>

                  {canUseWishlist ? (
                    <Button
                      type="button"
                      variant={
                        isWishlisted
                          ? "danger"
                          : "outline-danger"
                      }
                      onClick={
                        handleWishlistClick
                      }
                      className="product-details-action-button product-details-wishlist-button"
                      aria-pressed={
                        isWishlisted
                      }
                    >
                      <i
                        className={`bi ${
                          isWishlisted
                            ? "bi-heart-fill"
                            : "bi-heart"
                        } me-2`}
                        aria-hidden="true"
                      />

                      {isWishlisted
                        ? "Wishlisted"
                        : "Wishlist"}
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div
                  className="alert alert-info"
                  role="status"
                >
                  <i
                    className="bi bi-info-circle me-2"
                    aria-hidden="true"
                  />

                  Shopping actions are available
                  only for customer and
                  administrator accounts.
                </div>
              )}

              {/* Product Highlights */}
              <div className="border-top">
                <ProductHighlights
                product={product}
              />
              </div>

              {/* Marketplace Panels */}
              <div className="product-details-marketplace-panels border-top">
                <div className="product-offers-panel">
                  <ProductOffersPanel
                    product={product}
                  />
                </div>

                <div className="product-delivery-panel-wrapper">
                  <ProductDeliveryChecker
                    product={product}
                  />
                </div>

                <div className="product-seller-panel border-top">
                  <ProductSellerSummary
                    product={product}
                  />
                </div>

                <div className="product-trust-panel">
                  <ProductTrustHighlights
                    product={product}
                  />
                </div>
              </div>

              {/* Specification Highlights */}
              {specificationHighlights.length >
              0 ? (
                <section
                  className="product-specification-highlights"
                  aria-labelledby={`product-specification-highlights-title-${product.id}`}
                >
                  <h2
                    id={`product-specification-highlights-title-${product.id}`}
                    className="product-specification-highlights-title"
                  >
                    Key Specifications
                  </h2>

                  <dl className="product-specification-highlights-grid">
                    {specificationHighlights.map(
                      ([key, value]) => (
                        <div
                          className="product-specification-highlight"
                          key={key}
                        >
                          <dt>{key}</dt>
                          <dd>{value}</dd>
                        </div>
                      )
                    )}
                  </dl>
                </section>
              ) : null}
            </article>
          </div>
        </div>

        {/* Product Details Tabs */}
        <section className="product-details-tabs-card bg-white">
          <ProductDetailsTabs
            activeTab={activeTab}
            onTabChange={
              handleTabChange
            }
          />

          <div className="product-details-tab-content">
            {/* Description */}
            {activeTab ===
            "description" ? (
              <section
                id="product-description-panel"
                role="tabpanel"
                aria-labelledby="product-description-tab"
                tabIndex={0}
                className="product-details-tab-panel"
              >
                <div className="product-tab-section-heading">
                  <h2>Product Details</h2>

                  <p>
                    Description and additional
                    product information.
                  </p>
                </div>

                <div className="product-description-content">
                  <p>
                    {product.description}
                  </p>
                </div>

                {productDetailsList.length >
                0 ? (
                  <section className="product-additional-details">
                    <h3>
                      Additional Details
                    </h3>

                    <ul>
                      {productDetailsList.map(
                        (detail, index) => (
                          <li
                            key={`${detail}-${index}`}
                          >
                            <i
                              className="bi bi-check2"
                              aria-hidden="true"
                            />

                            <span>
                              {detail}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </section>
                ) : null}

                {materialAndCareList.length >
                0 ? (
                  <section className="product-material-care">
                    <h3>
                      Material and Care
                    </h3>

                    <ul>
                      {materialAndCareList.map(
                        (instruction, index) => (
                          <li
                            key={`${instruction}-${index}`}
                          >
                            {instruction}
                          </li>
                        )
                      )}
                    </ul>
                  </section>
                ) : null}

                <dl className="product-origin-details">
                  {hasText(
                    product.productCode
                  ) ? (
                    <div>
                      <dt>Product Code</dt>
                      <dd>
                        {product.productCode.trim()}
                      </dd>
                    </div>
                  ) : null}

                  {hasText(
                    product.countryOfOrigin
                  ) ? (
                    <div>
                      <dt>
                        Country of Origin
                      </dt>
                      <dd>
                        {product.countryOfOrigin.trim()}
                      </dd>
                    </div>
                  ) : null}

                  {hasText(
                    product.warranty
                  ) ? (
                    <div>
                      <dt>Warranty</dt>
                      <dd>
                        {product.warranty.trim()}
                      </dd>
                    </div>
                  ) : null}

                  {hasText(product.hsnCode) ? (
                    <div>
                      <dt>HSN Code</dt>
                      <dd>
                        {product.hsnCode.trim()}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </section>
            ) : null}

            {/* Specifications */}
            {activeTab ===
            "specifications" ? (
              <section
                id="product-specifications-panel"
                role="tabpanel"
                aria-labelledby="product-specifications-tab"
                tabIndex={0}
                className="product-details-tab-panel"
              >
                <div className="product-tab-section-heading">
                  <h2>Specifications</h2>

                  <p>
                    Technical and product
                    attributes provided for this
                    item.
                  </p>
                </div>

                {hasSpecifications ? (
                  <dl className="specification-list">
                    {Object.entries(
                      product.specifications
                    ).map(([key, value]) => (
                      <div
                        className="specification-row"
                        key={key}
                      >
                        <dt>{key}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="product-details-empty-state">
                    <i
                      className="bi bi-list-ul"
                      aria-hidden="true"
                    />

                    <p>
                      Product specifications are
                      not available.
                    </p>
                  </div>
                )}
              </section>
            ) : null}

            {/* Reviews */}
            {activeTab === "reviews" ? (
              <section
                id="product-reviews-panel"
                role="tabpanel"
                aria-labelledby="product-reviews-tab"
                tabIndex={0}
                className="product-details-tab-panel"
              >
                <ProductReviews
                  product={product}
                />
              </section>
            ) : null}

            {/* Questions */}
            {activeTab ===
            "questions" ? (
              <section
                id="product-questions-panel"
                role="tabpanel"
                aria-labelledby="product-questions-tab"
                tabIndex={0}
                className="product-details-tab-panel"
              >
                <ProductQuestions
                  product={product}
                />
              </section>
            ) : null}
          </div>
        </section>

        {/* Comparison */}
        <ProductComparisonDetails
          product={product}
        />

        {/* Similar Products */}
        {similarProducts.length > 0 ? (
          <section
            className="similar-products-section"
            aria-labelledby="similar-products-title"
          >
            <div className="similar-products-header">
              <div>
                <h2 id="similar-products-title">
                  Similar Products
                </h2>

                <p>
                  More products from{" "}
                  {product.category}.
                </p>
              </div>

              <Link
                to={getProductCategoryPath(
                  product.category
                )}
                className="btn btn-outline-primary"
              >
                View All
              </Link>
            </div>

            <div className="row g-4">
              {similarProducts.map(
                (similarProduct) => (
                  <div
                    className="col-sm-6 col-lg-3"
                    key={similarProduct.id}
                  >
                    <ProductCard
                      product={
                        similarProduct
                      }
                    />
                  </div>
                )
              )}
            </div>
          </section>
        ) : null}

        {/* Recommendations */}
        <RecommendedProductsSection
          product={product}
        />

        {/* Recently Viewed */}
        <RecentlyViewedProductsSection
          currentProductId={product.id}
        />
      </section>

      {/* Size Chart Modal */}
      {isSizeChartOpen &&
      product.sizeChart ? (
        <ProductSizeChart
          sizeChart={product.sizeChart}
          onClose={() =>
            setIsSizeChartOpen(false)
          }
        />
      ) : null}
    </main>
  );
};

export default ProductDetailsPage;