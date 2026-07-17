import { useMemo } from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import { useComparison } from "../context/useComparison";
import { formatCurrency, getDiscountedPrice } from "../utils/currencyFormatter";

const ComparePage = () => {
  const { compareItems, removeFromCompare, clearCompare } = useComparison();

  // OPTIMIZED: Memoized computation loop and added fallback to protect against crash if specifications are missing
  const allSpecificationKeys = useMemo(() => {
    return Array.from(
      new Set(
        compareItems.flatMap((product) => 
          product.specifications ? Object.keys(product.specifications) : []
        )
      )
    );
  }, [compareItems]);

  // FIXED: Integrated the imported EmptyState component correctly for low-item count states
  if (compareItems.length < 2) {
    return (
      <main className="compare-page bg-light py-5">
        <div className="container">
          <EmptyState
            title="Compare Products"
            message="Select at least two items to unlock side-by-side technical comparison details."
            action={
              <Link to="/products" className="btn btn-primary px-4 rounded-3">
                Browse Products
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main className="compare-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">Product Comparison</h1>
              <p className="text-muted mb-0">
                Compare selected products side by side.
              </p>
            </div>

            <Button variant="outline-danger" onClick={clearCompare}>
              <i className="bi bi-trash me-2" />
              Clear Comparison
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-4 py-md-5">
        <div className="compare-table-card bg-white rounded-4 shadow-sm">
          <div className="table-responsive">
            <table className="table compare-table align-middle mb-0">
              <thead>
                <tr>
                  <th className="compare-label-cell fw-bold text-secondary">Feature</th>

                  {compareItems.map((product) => (
                    <th key={product.id} style={{ minWidth: "220px" }}>
                      <div className="compare-product-heading text-center p-2">
                        {/* FIXED: Turned potential raw string path into an HTML image object structure */}
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="img-fluid rounded-3 mb-3"
                            style={{ height: "120px", objectFit: "contain" }}
                          />
                        )}

                        <h6 className="fw-bold mb-1 text-dark text-truncate">{product.name}</h6>
                        <p className="small text-muted mb-3">{product.brand}</p>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm w-100"
                          onClick={() => removeFromCompare(product.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="compare-label-cell fw-semibold">Price</td>
                  {compareItems.map((product) => (
                    <td key={`${product.id}-price`}>
                      <span className="fs-6 fw-bold text-dark">
                        {formatCurrency(
                          getDiscountedPrice(product.price, product.discount)
                        )}
                      </span>

                      {product.discount > 0 && (
                        <span className="badge bg-success-subtle text-success ms-2">
                          {product.discount}% OFF
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="compare-label-cell fw-semibold">Rating</td>
                  {compareItems.map((product) => (
                    <td key={`${product.id}-rating`}>
                      <span className="rating-badge border px-2 py-1 rounded bg-light small">
                        <i className="bi bi-star-fill text-warning me-1" />
                        {product.rating}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="compare-label-cell fw-semibold">Category</td>
                  {compareItems.map((product) => (
                    <td key={`${product.id}-category`} className="text-capitalize">
                      {product.category}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="compare-label-cell fw-semibold">Stock</td>
                  {compareItems.map((product) => (
                    <td key={`${product.id}-stock`}>
                      <span
                        className={`badge ${
                          product.stock <= 0 ? "bg-danger-subtle text-danger" : "bg-success-subtle text-success"
                        }`}
                      >
                        {product.stock <= 0
                          ? "Out of Stock"
                          : `${product.stock} Units`}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="compare-label-cell fw-semibold">Seller</td>
                  {compareItems.map((product) => (
                    <td key={`${product.id}-seller`}>
                      {product.sellerName ?? "-"}
                    </td>
                  ))}
                </tr>

                {/* Dynamic Specifications Mapping Fields */}
                {allSpecificationKeys.map((specificationKey) => (
                  <tr key={specificationKey}>
                    <td className="compare-label-cell text-muted text-capitalize">{specificationKey}</td>

                    {compareItems.map((product) => (
                      <td key={`${product.id}-${specificationKey}`}>
                        {product.specifications?.[specificationKey] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ComparePage;