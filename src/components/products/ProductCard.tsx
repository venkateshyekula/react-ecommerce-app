import { useMemo, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import ViewSimilarModal from "./ViewSimilarModal";

import { useAuth } from "../../context/useAuth";
import { useWishlist } from "../../context/useWishlist";

import type { Product, ProductViewMode } from "../../types/product";

import {
  formatCurrency,
  getDiscountedPrice,
} from "../../utils/currencyFormatter";

import "./ProductCard.css";

interface ProductCardProps {
  product: Product;
  viewMode?: ProductViewMode;
}

const MAX_VISIBLE_SIZES = 4;

/**
 * Generates a consistent display count when the Product model
 * provides only a rating value.
 */
const getRatingCount = (rating: number): string => {
  const count = Math.max(120, Math.round(rating * 485));

  if (count >= 100000) {
    return `${(count / 1000).toFixed(1)}k`;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }

  return String(count);
};

/**
 * Supports remote URLs, data URLs, public-folder paths,
 * and local relative image paths.
 */
const isImageUrl = (image: string): boolean => {
  const normalizedImage = image.trim().toLowerCase();

  return (
    normalizedImage.startsWith("http://") ||
    normalizedImage.startsWith("https://") ||
    normalizedImage.startsWith("data:image/") ||
    normalizedImage.startsWith("blob:") ||
    normalizedImage.startsWith("/") ||
    normalizedImage.startsWith("./") ||
    normalizedImage.startsWith("../") ||
    normalizedImage.endsWith(".jpg") ||
    normalizedImage.endsWith(".jpeg") ||
    normalizedImage.endsWith(".png") ||
    normalizedImage.endsWith(".webp") ||
    normalizedImage.endsWith(".gif") ||
    normalizedImage.endsWith(".avif")
  );
};

const ProductCard = ({ product, viewMode = "grid" }: ProductCardProps) => {
  const { currentUser } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [isViewSimilarOpen, setIsViewSimilarOpen] = useState<boolean>(false);

  const [hasImageError] = useState<boolean>(false);

  const userRole = currentUser?.role;

  const canUseWishlist =
  !currentUser ||
  userRole === "CUSTOMER" ||
  userRole === "ADMIN";

  const productRoute = `/products/${product.id}`;

  const discountedPrice = getDiscountedPrice(product.price, product.discount);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isWishlisted = isInWishlist(product.id);
  const navigate = useNavigate();

  const sizeOptions = product.sizeOptions ?? [];
  const visibleSizes = sizeOptions.slice(0, MAX_VISIBLE_SIZES);

  const hiddenSizeCount = Math.max(sizeOptions.length - visibleSizes.length, 0);

  const ratingCount = useMemo<string>(() => {
    return getRatingCount(product.rating);
  }, [product.rating]);

  const handleWishlistClick = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();

    if (!currentUser) {
      navigate("/login", {
        state: {
          from: productRoute,
          message: "Please log in to add products to your wishlist.",
        },
      });

      return;
    }

    if (!canUseWishlist) {
      return;
    }

    toggleWishlist(product);
  };

  const handleViewSimilarClick = (
    event: MouseEvent<HTMLButtonElement>,
  ): void => {
    event.preventDefault();
    event.stopPropagation();

    setIsViewSimilarOpen(true);
  };

  const closeViewSimilarModal = (): void => {
    setIsViewSimilarOpen(false);
  };

  return (
    <>
      <article
        className={[
          "myntra-product-card",
          viewMode === "list" ? "myntra-product-card-list" : "",
          isOutOfStock ? "myntra-product-card-out-of-stock" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Product Image Area */}
        <div className="myntra-product-media">
          <Link
            to={productRoute}
            className="myntra-product-image-link"
            aria-label={`View details for ${product.name}`}
          >
            {isImageUrl(product.image) && !hasImageError ? (
              <img
                src={product.image}
                alt={product.name}
                className="fashion-product-image"
                loading="lazy"
              />
            ) : (
              <div className="fashion-product-image-placeholder">
                <i className="bi bi-image" aria-hidden="true" />

                <strong>{product.name}</strong>
              </div>
            )}
          </Link>

          {/* Out-of-stock Overlay */}
          {isOutOfStock ? (
            <div className="myntra-product-unavailable-overlay">
              <span>Out of Stock</span>
            </div>
          ) : null}

          {/* Rating Overlay */}
          {product.rating > 0 ? (
            <div
              className="myntra-product-rating"
              aria-label={`${product.rating} rating from ${ratingCount} users`}
            >
              <span>{product.rating}</span>

              <i className="bi bi-star-fill" aria-hidden="true" />

              <span
                className="myntra-product-rating-divider"
                aria-hidden="true"
              >
                |
              </span>

              <span>{ratingCount}</span>
            </div>
          ) : null}

          {/* Desktop Hover Controls */}
          <div className="myntra-product-hover-actions">
            <div className="myntra-product-hover-top-row">
              <button
                type="button"
                className="myntra-view-similar-btn"
                onClick={handleViewSimilarClick}
                aria-label={`View products similar to ${product.name}`}
              >
                <i className="bi bi-grid-3x3-gap" aria-hidden="true" />

                <span>View Similar</span>
              </button>

              {canUseWishlist ? (
                <button
                  type="button"
                  className={[
                    "myntra-wishlist-btn",
                    isWishlisted ? "active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={
                    !currentUser
                      ? `Log in to add ${product.name} to wishlist`
                      : isWishlisted
                        ? `Remove ${product.name} from wishlist`
                        : `Add ${product.name} to wishlist`
                  }
                  aria-pressed={currentUser ? isWishlisted : false}
                  title={
                    !currentUser
                      ? "Log in to add to Wishlist"
                      : isWishlisted
                        ? "Remove from Wishlist"
                        : "Add to Wishlist"
                  }
                  onClick={handleWishlistClick}
                >
                  <i
                    className={
                      isWishlisted ? "bi bi-heart-fill" : "bi bi-heart"
                    }
                    aria-hidden="true"
                  />
                </button>
              ) : null}
            </div>

            {sizeOptions.length > 0 ? (
              <div className="myntra-hover-size-selector">
                <span className="myntra-hover-size-title">Select a size</span>

                <div className="myntra-hover-size-list">
                  {visibleSizes.map((size) => (
                    <Link
                      key={size}
                      to={productRoute}
                      className="myntra-hover-size-option"
                      aria-label={`Select size ${size} for ${product.name}`}
                    >
                      {size}
                    </Link>
                  ))}

                  {hiddenSizeCount > 0 ? (
                    <Link
                      to={productRoute}
                      className="myntra-hover-size-option muted"
                      aria-label={`View ${hiddenSizeCount} more sizes`}
                    >
                      +{hiddenSizeCount}
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <Link to={productRoute} className="myntra-view-product-link">
                View Product
                <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
              </Link>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="myntra-product-mobile-actions">
            <button
              type="button"
              className="myntra-mobile-similar-btn"
              aria-label={`View products similar to ${product.name}`}
              onClick={handleViewSimilarClick}
            >
              <i className="bi bi-grid-3x3-gap" aria-hidden="true" />
            </button>

            {canUseWishlist ? (
              <button
                type="button"
                className={[
                  "myntra-mobile-wishlist-btn",
                  isWishlisted ? "active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={
                  isWishlisted
                    ? `Remove ${product.name} from wishlist`
                    : `Add ${product.name} to wishlist`
                }
                aria-pressed={isWishlisted}
                onClick={handleWishlistClick}
              >
                <i
                  className={isWishlisted ? "bi bi-heart-fill" : "bi bi-heart"}
                  aria-hidden="true"
                />
              </button>
            ) : null}
          </div>
        </div>

        {/* Product Information */}
        <div className="myntra-product-information">
          <Link
            to={productRoute}
            className="myntra-product-content-link"
            aria-label={`Open ${product.name}`}
          >
            <h3 className="myntra-product-brand" title={product.brand}>
              {product.brand}
            </h3>

            <h4 className="myntra-product-name" title={product.name}>
              {product.name}
            </h4>

            {sizeOptions.length > 0 ? (
              <p className="myntra-product-sizes">
                Sizes:{" "}
                <span>
                  {visibleSizes.join(", ")}
                  {hiddenSizeCount > 0 ? ` +${hiddenSizeCount}` : ""}
                </span>
              </p>
            ) : null}

            <div className="myntra-product-price-row">
              <span className="myntra-product-current-price">
                {formatCurrency(discountedPrice)}
              </span>

              {product.discount > 0 ? (
                <>
                  <span className="myntra-product-original-price">
                    {formatCurrency(product.price)}
                  </span>

                  <span className="myntra-product-discount">
                    ({product.discount}% OFF)
                  </span>
                </>
              ) : null}
            </div>

            {isLowStock ? (
              <p className="myntra-product-low-stock">Only Few Left!</p>
            ) : null}

            {isOutOfStock ? (
              <p className="myntra-product-out-of-stock-text">
                Currently unavailable
              </p>
            ) : null}
          </Link>
        </div>
      </article>

      {isViewSimilarOpen ? (
        <ViewSimilarModal product={product} onClose={closeViewSimilarModal} />
      ) : null}
    </>
  );
};

export default ProductCard;
