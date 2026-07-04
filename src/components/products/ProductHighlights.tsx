import type { Product } from "../../types/product";
import { formatCurrency, getDiscountedPrice } from "../../utils/currencyFormatter";

interface ProductHighlightsProps {
  product: Product;
}

const ProductHighlights = ({ product }: ProductHighlightsProps) => {
  const discountedPrice = getDiscountedPrice(product.price, product.discount);
  const savedAmount = product.price - discountedPrice;

  return (
    <div className="product-highlights-grid">
      <div className="product-highlight-box">
        <i className="bi bi-patch-check text-success" />
        <div>
          <span className="highlight-label">Quality</span>
          <strong>Verified Product</strong>
        </div>
      </div>

      <div className="product-highlight-box">
        <i className="bi bi-arrow-repeat text-primary" />
        <div>
          <span className="highlight-label">Returns</span>
          <strong>7-Day Easy Return</strong>
        </div>
      </div>

      <div className="product-highlight-box">
        <i className="bi bi-truck text-warning" />
        <div>
          <span className="highlight-label">Delivery</span>
          <strong>Fast Delivery</strong>
        </div>
      </div>

      <div className="product-highlight-box">
        <i className="bi bi-wallet2 text-danger" />
        <div>
          <span className="highlight-label">Savings</span>
          <strong>{formatCurrency(savedAmount)}</strong>
        </div>
      </div>
    </div>
  );
};

export default ProductHighlights;