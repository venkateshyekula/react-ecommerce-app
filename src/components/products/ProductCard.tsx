import { Link } from "react-router-dom";
import { useCart } from "../../context/useCart";
import type { Product } from "../../types/product";
import {
  formatCurrency,
  getDiscountedPrice
} from "../../utils/currencyFormatter";
import Button from "../common/Button";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  const discountedPrice = getDiscountedPrice(product.price, product.discount);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (): void => {
    if (!isOutOfStock) {
      addToCart(product);
    }
  };

  return (
    <div className="card product-card h-100 border-0 shadow-sm">
      <div className="product-image-wrapper position-relative">
        {/* FIXED: Replaced raw evaluation with an img tag */}
        <img 
          src={product.image} 
          alt={product.name} 
          className="card-img-top product-image img-fluid"
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

        <p className="text-muted small mb-2">{product.brand}</p>

        <p className="product-description text-muted small mb-3">
          {product.description}
        </p>

        <div className="mt-auto">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="fw-bold fs-5 text-dark">
              {formatCurrency(discountedPrice)}
            </span>

            {product.discount > 0 ? (
              <span className="text-muted text-decoration-line-through small">
                {formatCurrency(product.price)}
              </span>
            ) : null}
          </div>

          <div className="d-grid gap-2">
            <Button
              variant="primary"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              <i className="bi bi-cart-plus me-2" />
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>

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