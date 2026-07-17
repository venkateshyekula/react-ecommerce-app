import { useState, useEffect } from "react";
import {
  formatCurrency,
  getDiscountedPrice,
} from "../../utils/currencyFormatter";
import { Link, useNavigate } from "react-router-dom";
import Button from "../common/Button";
import ProductSizeChart from "./ProductSizeChart";
import ProductSizeSelector from "./ProductSizeSelector";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";
import type { Product } from "../../types/product";


interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

const sizeRequiredCategories = ["Clothing", "Footwear", "Accessories"];

const QuickViewModal = ({ product, onClose }: QuickViewModalProps) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [sizeError, setSizeError] = useState<string>("");
  const [isSizeChartOpen, setIsSizeChartOpen] = useState<boolean>(false);

  const userRole = currentUser?.role;

  const canUseShoppingFeatures =
    !currentUser || userRole === "CUSTOMER" || userRole === "ADMIN";

  const canUseWishlist =
    Boolean(currentUser) && (userRole === "CUSTOMER" || userRole === "ADMIN");

  const isSizeRequired = sizeRequiredCategories.includes(product.category);
  const isOutOfStock = product.stock <= 0;
  const isWishlisted = isInWishlist(product.id);
  const discountedPrice = getDiscountedPrice(product.price, product.discount);

  // ADDED: Global keyboard accessibility listener to dismiss modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // ADDED: Backdrop overlay click handling to dismiss when clicking outside the content window
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const validateSelectedSize = (): boolean => {
    if (isSizeRequired && product.sizeOptions?.length && !selectedSize) {
      setSizeError("Please select a size.");
      return false;
    }

    setSizeError("");
    return true;
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

  return (
    <>
      {/* FIXED: Added background layout dismiss target and key handlers */}
      <div 
        className="quick-view-overlay fixed-top w-100 h-100 d-flex align-items-center justify-content-center p-3" 
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
        role="dialog" 
        aria-modal="true"
        onClick={handleBackdropClick}
      >
        <div className="quick-view-modal bg-white rounded-4 shadow-lg w-100" style={{ maxWidth: "800px", overflow: "hidden" }}>
          <div className="quick-view-header border-bottom p-3 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold mb-1 text-dark">Quick View</h5>
              <p className="text-muted small mb-0">
                Preview product details and actions.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-light rounded-circle p-2"
              onClick={onClose}
              aria-label="Close quick view"
              style={{ width: "40px", height: "40px" }}
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div className="quick-view-body p-4" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
            <div className="row g-4">
              <div className="col-md-5">
                <div className="quick-view-image-wrapper bg-light rounded-3 p-3 position-relative d-flex align-items-center justify-content-center" style={{ height: "300px" }}>
                  {/* FIXED: Explicit structural rendering rule for string URL properties */}
                  {product.image && (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="img-fluid object-fit-contain h-100"
                    />
                  )}

                  {product.discount > 0 && (
                    <span className="badge bg-danger position-absolute top-0 start-0 m-3 fs-6">
                      {product.discount}% OFF
                    </span>
                  )}
                </div>
              </div>

              <div className="col-md-7">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <span className="badge bg-light text-primary border text-capitalize">
                    {product.category}
                  </span>

                  <span className="badge bg-light text-dark border">
                    {product.brand}
                  </span>

                  {product.sellerName && (
                    <span className="badge bg-light text-secondary border">
                      Sold by {product.sellerName}
                    </span>
                  )}
                </div>

                <h4 className="fw-bold mb-2 text-dark">{product.name}</h4>

                <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 small d-flex align-items-center">
                    <i className="bi bi-star-fill me-1" />
                    {product.rating}
                  </span>

                  <span
                    className={`badge ${
                      isOutOfStock ? "bg-danger-subtle text-danger" : "bg-success-subtle text-success"
                    }`}
                  >
                    {isOutOfStock ? "Out of Stock" : "In Stock"}
                  </span>
                </div>

                <p className="text-muted small mb-4">{product.description}</p>

                <div className="d-flex align-items-center flex-wrap gap-2 mb-4">
                  <span className="fs-3 fw-bold text-dark">
                    {formatCurrency(discountedPrice)}
                  </span>

                  {product.discount > 0 && (
                    <>
                      <span className="text-muted text-decoration-line-through ms-1 small">
                        {formatCurrency(product.price)}
                      </span>

                      <span className="text-success small fw-bold ms-1">
                        Save {product.discount}%
                      </span>
                    </>
                  )}
                </div>

                {/* FIXED: Wrapped selector in conditional block to hide sizing on non-clothing/footwear goods */}
                {isSizeRequired && product.sizeOptions && product.sizeOptions.length > 0 && (
                  <div className="mb-4">
                    <ProductSizeSelector
                      product={product}
                      selectedSize={selectedSize}
                      errorMessage={sizeError}
                      onSizeChange={(size) => {
                        setSelectedSize(size);
                        setSizeError("");
                      }}
                      onOpenSizeChart={() => setIsSizeChartOpen(true)}
                    />
                  </div>
                )}

                <div className="d-flex flex-column gap-2 mb-3">
                  {canUseShoppingFeatures && (
                    <div className="d-flex flex-wrap gap-2 w-100">
                      <Button
                        variant="primary"
                        disabled={isOutOfStock}
                        onClick={handleAddToCart}
                        className="flex-grow-1 py-2 rounded-3"
                      >
                        <i className="bi bi-cart-plus me-2" />
                        Add to Cart
                      </Button>

                      <Button
                        variant="success"
                        disabled={isOutOfStock}
                        onClick={handleBuyNow}
                        className="flex-grow-1 py-2 rounded-3"
                      >
                        <i className="bi bi-lightning-charge me-2" />
                        Buy Now
                      </Button>

                      {canUseWishlist && (
                        <Button
                          variant={isWishlisted ? "danger" : "outline-danger"}
                          onClick={() => toggleWishlist(product)}
                          className="px-3 rounded-3"
                        >
                          <i className={isWishlisted ? "bi bi-heart-fill" : "bi bi-heart"} />
                        </Button>
                      )}
                    </div>
                  )}

                  <Link
                    to={`/products/${product.id}`}
                    className="btn btn-outline-primary w-100 py-2 rounded-3 mt-1 text-center d-flex align-items-center justify-content-center gap-2"
                    onClick={onClose}
                  >
                    View Full Details
                    <i className="bi bi-arrow-right" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSizeChartOpen && product.sizeChart ? (
        <ProductSizeChart
          sizeChart={product.sizeChart}
          onClose={() => setIsSizeChartOpen(false)}
        />
      ) : null}
    </>
  );
};

export default QuickViewModal;