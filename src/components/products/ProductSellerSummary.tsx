import type { Product } from "../../types/product";

interface ProductSellerSummaryProps {
  product: Product;
}

const ProductSellerSummary = ({ product }: ProductSellerSummaryProps) => {
  return (
    <section className="pdp-seller-summary">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <h6 className="pdp-section-title mb-1">Seller Information</h6>

          <p className="mb-1 fw-bold text-dark">
            <i className="bi bi-shop me-2 text-primary" />
            {product.sellerName ?? "ShopEase Seller"}
          </p>

          <p className="text-muted small mb-0">
            Product listed and fulfilled through ShopEase marketplace.
          </p>
        </div>

        <span className="pdp-seller-rating">
          <i className="bi bi-star-fill" />
          4.5
        </span>
      </div>
    </section>
  );
};

export default ProductSellerSummary;