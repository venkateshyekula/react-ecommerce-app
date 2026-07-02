import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import { useCart } from "../context/useCart";
import { productService } from "../services/productService";
import type { Product } from "../types/product";
import { formatCurrency, getDiscountedPrice } from "../utils/currencyFormatter";

const ProductDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

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
          setErrorMessage("Product not found.");
          setProduct(null);
          return;
        }

        setProduct(productDetails);
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

  if (isLoading) {
    return (
      <main className="product-details-page bg-light">
        <div className="container py-5">
          <Loader message="Loading product details..." />
        </div>
      </main>
    );
  }

  if (errorMessage || !product) {
    return (
      <main className="product-details-page bg-light">
        <div className="container py-5">
          <EmptyState
            title="Product Not Found"
            message={
              errorMessage || "The product you are looking for does not exist."
            }
            action={
              <Link to="/products" className="btn btn-primary">
                Back to Products
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  const discountedPrice = getDiscountedPrice(product.price, product.discount);
  const isOutOfStock = product.stock <= 0;

  return (
    <main className="product-details-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container py-4">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-2">
              <li className="breadcrumb-item">
                <Link to="/">Home</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/products">Products</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {product.name}
              </li>
            </ol>
          </nav>

          <h1 className="fw-bold mb-0">{product.name}</h1>
        </div>
      </section>

      <section className="container py-4 py-md-5">
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="product-details-image-card bg-white rounded-4 shadow-sm p-3">
              <img
                src={product.image}
                alt={product.name}
                className="img-fluid rounded"
                
              />
            </div>
          </div>

          <div className="col-lg-7">
            <div className="bg-white rounded-4 shadow-sm p-4 p-md-5 h-100">
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className="badge bg-light text-primary border">
                  {product.category}
                </span>

                <span className="badge bg-light text-dark border">
                  {product.brand}
                </span>

                <span
                  className={`badge ${
                    isOutOfStock ? "bg-secondary" : "bg-success"
                  }`}
                >
                  {isOutOfStock ? "Out of Stock" : "In Stock"}
                </span>

                {product.discount > 0 ? (
                  <span className="badge bg-danger">
                    {product.discount}% OFF
                  </span>
                ) : null}
              </div>

              <h2 className="fw-bold mb-2">{product.name}</h2>

              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="rating-badge">
                  <i className="bi bi-star-fill text-warning me-1" />
                  {product.rating}
                </span>
                <span className="text-muted small">Customer rating</span>
              </div>

              <p className="text-muted mb-4">{product.description}</p>

              <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                <span className="display-6 fw-bold text-dark">
                  {formatCurrency(discountedPrice)}
                </span>

                {product.discount > 0 ? (
                  <span className="fs-5 text-muted text-decoration-line-through">
                    {formatCurrency(product.price)}
                  </span>
                ) : null}
              </div>

              <div className="product-stock-info bg-light rounded-4 p-3 mb-4">
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Available Stock</span>
                  <span className="fw-bold">{product.stock}</span>
                </div>
              </div>

              <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
                <Button
                  variant="primary"
                  disabled={isOutOfStock}
                  onClick={() => addToCart(product)}
                  className="px-4"
                >
                  <i className="bi bi-cart-plus me-2" />
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>

                <Link to="/cart" className="btn btn-outline-primary px-4">
                  Go to Cart
                </Link>
              </div>

              <hr />

              <h5 className="fw-bold mb-3">Specifications</h5>

              <div className="specification-list">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div
                    className="specification-row d-flex justify-content-between gap-3 py-2 border-bottom"
                    key={key}
                  >
                    <span className="text-muted">{key}</span>
                    <span className="fw-semibold text-end">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ProductDetailsPage;
