import { useMemo, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import Button from "../common/Button";
import QuickViewModal from "./QuickViewModal";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import { useComparison } from "../../context/useComparison";
import { useWishlist } from "../../context/useWishlist";
import type { Product, ProductViewMode } from "../../types/product";
import {
  formatCurrency,
  getDiscountedPrice,
} from "../../utils/currencyFormatter";
import ViewSimilarModal from "./ViewSimilarModal";

interface ProductCardProps {
  product: Product;
  viewMode?: ProductViewMode;
}

const MAX_VISIBLE_SIZES = 4;

const getRatingCount = (rating: number): string => {
  const count = Math.max(120, Math.round(rating * 485));

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }

  return String(count);
};

const isImageUrl = (image: string): boolean => {
  return (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:image/")
  );
};

const ProductCard = ({ product, viewMode = "grid" }: ProductCardProps) => {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, toggleCompare, compareCount } = useComparison();

  const [isQuickViewOpen, setIsQuickViewOpen] = useState<boolean>(false);
  const [isViewSimilarOpen, setIsViewSimilarOpen] = useState<boolean>(false);

  const userRole = currentUser?.role;

  const canUseShoppingFeatures =
    !currentUser || userRole === "CUSTOMER" || userRole === "ADMIN";

  const canUseWishlist =
    Boolean(currentUser) && (userRole === "CUSTOMER" || userRole === "ADMIN");

  const discountedPrice = getDiscountedPrice(product.price, product.discount);
  const isOutOfStock = product.stock <= 0;
  const isWishlisted = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);
  const isCompareDisabled = !isCompared && compareCount >= 4;

  const hasSizeOptions = Boolean(product.sizeOptions?.length);
  const visibleSizes = product.sizeOptions?.slice(0, MAX_VISIBLE_SIZES) ?? [];
  const hiddenSizeCount =
    (product.sizeOptions?.length ?? 0) - visibleSizes.length;

  const ratingCount = useMemo(() => {
    return getRatingCount(product.rating);
  }, [product.rating]);

  const stockLabel = useMemo(() => {
    if (isOutOfStock) return "Out of Stock";
    if (product.stock <= 5) return "Only Few Left";
    return "In Stock";
  }, [isOutOfStock, product.stock]);

  const stockClass = useMemo(() => {
    if (isOutOfStock) return "out-of-stock";
    if (product.stock <= 5) return "few-left";
    return "in-stock";
  }, [isOutOfStock, product.stock]);

  const handleWishlistClick = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();

    if (canUseWishlist) {
      toggleWishlist(product);
    }
  };

  const handleCompareClick = (): void => {
    if (!isCompareDisabled) {
      toggleCompare(product);
    }
  };

  const handleAddToCart = (): void => {
    if (!canUseShoppingFeatures || isOutOfStock || hasSizeOptions) {
      return;
    }

    addToCart(product);
  };

  return (
    <>
      <article
        className={`fashion-product-card bg-white ${
          viewMode === "list" ? "fashion-product-card-list" : ""
        }`}
      >
        <div className="fashion-product-media">
          <Link
            to={`/products/${product.id}`}
            className="fashion-product-image-link"
            aria-label={`View details for ${product.name}`}
          >
            {isImageUrl(product.image) ? (
              <img
                src={product.image}
                alt={product.name}
                className="fashion-product-image"
                loading="lazy"
              />
            ) : (
              <div className="fashion-product-image-placeholder">
                <span>{product.image}</span>
                <strong>{product.name}</strong>
              </div>
            )}
          </Link>

          {product.discount > 0 ? (
            <span className="fashion-discount-badge">
              {product.discount}% OFF
            </span>
          ) : null}

          <span className={`fashion-stock-badge ${stockClass}`}>
            {stockLabel}
          </span>

          <div className="fashion-rating-overlay">
            <i className="bi bi-star-fill" />
            <span>{product.rating}</span>
            <span className="fashion-rating-divider">|</span>
            <span>{ratingCount}</span>
          </div>

          {canUseWishlist ? (
            <button
              type="button"
              className={`fashion-wishlist-btn ${isWishlisted ? "active" : ""}`}
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
              />
            </button>
          ) : null}
        </div>

        <div className="fashion-product-body">
          <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
            <Link
              to={`/products/${product.id}`}
              className="fashion-product-brand"
            >
              {product.brand}
            </Link>

            {product.sellerName ? (
              <span className="fashion-seller-chip">
                <i className="bi bi-shop me-1" />
                {product.sellerName}
              </span>
            ) : null}
          </div>

          <p className="fashion-product-title">{product.name}</p>

          {hasSizeOptions ? (
            <div className="fashion-sizes-row">
              <span className="fashion-sizes-label">Sizes:</span>

              {visibleSizes.map((size) => (
                <span className="fashion-size-chip" key={size}>
                  {size}
                </span>
              ))}

              {hiddenSizeCount > 0 ? (
                <span className="fashion-size-chip muted">
                  +{hiddenSizeCount}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="fashion-price-row">
            <span className="fashion-current-price">
              {formatCurrency(discountedPrice)}
            </span>

            {product.discount > 0 ? (
              <>
                <span className="fashion-original-price">
                  {formatCurrency(product.price)}
                </span>

                <span className="fashion-saving-text">
                  Save {product.discount}%
                </span>
              </>
            ) : null}
          </div>

          <div className="fashion-utility-row">
            <button
              type="button"
              className={`fashion-utility-btn ${isCompared ? "active" : ""}`}
              disabled={isCompareDisabled}
              onClick={handleCompareClick}
            >
              <i
                className={isCompared ? "bi bi-check2-square" : "bi bi-square"}
              />
              {isCompared ? "Compared" : "Compare"}
            </button>

            <button
              type="button"
              className="fashion-utility-btn"
              onClick={() => setIsQuickViewOpen(true)}
            >
              <i className="bi bi-eye" />
              Quick View
            </button>

            <button
              type="button"
              className="fashion-utility-btn"
              onClick={() => setIsViewSimilarOpen(true)}
            >
              <i className="bi bi-grid" />
              View Similar
            </button>
          </div>

          <div className="fashion-action-row">
            {canUseShoppingFeatures ? (
              hasSizeOptions ? (
                <Link
                  to={`/products/${product.id}`}
                  className="btn btn-primary fashion-primary-action"
                >
                  <i className="bi bi-rulers me-2" />
                  Select Size
                </Link>
              ) : (
                <Button
                  variant="primary"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className="fashion-primary-action"
                >
                  <i className="bi bi-cart-plus me-2" />
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>
              )
            ) : null}

            <Link
              to={`/products/${product.id}`}
              className="btn btn-outline-primary fashion-secondary-action"
            >
              View Details
            </Link>
          </div>
        </div>
      </article>

      {isQuickViewOpen ? (
        <QuickViewModal
          product={product}
          onClose={() => setIsQuickViewOpen(false)}
        />
      ) : null}
      {isViewSimilarOpen ? (
        <ViewSimilarModal
          product={product}
          onClose={() => setIsViewSimilarOpen(false)}
        />
      ) : null}
    </>
  );
};

export default ProductCard;
