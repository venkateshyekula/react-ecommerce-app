import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";
import type { Product, ProductViewMode } from "../../types/product";
import {
  formatCurrency,
  getDiscountedPrice
} from "../../utils/currencyFormatter";
import Button from "../common/Button";

interface ProductCardProps {
  product: Product;
  viewMode?: ProductViewMode;
}

const sizeRequiredCategories = ["Clothing", "Footwear", "Accessories"];

const ProductCard = ({ product, viewMode = "grid" }: ProductCardProps) => {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const userRole = currentUser?.role;

  const canUseShoppingFeatures =
    !currentUser || userRole === "CUSTOMER" || userRole === "ADMIN";

  const canUseWishlist =
    Boolean(currentUser) && (userRole === "CUSTOMER" || userRole === "ADMIN");

  const isSizeRequired = sizeRequiredCategories.includes(product.category);

  const discountedPrice = getDiscountedPrice(product.price, product.discount);
  const isOutOfStock = product.stock <= 0;
  const isWishlisted = isInWishlist(product.id);
  const mockRatingCount = Math.max(120, Math.round(product.rating * 485));

  const handleAddToCart = (): void => {
    if (!isOutOfStock && canUseShoppingFeatures && !isSizeRequired) {
      addToCart(product);
    }
  };

  const handleWishlistClick = (
    event: MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();
    event.stopPropagation();

    if (canUseWishlist) {
      toggleWishlist(product);
    }
  };

  return (
    <div
      className={`card product-card advanced-product-card border-0 shadow-sm ${
        viewMode === "list" ? "product-card-list" : "h-100"
      }`}
    >
      <div className="product-image-wrapper position-relative">
        {/* FIX: Use an img tag instead of just rendering the string */}
        <img
          src={product.image}
          alt={product.name}
          className="img-fluid"
          onError={(e) => {
            e.currentTarget.src = "/placeholder-image.png";
          }}
        />

        {product.discount > 0 ? (
          <span className="badge bg-danger product-discount-badge">
            {product.discount}% OFF
          </span>
        ) : null}

        <span
          className={`badge product-stock-badge ${
            isOutOfStock ? "bg-secondary" : "bg-success"
          }`}
        >
          {isOutOfStock ? "Out of Stock" : "In Stock"}
        </span>

        {canUseWishlist ? (
          <button
            type="button"
            className={`wishlist-floating-btn ${
              isWishlisted ? "active" : ""
            }`}
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

      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <span className="badge bg-light text-primary border">
            {product.category}
          </span>

          <span className="rating-badge">
            <i className="bi bi-star-fill text-warning me-1" />
            {product.rating}
          </span>
        </div>

        <h5 className="card-title product-title mb-1">{product.name}</h5>
        {/*
        <p className="text-muted small mb-2">{product.brand}</p>
         
        {product.sellerName ? (
          <p className="small text-muted mb-2">
            Sold by <strong>{product.sellerName}</strong>
          </p>
        ) : null}

        <p className="product-description text-muted small mb-3">
          {product.description}
        </p> */}

        <div className="product-meta-list mb-3">
          <span>
            <i className="bi bi-people me-1" />
            {mockRatingCount} ratings
          </span>

          <span>
            <i className="bi bi-truck me-1" />
            Free delivery
          </span>
        </div>

        <div className="mt-auto">
          <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
            <span className="fw-bold fs-5 text-dark">
              {formatCurrency(discountedPrice)}
            </span>

            {product.discount > 0 ? (
              <>
                <span className="text-muted text-decoration-line-through small">
                  {formatCurrency(product.price)}
                </span>

                <span className="text-success small fw-bold">
                  Save {product.discount}%
                </span>
              </>
            ) : null}
          </div>

          <div
            className={`d-grid gap-2 ${
              viewMode === "list" ? "product-list-actions" : ""
            }`}
          >
            {canUseShoppingFeatures ? (
              isSizeRequired ? (
                <Link
                  to={`/products/${product.id}`}
                  className="btn btn-primary"
                >
                  <i className="bi bi-rulers me-2" />
                  Select Size
                </Link>
              ) : (
                <Button
                  variant="primary"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                >
                  <i className="bi bi-cart-plus me-2" />
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>
              )
            ) : null}

            <Link
              to={`/products/${product.id}`}
              className="btn btn-outline-primary"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;