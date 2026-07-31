import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type SyntheticEvent
} from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";

import Button from "../common/Button";

import ProductSizeChart from "./ProductSizeChart";
import ProductSizeSelector from "./ProductSizeSelector";

import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";

import type { Product, ProductSizeOption } from "../../types/product";

import {
  formatCurrency,
  getDiscountedPrice
} from "../../utils/currencyFormatter";

/* ==========================================================================
   Types
   ========================================================================== */

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

/* ==========================================================================
   Constants
   ========================================================================== */

const FALLBACK_PRODUCT_IMAGE = "/placeholder-image.png";

const FOCUSABLE_ELEMENT_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  ':not([tabindex="-1"])'
].join(",");

/* ==========================================================================
   Product Media Helpers
   ========================================================================== */

const getProductImage = (product: Product): string => {
  const firstProductImage = product.media?.find(
    (mediaItem) =>
      mediaItem.type === "IMAGE" && Boolean(mediaItem.url?.trim())
  );

  if (firstProductImage?.url?.trim()) {
    return firstProductImage.url.trim();
  }

  if (product.image?.trim()) {
    return product.image.trim();
  }

  return FALLBACK_PRODUCT_IMAGE;
};

const getProductImageAlt = (product: Product): string => {
  const firstProductImage = product.media?.find(
    (mediaItem) =>
      mediaItem.type === "IMAGE" && Boolean(mediaItem.url?.trim())
  );

  const mediaAlt = firstProductImage?.alt?.trim();

  return mediaAlt || product.name;
};

const handleProductImageError = (
  event: SyntheticEvent<HTMLImageElement>
): void => {
  const imageElement = event.currentTarget;

  const currentSource = imageElement.getAttribute("src");

  if (
    currentSource === FALLBACK_PRODUCT_IMAGE ||
    currentSource?.endsWith(FALLBACK_PRODUCT_IMAGE)
  ) {
    return;
  }

  imageElement.src = FALLBACK_PRODUCT_IMAGE;
};

/* ==========================================================================
   Product Helpers
   ========================================================================== */

const hasProductSizeOptions = (product: Product): boolean => {
  if (!product.sizeOptions || product.sizeOptions.length === 0) {
    return false;
  }

  return product.sizeOptions.some((opt: string | ProductSizeOption) => {
    const sizeVal = typeof opt === "string" ? opt : opt?.size;
    return Boolean(sizeVal?.trim());
  });
};

const formatProductRating = (rating: number): string => {
  if (!Number.isFinite(rating)) {
    return "0.0";
  }

  const normalizedRating = Math.min(5, Math.max(0, rating));

  return normalizedRating.toFixed(1);
};

const formatRatingCount = (count: number): string => {
  return new Intl.NumberFormat("en-IN", {
    notation: count >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(Math.max(0, count));
};

/* ==========================================================================
   Quick View Modal
   ========================================================================== */

const QuickViewModal = ({ product, onClose }: QuickViewModalProps) => {
  const generatedId = useId();
  const navigate = useNavigate();

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [sizeError, setSizeError] = useState<string>("");
  const [isSizeChartOpen, setIsSizeChartOpen] = useState<boolean>(false);

  const modalTitleId = `${generatedId}-title`;
  const modalDescriptionId = `${generatedId}-description`;

  /* ==========================================================================
     Product Information
     ========================================================================== */

  const productImage = useMemo(
    () => getProductImage(product),
    [product]
  );

  const productImageAlt = useMemo(
    () => getProductImageAlt(product),
    [product]
  );

  const discountedPrice = useMemo(
    () => getDiscountedPrice(product.price, product.discount),
    [product.discount, product.price]
  );

  const savedAmount = Math.max(0, product.price - discountedPrice);
  const isOutOfStock = product.stock <= 0;
  const hasSizeOptions = hasProductSizeOptions(product);
  const isWishlisted = isInWishlist(product.id);

  const genuineRatingCount = product.ratingSummary?.totalRatings;
  const hasGenuineRatingCount =
    typeof genuineRatingCount === "number" &&
    Number.isFinite(genuineRatingCount) &&
    genuineRatingCount >= 0;

  /* ==========================================================================
     Role-Based Shopping Access
     ========================================================================== */

  const userRole = currentUser?.role;

  const canUseShoppingFeatures =
    !currentUser || userRole === "CUSTOMER" || userRole === "ADMIN";

  const canUseWishlist =
    !currentUser || userRole === "CUSTOMER" || userRole === "ADMIN";

  /* ==========================================================================
     Reset State When Product Changes
     ========================================================================== */

  useEffect(() => {
    setSelectedSize("");
    setSizeError("");
    setIsSizeChartOpen(false);
  }, [product.id]);

  /* ==========================================================================
     Body Scroll Lock and Focus Restoration
     ========================================================================== */

  useEffect(() => {
    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousBodyOverflow;

      window.requestAnimationFrame(() => {
        previouslyFocusedElementRef.current?.focus();
      });
    };
  }, []);

  /* ==========================================================================
     Escape Handling and Focus Trap
     ========================================================================== */

  useEffect(() => {
    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent): void => {
      /*
       * ProductSizeChart manages Escape while it is open.
       * This prevents one Escape press from closing both
       * the chart and the Quick View modal.
       */
      if (isSizeChartOpen) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialogElement = dialogRef.current;

      if (!dialogElement) {
        return;
      }

      const focusableElements = Array.from(
        dialogElement.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR)
      ).filter((element) => {
        const isDisabled = element.hasAttribute("disabled");
        const isAriaHidden = element.getAttribute("aria-hidden") === "true";
        const isHidden = element.offsetParent === null;

        return !isDisabled && !isAriaHidden && !isHidden;
      });

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogElement.focus();
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement =
        focusableElements[focusableElements.length - 1];

      const activeElement = document.activeElement;

      if (
        event.shiftKey &&
        (activeElement === firstFocusableElement ||
          activeElement === dialogElement)
      ) {
        event.preventDefault();
        lastFocusableElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isSizeChartOpen, onClose]);

  /* ==========================================================================
     Validation
     ========================================================================== */

  const validateSelectedSize = (): boolean => {
    if (hasSizeOptions && !selectedSize) {
      setSizeError("Please select a size before continuing.");
      return false;
    }

    if (
      selectedSize &&
      !product.sizeOptions?.some((opt: string | ProductSizeOption) => {
        const val = typeof opt === "string" ? opt : opt?.size;
        return val === selectedSize;
      })
    ) {
      setSizeError("The selected size is no longer available.");
      return false;
    }

    setSizeError("");
    return true;
  };

  /* ==========================================================================
     Modal Handlers
     ========================================================================== */

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget && !isSizeChartOpen) {
      onClose();
    }
  };

  const handleSizeChange = (size: string): void => {
    setSelectedSize(size);
    setSizeError("");
  };

  const handleAddToCart = (): void => {
    if (isOutOfStock || !canUseShoppingFeatures) {
      return;
    }

    if (!validateSelectedSize()) {
      return;
    }

    addToCart(product, selectedSize || undefined);
  };

  const handleBuyNow = (): void => {
    if (isOutOfStock || !canUseShoppingFeatures) {
      return;
    }

    if (!validateSelectedSize()) {
      return;
    }

    addToCart(product, selectedSize || undefined);
    onClose();
    navigate("/cart");
  };

  const handleWishlistClick = (): void => {
    if (!canUseWishlist) {
      return;
    }

    toggleWishlist(product);
  };

  const handleOpenSizeChart = (): void => {
    if (!product.sizeChart) {
      return;
    }

    setIsSizeChartOpen(true);
  };

  const handleCloseSizeChart = (): void => {
    setIsSizeChartOpen(false);

    window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });
  };

  /* ==========================================================================
     Quick View Content
     ========================================================================== */

  const modalContent = (
    <>
      <div
        className="quick-view-overlay"
        onMouseDown={handleBackdropMouseDown}
      >
        <section
          ref={dialogRef}
          className="quick-view-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          aria-describedby={modalDescriptionId}
          tabIndex={-1}
        >
          {/* Header */}
          <header className="quick-view-header">
            <div>
              <p className="quick-view-eyebrow">
                <i className="bi bi-eye" aria-hidden="true" />
                Quick View
              </p>

              <h2 id={modalTitleId} className="quick-view-title">
                {product.name}
              </h2>

              <p id={modalDescriptionId} className="quick-view-description">
                Preview product information, pricing, sizing, and shopping actions.
              </p>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              className="quick-view-close"
              aria-label="Close quick view"
              onClick={onClose}
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </header>

          {/* Body */}
          <div className="quick-view-body">
            <div className="quick-view-layout">
              {/* Product Media */}
              <div className="quick-view-media-column">
                <div className="quick-view-image-wrapper">
                  <img
                    src={productImage}
                    alt={productImageAlt}
                    onError={handleProductImageError}
                    className="quick-view-image"
                  />

                  {product.discount > 0 ? (
                    <span className="quick-view-discount">
                      {product.discount}% OFF
                    </span>
                  ) : null}

                  <span
                    className={`quick-view-stock-badge ${
                      isOutOfStock
                        ? "out-of-stock"
                        : product.stock <= 5
                        ? "low-stock"
                        : "in-stock"
                    }`.trim()}
                  >
                    {isOutOfStock
                      ? "Out of Stock"
                      : product.stock <= 5
                      ? `Only ${product.stock} Left`
                      : "In Stock"}
                  </span>
                </div>
              </div>

              {/* Product Information */}
              <div className="quick-view-information">
                {/* Metadata */}
                <div className="quick-view-product-badges">
                  <span className="quick-view-product-badge">
                    {product.category}
                  </span>

                  <span className="quick-view-product-badge">
                    {product.brand}
                  </span>

                  {product.sellerVerified ? (
                    <span className="quick-view-product-badge verified">
                      <i
                        className="bi bi-patch-check-fill"
                        aria-hidden="true"
                      />
                      Verified Seller
                    </span>
                  ) : null}
                </div>

                <p className="quick-view-brand">{product.brand}</p>

                <h3 className="quick-view-product-name">{product.name}</h3>

                {/* Rating */}
                <div className="quick-view-rating-row">
                  <span
                    className="quick-view-rating"
                    aria-label={`${formatProductRating(
                      product.rating
                    )} out of 5 stars${
                      hasGenuineRatingCount
                        ? ` from ${genuineRatingCount} ratings`
                        : ""
                    }`}
                  >
                    {formatProductRating(product.rating)}
                    <i className="bi bi-star-fill" aria-hidden="true" />
                  </span>

                  {hasGenuineRatingCount ? (
                    <span className="quick-view-rating-count">
                      {formatRatingCount(genuineRatingCount)} ratings
                    </span>
                  ) : null}
                </div>

                <p className="quick-view-product-description">
                  {product.description}
                </p>

                {/* Price */}
                <div className="quick-view-price-section">
                  <div className="quick-view-price-row">
                    <strong className="quick-view-current-price">
                      {formatCurrency(discountedPrice)}
                    </strong>

                    {product.discount > 0 ? (
                      <>
                        <span className="quick-view-original-price">
                          {formatCurrency(product.price)}
                        </span>

                        <span className="quick-view-discount-label">
                          {product.discount}% OFF
                        </span>
                      </>
                    ) : null}
                  </div>

                  {savedAmount > 0 ? (
                    <p className="quick-view-savings">
                      You save <strong>{formatCurrency(savedAmount)}</strong>
                    </p>
                  ) : null}

                  {product.isTaxInclusive ? (
                    <p className="quick-view-tax-note">
                      Inclusive of applicable taxes
                    </p>
                  ) : null}
                </div>

                {/* Size Selector */}
                {hasSizeOptions ? (
                  <ProductSizeSelector
                    product={product}
                    selectedSize={selectedSize}
                    errorMessage={sizeError}
                    onSizeChange={handleSizeChange}
                    onOpenSizeChart={handleOpenSizeChart}
                  />
                ) : null}

                {/* Shopping Actions */}
                {canUseShoppingFeatures ? (
                  <div className="quick-view-shopping-actions">
                    <Button
                      type="button"
                      variant="primary"
                      disabled={isOutOfStock}
                      onClick={handleAddToCart}
                      className="quick-view-primary-action"
                    >
                      <i
                        className="bi bi-cart-plus me-2"
                        aria-hidden="true"
                      />
                      {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                    </Button>

                    <Button
                      type="button"
                      variant="success"
                      disabled={isOutOfStock}
                      onClick={handleBuyNow}
                      className="quick-view-primary-action"
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
                          isWishlisted ? "danger" : "outline-danger"
                        }
                        onClick={handleWishlistClick}
                        className="quick-view-wishlist-action"
                        aria-pressed={isWishlisted}
                        aria-label={
                          isWishlisted
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                        }
                      >
                        <i
                          className={
                            isWishlisted
                              ? "bi bi-heart-fill"
                              : "bi bi-heart"
                          }
                          aria-hidden="true"
                        />

                        <span className="quick-view-wishlist-text">
                          {isWishlisted ? "Wishlisted" : "Wishlist"}
                        </span>
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <div className="alert alert-info" role="status">
                    <i
                      className="bi bi-info-circle me-2"
                      aria-hidden="true"
                    />
                    Shopping actions are available only for customer and administrator accounts.
                  </div>
                )}

                {/* Full Details Link */}
                <Link
                  to={`/products/${product.id}`}
                  className="btn btn-outline-primary quick-view-details-link"
                  onClick={onClose}
                >
                  View Full Product Details
                  <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
                </Link>

                {/* Seller Summary */}
                <div className="quick-view-seller-summary">
                  <i className="bi bi-shop" aria-hidden="true" />

                  <div>
                    <span>Sold by</span>
                    <strong>{product.sellerName}</strong>
                  </div>

                  {typeof product.sellerRating === "number" &&
                  Number.isFinite(product.sellerRating) ? (
                    <span className="quick-view-seller-rating">
                      {product.sellerRating.toFixed(1)}
                      <i className="bi bi-star-fill" aria-hidden="true" />
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Nested Size Chart */}
      {isSizeChartOpen && product.sizeChart ? (
        <ProductSizeChart
          sizeChart={product.sizeChart}
          onClose={handleCloseSizeChart}
        />
      ) : null}
    </>
  );

  return createPortal(modalContent, document.body);
};

export default QuickViewModal;