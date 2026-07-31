import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type SyntheticEvent
} from "react";
import { Link } from "react-router-dom";

import Button from "../common/Button";
import Loader from "../common/Loader";

import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";

import { productService } from "../../services/productService";

import type { Product } from "../../types/product";

import {
  formatCurrency,
  getDiscountedPrice
} from "../../utils/currencyFormatter";

/* ==========================================================================
   Types
   ========================================================================== */

interface ViewSimilarModalProps {
  product: Product;
  onClose: () => void;
}

type ProductSizeOption = { size: string };

/* ==========================================================================
   Constants
   ========================================================================== */

const MAX_SIMILAR_PRODUCTS = 8;
const MAX_VISIBLE_SIZES = 4;
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
   Product Helpers
   ========================================================================== */

const getProductImage = (product: Product): string => {
  const productMedia = product.media ?? [];

  const firstProductImage = productMedia.find(
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
  const productMedia = product.media ?? [];

  const firstProductImage = productMedia.find(
    (mediaItem) =>
      mediaItem.type === "IMAGE" && Boolean(mediaItem.url?.trim())
  );

  const mediaAlt = firstProductImage?.alt?.trim();

  if (mediaAlt) {
    return mediaAlt;
  }

  return product.name;
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

const hasSizeOptions = (product: Product): boolean => {
  if (!product.sizeOptions || product.sizeOptions.length === 0) {
    return false;
  }

  return product.sizeOptions.some((opt: string | ProductSizeOption) => {
    const sizeVal = typeof opt === "string" ? opt : opt?.size;
    return Boolean(sizeVal?.trim());
  });
};

const getVisibleSizes = (product: Product): string[] => {
  const uniqueSizes = new Map<string, string>();

  product.sizeOptions?.forEach((opt: string | ProductSizeOption) => {
    const sizeVal = typeof opt === "string" ? opt : opt?.size;
    const trimmedSize = sizeVal?.trim();

    if (!trimmedSize) {
      return;
    }

    const normalizedKey = trimmedSize.toLowerCase();

    if (!uniqueSizes.has(normalizedKey)) {
      uniqueSizes.set(normalizedKey, trimmedSize);
    }
  });

  return Array.from(uniqueSizes.values());
};

/* ==========================================================================
   Rating Helpers
   ========================================================================== */

const formatRating = (rating: number): string => {
  if (!Number.isFinite(rating)) {
    return "0.0";
  }

  const normalizedRating = Math.min(5, Math.max(0, rating));
  return normalizedRating.toFixed(1);
};

const getRatingCount = (product: Product): number | null => {
  const ratingCount = product.ratingSummary?.totalRatings;

  if (
    typeof ratingCount !== "number" ||
    !Number.isFinite(ratingCount) ||
    ratingCount < 0
  ) {
    return null;
  }

  return Math.floor(ratingCount);
};

const formatRatingCount = (count: number): string => {
  return new Intl.NumberFormat("en-IN", {
    notation: count >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(Math.max(0, count));
};

/* ==========================================================================
   Similarity Helpers
   ========================================================================== */

const calculateSimilarityScore = (
  candidateProduct: Product,
  currentProduct: Product
): number => {
  let score = 0;

  if (candidateProduct.category === currentProduct.category) {
    score += 100;
  }

  const candidateBrand = candidateProduct.brand.trim().toLowerCase();
  const currentBrand = currentProduct.brand.trim().toLowerCase();

  if (candidateBrand && candidateBrand === currentBrand) {
    score += 40;
  }

  const candidateSubcategory = candidateProduct.subcategory?.trim().toLowerCase();
  const currentSubcategory = currentProduct.subcategory?.trim().toLowerCase();

  if (
    candidateSubcategory &&
    currentSubcategory &&
    candidateSubcategory === currentSubcategory
  ) {
    score += 30;
  }

  const currentProductPrice = getDiscountedPrice(
    currentProduct.price,
    currentProduct.discount
  );

  const candidateProductPrice = getDiscountedPrice(
    candidateProduct.price,
    candidateProduct.discount
  );

  if (currentProductPrice > 0 && candidateProductPrice > 0) {
    const priceDifferenceRatio =
      Math.abs(candidateProductPrice - currentProductPrice) /
      currentProductPrice;

    if (priceDifferenceRatio <= 0.1) {
      score += 25;
    } else if (priceDifferenceRatio <= 0.25) {
      score += 15;
    } else if (priceDifferenceRatio <= 0.5) {
      score += 5;
    }
  }

  if (Number.isFinite(candidateProduct.rating)) {
    score += Math.min(5, Math.max(0, candidateProduct.rating));
  }

  return score;
};

const sortSimilarProducts = (
  products: Product[],
  currentProduct: Product
): Product[] => {
  return [...products].sort((firstProduct, secondProduct) => {
    const firstScore = calculateSimilarityScore(
      firstProduct,
      currentProduct
    );
    const secondScore = calculateSimilarityScore(
      secondProduct,
      currentProduct
    );

    if (secondScore !== firstScore) {
      return secondScore - firstScore;
    }

    if (secondProduct.rating !== firstProduct.rating) {
      return secondProduct.rating - firstProduct.rating;
    }

    if (secondProduct.discount !== firstProduct.discount) {
      return secondProduct.discount - firstProduct.discount;
    }

    return firstProduct.name.localeCompare(secondProduct.name);
  });
};

/* ==========================================================================
   View Similar Modal Component
   ========================================================================== */

const ViewSimilarModal = ({
  product,
  onClose
}: ViewSimilarModalProps) => {
  const generatedId = useId();

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const modalTitleId = `${generatedId}-title`;
  const modalDescriptionId = `${generatedId}-description`;

  const modalTitle = useMemo(() => {
    return `Similar ${product.category} Products`;
  }, [product.category]);

  /* ==========================================================================
     Load Similar Products
     ========================================================================== */

  useEffect(() => {
  let isMounted = true;

  const loadSimilarProducts = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSimilarProducts([]);

      const categoryProducts =
        await productService.getProductsByCategory(product.category);

      if (!isMounted) return;

      const filteredProducts = categoryProducts.filter(
        (candidateProduct) => candidateProduct.id !== product.id
      );

      const sortedProducts = sortSimilarProducts(
        filteredProducts,
        product
      ).slice(0, MAX_SIMILAR_PRODUCTS);

      setSimilarProducts(sortedProducts);
    } catch {
      if (!isMounted) return;

      setSimilarProducts([]);
      setErrorMessage(
        "Unable to load similar products. Please make sure JSON Server is running."
      );
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  void loadSimilarProducts();

  return () => {
    isMounted = false;
  };
}, [product]); // <-- Clean single dependency

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
     Escape and Focus Trap
     ========================================================================== */

  useEffect(() => {
    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialogElement = dialogRef.current;
      if (!dialogElement) return;

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
      const lastFocusableElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (
        event.shiftKey &&
        (activeElement === firstFocusableElement || activeElement === dialogElement)
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
  }, [onClose]);

  /* ==========================================================================
     Handlers
     ========================================================================== */

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleAddToCart = (selectedProduct: Product): void => {
    const selectedProductHasSizes = hasSizeOptions(selectedProduct);

    if (selectedProduct.stock <= 0 || selectedProductHasSizes) {
      return;
    }

    addToCart(selectedProduct);
  };

  const handleWishlistClick = (selectedProduct: Product): void => {
    toggleWishlist(selectedProduct);
  };

  /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <div className="view-similar-overlay" onMouseDown={handleBackdropMouseDown}>
      <div
        ref={dialogRef}
        className="view-similar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        aria-describedby={modalDescriptionId}
        tabIndex={-1}
      >
        {/* Header */}
        <header className="view-similar-header">
          <div>
            <h2 id={modalTitleId} className="view-similar-title">
              {modalTitle}
            </h2>

            <p id={modalDescriptionId} className="view-similar-description">
              Products related to <strong>{product.name}</strong>.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="btn btn-light view-similar-close"
            onClick={onClose}
            aria-label="Close similar products modal"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        {/* Body */}
        <div className="view-similar-body">
          {isLoading ? <Loader message="Loading similar products..." /> : null}

          {!isLoading && errorMessage ? (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && !errorMessage && similarProducts.length === 0 ? (
            <div className="view-similar-empty" role="status">
              <span className="view-similar-empty-icon">
                <i className="bi bi-box-seam" aria-hidden="true" />
              </span>

              <div>
                <h3>No similar products found</h3>
                <p>There are no other products available in this category.</p>
              </div>
            </div>
          ) : null}

          {!isLoading && !errorMessage && similarProducts.length > 0 ? (
            <div className="view-similar-grid">
              {similarProducts.map((similarProduct) => {
                const discountedPrice = getDiscountedPrice(
                  similarProduct.price,
                  similarProduct.discount
                );

                const savedAmount = Math.max(
                  0,
                  similarProduct.price - discountedPrice
                );

                const productHasSizes = hasSizeOptions(similarProduct);
                const visibleSizes = getVisibleSizes(similarProduct);
                const isOutOfStock = similarProduct.stock <= 0;
                const isWishlisted = isInWishlist(similarProduct.id);
                const ratingCount = getRatingCount(similarProduct);
                const productImage = getProductImage(similarProduct);
                const productImageAlt = getProductImageAlt(similarProduct);

                return (
                  <article
                    className={`view-similar-card ${
                      isOutOfStock ? "view-similar-card-out-of-stock" : ""
                    }`.trim()}
                    key={similarProduct.id}
                  >
                    {/* Product Media */}
                    <div className="view-similar-card-media">
                      <Link
                        to={`/products/${similarProduct.id}`}
                        onClick={onClose}
                        className="view-similar-image-link"
                        aria-label={`View details for ${similarProduct.name}`}
                      >
                        <img
                          src={productImage}
                          alt={productImageAlt}
                          onError={handleProductImageError}
                          loading="lazy"
                        />
                      </Link>

                      {similarProduct.discount > 0 ? (
                        <span className="view-similar-discount">
                          {similarProduct.discount}% OFF
                        </span>
                      ) : null}

                      {isOutOfStock ? (
                        <span className="view-similar-stock-badge">
                          Out of Stock
                        </span>
                      ) : null}

                      {/* Wishlist Button */}
                      <button
                        type="button"
                        className={`view-similar-wishlist ${
                          isWishlisted ? "active" : ""
                        }`.trim()}
                        onClick={() => handleWishlistClick(similarProduct)}
                        aria-label={
                          isWishlisted
                            ? `Remove ${similarProduct.name} from wishlist`
                            : `Add ${similarProduct.name} to wishlist`
                        }
                        aria-pressed={isWishlisted}
                      >
                        <i
                          className={
                            isWishlisted ? "bi bi-heart-fill" : "bi bi-heart"
                          }
                          aria-hidden="true"
                        />
                      </button>

                      {/* Rating */}
                      <div
                        className="view-similar-rating"
                        aria-label={`${formatRating(
                          similarProduct.rating
                        )} out of 5 stars${
                          ratingCount !== null
                            ? ` from ${ratingCount} ratings`
                            : ""
                        }`}
                      >
                        <i className="bi bi-star-fill" aria-hidden="true" />
                        <span>{formatRating(similarProduct.rating)}</span>

                        {ratingCount !== null ? (
                          <>
                            <span
                              className="view-similar-rating-separator"
                              aria-hidden="true"
                            >
                              |
                            </span>
                            <span>{formatRatingCount(ratingCount)}</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="view-similar-card-body">
                      <Link
                        to={`/products/${similarProduct.id}`}
                        onClick={onClose}
                        className="view-similar-brand"
                      >
                        {similarProduct.brand}
                      </Link>

                      <Link
                        to={`/products/${similarProduct.id}`}
                        onClick={onClose}
                        className="view-similar-product-title"
                      >
                        {similarProduct.name}
                      </Link>

                      {visibleSizes.length > 0 ? (
                        <p className="view-similar-sizes">
                          <span>Sizes:</span>{" "}
                          <strong>
                            {visibleSizes
                              .slice(0, MAX_VISIBLE_SIZES)
                              .join(", ")}
                          </strong>
                          {visibleSizes.length > MAX_VISIBLE_SIZES ? (
                            <span>
                              {" "}
                              +{visibleSizes.length - MAX_VISIBLE_SIZES} more
                            </span>
                          ) : null}
                        </p>
                      ) : null}

                      <div className="view-similar-price-row">
                        <span className="view-similar-current-price">
                          {formatCurrency(discountedPrice)}
                        </span>

                        {similarProduct.discount > 0 ? (
                          <span className="view-similar-original-price">
                            {formatCurrency(similarProduct.price)}
                          </span>
                        ) : null}
                      </div>

                      {savedAmount > 0 ? (
                        <p className="view-similar-save">
                          You save <strong>{formatCurrency(savedAmount)}</strong>
                        </p>
                      ) : null}

                      {/* Product Action */}
                      {productHasSizes ? (
                        isOutOfStock ? (
                          <button
                            type="button"
                            className="btn btn-secondary view-similar-action"
                            disabled
                          >
                            <i
                              className="bi bi-x-circle me-2"
                              aria-hidden="true"
                            />
                            Out of Stock
                          </button>
                        ) : (
                          <Link
                            to={`/products/${similarProduct.id}`}
                            onClick={onClose}
                            className="btn btn-primary view-similar-action"
                          >
                            <i
                              className="bi bi-rulers me-2"
                              aria-hidden="true"
                            />
                            Select Size
                          </Link>
                        )
                      ) : (
                        <Button
                          type="button"
                          variant="primary"
                          className="view-similar-action"
                          disabled={isOutOfStock}
                          onClick={() => handleAddToCart(similarProduct)}
                        >
                          <i
                            className={
                              isOutOfStock
                                ? "bi bi-x-circle me-2"
                                : "bi bi-cart-plus me-2"
                            }
                            aria-hidden="true"
                          />
                          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ViewSimilarModal;