import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ProductCard from "../components/products/ProductCard";
import ProductDeliveryChecker from "../components/products/ProductDeliveryChecker";
import ProductHighlights from "../components/products/ProductHighlights";
import ProductImageGallery from "../components/products/ProductImageGallery";
import ProductReviews from "../components/products/ProductReviews";
import ProductSizeChart from "../components/products/ProductSizeChart";
import ProductSizeSelector from "../components/products/ProductSizeSelector";
import ProductOffersPanel from "../components/products/ProductOffersPanel";
import ProductSellerSummary from "../components/products/ProductSellerSummary";
import ProductTrustHighlights from "../components/products/ProductTrustHighlights";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import { useWishlist } from "../context/useWishlist";
import { productService } from "../services/productService";
import type { Product } from "../types/product";
import { formatCurrency, getDiscountedPrice } from "../utils/currencyFormatter";
import RecentlyViewedProductsSection from "../components/products/RecentlyViewedProductsSection";
import RecommendedProductsSection from "../components/products/RecommendedProductsSection";
import { saveRecentlyViewedProduct } from "../utils/recentlyViewedStorage";
import ProductComparisonDetails from "../components/products/ProductComparisonDetails";
import ProductQuestions from "../components/products/ProductQuestions";
import ProductDetailsTabs, {
  type ProductDetailsTab,
} from "../components/products/ProductDetailsTabs";
import ProductSizeRecommendationCard from "../components/products/ProductSizeRecommendationCard";

const ProductDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<ProductDetailsTab>("description");

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [sizeError, setSizeError] = useState<string>("");
  const [isSizeChartOpen, setIsSizeChartOpen] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const userRole = currentUser?.role;

  const canUseShoppingFeatures =
    !currentUser || userRole === "CUSTOMER" || userRole === "ADMIN";

  const canUseWishlist =
    Boolean(currentUser) && (userRole === "CUSTOMER" || userRole === "ADMIN");

  useEffect(() => {
    const loadProduct = async (): Promise<void> => {
      if (!id) {
        setErrorMessage("Product ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const productDetails = await productService.getProductById(id);

        if (!productDetails) {
          setProduct(null);
          setErrorMessage("Product not found.");
          return;
        }

        setProduct(productDetails);
        saveRecentlyViewedProduct(productDetails);
        setSelectedSize("");
        setSizeError("");
        setIsSizeChartOpen(false);

        const allProducts = await productService.getProducts();

        const relatedProducts = allProducts
          .filter(
            (item) =>
              item.category === productDetails.category &&
              item.id !== productDetails.id,
          )
          .slice(0, 4);

        setSimilarProducts(relatedProducts);
      } catch {
        setErrorMessage(
          "Unable to load product details. Please make sure JSON Server is running.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadProduct();
  }, [id]);

  const productHighlights = useMemo(() => {
    if (!product) return [];
    return Object.entries(product.specifications).slice(0, 5);
  }, [product]);

  if (isLoading) {
    return (
      <main className="product-details-page bg-light">
        <div className="container-fluid py-5">
          <Loader message="Loading product details..." />
        </div>
      </main>
    );
  }

  // FIXED: Render actual error message to give user visual feedback
  if (errorMessage || !product) {
    return (
      <main className="product-details-page bg-light">
        <div className="container-fluid py-5 text-center">
          <div
            className="alert alert-warning max-w-md mx-auto mb-4"
            role="alert"
          >
            <i className="bi bi-exclamation-triangle-fill me-2" />
            {errorMessage || "Product data is unavailable."}
          </div>
          <Link to="/products" className="btn btn-primary">
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  const discountedPrice = getDiscountedPrice(product.price, product.discount);
  const isOutOfStock = product.stock <= 0;
  const isWishlisted = isInWishlist(product.id);

  // OPTIMIZED: Drop hardcoded string categories in favor of checking dynamic array presence
  const isSizeRequired = Boolean(
    product.sizeOptions && product.sizeOptions.length > 0,
  );

  const validateSelectedSize = (): boolean => {
    if (isSizeRequired && !selectedSize) {
      setSizeError("Please select a size.");
      return false;
    }

    setSizeError("");
    return true;
  };

  const handleAddToCart = (): void => {
    if (isOutOfStock || !canUseShoppingFeatures) return;
    if (!validateSelectedSize()) return;

    // Bypasses excess property check by asserting as Product
    //const cartItem = (isSizeRequired ? { ...product, selectedSize } : product) as Product;
    //addToCart(cartItem);
    addToCart(product, selectedSize || undefined);
  };

  const handleBuyNow = (): void => {
    if (isOutOfStock || !canUseShoppingFeatures) return;
    if (!validateSelectedSize()) return;

    // Bypasses excess property check by asserting as Product
    //const cartItem = (isSizeRequired ? { ...product, selectedSize } : product) as Product;
    //addToCart(cartItem);
    addToCart(product, selectedSize || undefined);
    navigate("/cart");
  };

  const handleWishlistClick = (): void => {
    if (canUseWishlist) {
      toggleWishlist(product);
    }
  };

  return (
    <main className="product-details-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-2">
              <li className="breadcrumb-item">
                <Link to="/">Home</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/products">Products</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`/categories/${product.category}`}>
                  {product.category}
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {product.name}
              </li>
            </ol>
          </nav>
        </div>
      </section>

      <section className="container-fluid py-4 ">
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="product-details-gallery-sticky">
              <ProductImageGallery product={product} />
            </div>
          </div>

          <div className="col-lg-7">
            <div className="bg-white p-4 p-md-5 product-details-info-card">
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className="badge bg-light text-primary border">
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
                <span
                  className={`badge ${isOutOfStock ? "bg-secondary" : "bg-success"}`}
                >
                  {isOutOfStock ? "Out of Stock" : "In Stock"}
                </span>
                {product.discount > 0 && (
                  <span className="badge bg-danger">
                    {product.discount}% OFF
                  </span>
                )}
              </div>

              <h2 className="fw-bold mb-2">{product.name}</h2>

              <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
                <span className="rating-badge">
                  <i className="bi bi-star-fill text-warning me-1" />
                  {product.rating}
                </span>
                <span className="text-muted small">
                  {Math.max(120, Math.round(product.rating * 485))} ratings
                </span>
              </div>

              <p className="text-muted mb-4">{product.description}</p>

              <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                <span className="display-6 fw-bold text-dark">
                  {formatCurrency(discountedPrice)}
                </span>
                {product.discount > 0 && (
                  <>
                    <span className="fs-5 text-muted text-decoration-line-through">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-success fw-bold">
                      You save {formatCurrency(product.price - discountedPrice)}
                    </span>
                  </>
                )}
              </div>

              <div className="product-stock-info bg-light rounded-4 p-3 mb-4">
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Available Stock</span>
                  <span className="fw-bold">{product.stock}</span>
                </div>
              </div>

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

              <ProductSizeRecommendationCard
                product={product}
                onSelectSize={(size) => {
                  setSelectedSize(size);
                  setSizeError("");
                }}
              />

              {canUseShoppingFeatures ? (
                <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
                  <Button
                    variant="primary"
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    className="px-4"
                  >
                    <i className="bi bi-cart-plus me-2" />
                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                  </Button>

                  <Button
                    variant="success"
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className="px-4"
                  >
                    <i className="bi bi-lightning-charge me-2" />
                    Buy Now
                  </Button>

                  {canUseWishlist && (
                    <Button
                      variant={isWishlisted ? "danger" : "outline-danger"}
                      onClick={handleWishlistClick}
                      className="px-4"
                    >
                      <i
                        className={`bi ${isWishlisted ? "bi-heart-fill" : "bi-heart"} me-2`}
                      />
                      {isWishlisted ? "Wishlisted" : "Wishlist"}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="alert alert-info mb-4" role="alert">
                  <i className="bi bi-info-circle me-2" />
                  Shopping actions are available only for customer and admin
                  accounts.
                </div>
              )}

              <ProductHighlights product={product} />

              <div className="product-details-marketplace-panels mt-4">
                <div className="product-offers-panel">
                  <ProductOffersPanel product={product} />
                </div>

                <div>
                  <ProductDeliveryChecker product={product} />
                </div>

                <div className="product-seller-panel">
                  <ProductSellerSummary product={product} />
                </div>

                <div className="product-trust-panel">
                  <ProductTrustHighlights />
                </div>
              </div>

              {productHighlights.length > 0 && (
                <div className="product-key-highlights mt-4">
                  <h5 className="fw-bold mb-3">Key Highlights</h5>
                  <div className="row g-3">
                    {productHighlights.map(([key, value]) => (
                      <div className="col-sm-6" key={key}>
                        <div className="key-highlight-item bg-light rounded-4 p-3">
                          <p className="small text-muted mb-1">{key}</p>
                          <h6 className="fw-bold mb-0">{value}</h6>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 p-md-5 mt-4 product-details-tabs-card">
          <ProductDetailsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {activeTab === "description" && (
            <div
              id="product-description-panel"
              role="tabpanel"
              aria-labelledby="product-description-tab"
            >
              <h4 className="fw-bold mb-3">Product Description</h4>
              <p className="text-muted mb-0">{product.description}</p>
            </div>
          )}

          {activeTab === "specifications" && (
            <div
              id="product-specifications-panel"
              role="tabpanel"
              aria-labelledby="product-specifications-tab"
            >
              <h4 className="fw-bold mb-3">Specifications</h4>
              <div className="specification-list">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div
                    className="specification-row d-flex justify-content-between gap-3 py-3 border-bottom"
                    key={key}
                  >
                    <span className="text-muted">{key}</span>
                    <span className="fw-semibold text-end">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div
              id="product-reviews-panel"
              role="tabpanel"
              aria-labelledby="product-reviews-tab"
            >
              <h4 className="fw-bold mb-4">Ratings and Reviews</h4>
              <ProductReviews product={product} />
            </div>
          )}
          {activeTab === "questions" ? (
            <div
              id="product-questions-panel"
              role="tabpanel"
              aria-labelledby="product-questions-tab"
            >
              <h4 className="fw-bold mb-4">Product Questions & Answers</h4>
              <ProductQuestions product={product} />
            </div>
          ) : null}
        </div>

        <ProductComparisonDetails product={product} />

        {similarProducts.length > 0 && (
          <div className="similar-products-section mt-5">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
              <div>
                <h3 className="fw-bold mb-1">Similar Products</h3>
                <p className="text-muted mb-0">
                  More products from {product.category}.
                </p>
              </div>
              <Link
                to={`/categories/${product.category}`}
                className="btn btn-outline-primary"
              >
                View All
              </Link>
            </div>

            <div className="row g-4">
              {similarProducts.map((similarProduct) => (
                <div className="col-sm-6 col-lg-3" key={similarProduct.id}>
                  <ProductCard product={similarProduct} />
                </div>
              ))}
            </div>
          </div>
        )}
        <RecommendedProductsSection product={product} />
        <RecentlyViewedProductsSection currentProductId={product.id} />
      </section>

      {isSizeChartOpen && product.sizeChart && (
        <ProductSizeChart
          sizeChart={product.sizeChart}
          onClose={() => setIsSizeChartOpen(false)}
        />
      )}
    </main>
  );
};

export default ProductDetailsPage;
