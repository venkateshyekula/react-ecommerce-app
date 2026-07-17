import { useEffect, useMemo, useState } from "react";
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

interface ViewSimilarModalProps {
  product: Product;
  onClose: () => void;
}

const MAX_SIMILAR_PRODUCTS = 8;

const isImageUrl = (image: string): boolean => {
  return (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:image/")
  );
};

const getRatingCount = (rating: number): string => {
  const count = Math.max(120, Math.round(rating * 485));

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }

  return String(count);
};

const ViewSimilarModal = ({ product, onClose }: ViewSimilarModalProps) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let active = true;

    const loadSimilarProducts = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const categoryProducts = await productService.getProductsByCategory(
          product.category
        );

        // Guard against updating state if the component updated or unmounted
        if (!active) return;

        const filteredProducts = categoryProducts
          .filter((item) => item.id !== product.id)
          .sort((firstProduct, secondProduct) => {
            const firstBrandScore = firstProduct.brand === product.brand ? 1 : 0;
            const secondBrandScore =
              secondProduct.brand === product.brand ? 1 : 0;

            if (secondBrandScore !== firstBrandScore) {
              return secondBrandScore - firstBrandScore;
            }

            if (secondProduct.rating !== firstProduct.rating) {
              return secondProduct.rating - firstProduct.rating;
            }

            return secondProduct.discount - firstProduct.discount;
          })
          .slice(0, MAX_SIMILAR_PRODUCTS);

        setSimilarProducts(filteredProducts);
      } catch {
        if (active) {
          setErrorMessage(
            "Unable to load similar products. Please make sure JSON Server is running."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadSimilarProducts();

    return () => {
      active = false;
    };
  }, [product]);

  const modalTitle = useMemo(() => {
    return `Similar ${product.category} Products`;
  }, [product.category]);

  return (
    <div className="view-similar-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      {/* Stop propagation so clicking inside the modal content box doesn't trip onClose */}
      <div className="view-similar-modal bg-white rounded-4 shadow-sm" onClick={(e) => e.stopPropagation()}>
        <div className="view-similar-header border-bottom">
          <div>
            <h5 className="fw-bold mb-1">{modalTitle}</h5>
            <p className="small text-muted mb-0">
              Products similar to <strong>{product.name}</strong>.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-light rounded-circle view-similar-close"
            onClick={onClose}
            aria-label="Close similar products modal"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="view-similar-body">
          {isLoading ? <Loader message="Loading similar products..." /> : null}

          {!isLoading && errorMessage ? (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && !errorMessage && similarProducts.length === 0 ? (
            <div className="view-similar-empty bg-light rounded-4 p-4 text-center">
              <i className="bi bi-box-seam" />
              <h6 className="fw-bold mt-3 mb-1">No similar products found</h6>
              <p className="text-muted mb-0">
                There are no other products available in this category yet.
              </p>
            </div>
          ) : null}

          {!isLoading && !errorMessage && similarProducts.length > 0 ? (
            <div className="view-similar-grid">
              {similarProducts.map((similarProduct) => {
                const discountedPrice = getDiscountedPrice(
                  similarProduct.price,
                  similarProduct.discount
                );

                const hasSizeOptions = Boolean(
                  similarProduct.sizeOptions?.length
                );

                const isOutOfStock = similarProduct.stock <= 0;
                const isWishlisted = isInWishlist(similarProduct.id);

                return (
                  <article
                    className="view-similar-card"
                    key={similarProduct.id}
                  >
                    <div className="view-similar-card-media">
                      <Link
                        to={`/products/${similarProduct.id}`}
                        onClick={onClose}
                        className="view-similar-image-link"
                      >
                        {isImageUrl(similarProduct.image) ? (
                          <img 
                            src={similarProduct.image} 
                            alt={similarProduct.name} 
                            className="view-similar-image"
                            loading="lazy"
                          />
                        ) : (
                          <div className="view-similar-image-placeholder">
                            <span>{similarProduct.image}</span>
                          </div>
                        )}
                      </Link>

                      {similarProduct.discount > 0 ? (
                        <span className="view-similar-discount">
                          {similarProduct.discount}% OFF
                        </span>
                      ) : null}

                      <button
                        type="button"
                        className={`view-similar-wishlist ${
                          isWishlisted ? "active" : ""
                        }`}
                        onClick={() => toggleWishlist(similarProduct)}
                        aria-label={
                          isWishlisted
                            ? `Remove ${similarProduct.name} from wishlist`
                            : `Add ${similarProduct.name} to wishlist`
                        }
                      >
                        <i
                          className={
                            isWishlisted ? "bi bi-heart-fill" : "bi bi-heart"
                          }
                        />
                      </button>

                      <div className="view-similar-rating">
                        <i className="bi bi-star-fill" />
                        <span>{similarProduct.rating}</span>
                        <span>|</span>
                        <span>{getRatingCount(similarProduct.rating)}</span>
                      </div>
                    </div>

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
                        className="view-similar-title"
                      >
                        {similarProduct.name}
                      </Link>

                      {similarProduct.sizeOptions?.length ? (
                        <p className="view-similar-sizes mb-2">
                          Sizes:{" "}
                          <strong>
                            {similarProduct.sizeOptions.slice(0, 4).join(", ")}
                          </strong>
                        </p>
                      ) : null}

                      <div className="view-similar-price-row">
                        <span className="view-similar-current-price">
                          {formatCurrency(discountedPrice)}
                        </span>

                        {similarProduct.discount > 0 ? (
                          <>
                            <span className="view-similar-original-price">
                              {formatCurrency(similarProduct.price)}
                            </span>

                            <span className="view-similar-save">
                              Save {similarProduct.discount}%
                            </span>
                          </>
                        ) : null}
                      </div>

                      {hasSizeOptions ? (
                        <Link
                          to={`/products/${similarProduct.id}`}
                          onClick={onClose}
                          className="btn btn-primary view-similar-action"
                        >
                          Select Size
                        </Link>
                      ) : (
                        <Button
                          variant="primary"
                          className="view-similar-action"
                          disabled={isOutOfStock}
                          onClick={() => addToCart(similarProduct)}
                        >
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