import type { Product } from "../../types/product";

interface ProductSizeSelectorProps {
  product: Product;
  selectedSize: string;
  errorMessage?: string;
  onSizeChange: (size: string) => void;
  onOpenSizeChart: () => void;
}

const sizeRequiredCategories = ["Clothing", "Footwear", "Accessories"];

const ProductSizeSelector = ({
  product,
  selectedSize,
  errorMessage,
  onSizeChange,
  onOpenSizeChart
}: ProductSizeSelectorProps) => {
  const isSizeRequired = sizeRequiredCategories.includes(product.category);

  if (!isSizeRequired || !product.sizeOptions?.length) {
    return null;
  }

  return (
    <div className="product-size-selector mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h6 className="fw-bold mb-0">Select Size</h6>
          <p className="small text-muted mb-0">
            Choose your preferred size before adding to cart.
          </p>
        </div>

        {product.sizeChart ? (
          <button
            type="button"
            className="btn btn-link p-0 fw-bold text-decoration-none"
            onClick={onOpenSizeChart}
          >
            Size Chart
          </button>
        ) : null}
      </div>

      <div className="product-size-options">
        {product.sizeOptions.map((size) => (
          <button
            key={size}
            type="button"
            className={`product-size-pill ${
              selectedSize === size ? "active" : ""
            }`}
            onClick={() => onSizeChange(size)}
          >
            {size}
          </button>
        ))}
      </div>

      {errorMessage ? (
        <p className="text-danger small fw-semibold mt-2 mb-0">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export default ProductSizeSelector;