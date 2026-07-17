import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../common/Loader";
import { productService } from "../../services/productService";
import type { Product } from "../../types/product";
import {
  formatCurrency,
  getDiscountedPrice,
} from "../../utils/currencyFormatter";

interface ProductComparisonDetailsProps {
  product: Product;
}

const MAX_INLINE_COMPARE_PRODUCTS = 4;

const ProductComparisonDetails = ({
  product,
}: ProductComparisonDetailsProps) => {
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadCategoryProducts = async (): Promise<void> => {
      try {
        setIsLoading(true);

        const products = await productService.getProductsByCategory(
          product.category,
        );

        setCategoryProducts(products);
      } finally {
        setIsLoading(false);
      }
    };

    void loadCategoryProducts();
  }, [product.category]);

  const comparisonProducts = useMemo(() => {
    const similarProducts = categoryProducts
      .filter((item) => item.id !== product.id)
      .sort((firstProduct, secondProduct) => {
        const firstSameBrandScore =
          firstProduct.brand === product.brand ? 1 : 0;
        const secondSameBrandScore =
          secondProduct.brand === product.brand ? 1 : 0;

        if (secondSameBrandScore !== firstSameBrandScore) {
          return secondSameBrandScore - firstSameBrandScore;
        }

        return secondProduct.rating - firstProduct.rating;
      })
      .slice(0, MAX_INLINE_COMPARE_PRODUCTS - 1);

    return [product, ...similarProducts];
  }, [categoryProducts, product]);

  const allSpecificationKeys = useMemo(() => {
    return Array.from(
      new Set(
        comparisonProducts.flatMap((item) =>
          Object.keys(item.specifications ?? {}),
        ),
      ),
    );
  }, [comparisonProducts]);

  if (isLoading) {
    return (
      <section className="product-inline-comparison mt-4">
        <div className="product-inline-comparison-card bg-white p-4 p-md-5">
          <Loader message="Loading product comparison..." />
        </div>
      </section>
    );
  }

  if (comparisonProducts.length < 2) {
    return (
      <section className="product-inline-comparison mt-4">
        <div className="product-inline-comparison-card bg-white p-4 p-md-5">
          <div className="inline-compare-empty bg-light rounded-4 p-4">
            <div className="d-flex align-items-start gap-3">
              <div className="inline-compare-empty-icon">
                <i className="bi bi-columns-gap" />
              </div>

              <div>
                <h5 className="fw-bold mb-1">
                  No similar products found for comparison
                </h5>
                <p className="text-muted mb-0">
                  This product does not currently have enough products in the
                  same category to generate a side-by-side comparison.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="product-inline-comparison mt-4">
      <div className="product-inline-comparison-card bg-white p-4 p-md-5">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <h3 className="fw-bold mb-1">Compare Similar Products</h3>
            <p className="text-muted mb-0">
              Automatically comparing this product with similar products from{" "}
              <strong>{product.category}</strong>.
            </p>
          </div>

          <Link
            to={`/categories/${product.category}`}
            className="btn btn-outline-primary"
          >
            View More {product.category}
            <i className="bi bi-arrow-right ms-2" />
          </Link>
        </div>

        <div className="inline-compare-table-wrapper">
          <div className="table-responsive">
            <table className="table inline-compare-table align-middle mb-0">
              <thead>
                <tr>
                  <th className="inline-compare-label-cell">Feature</th>

                  {comparisonProducts.map((item) => (
                    <th key={item.id}>
                      <div className="inline-compare-product-heading">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="img-fluid"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-image.png";
                          }}
                        />

                        <h6 className="fw-bold mb-1">{item.name}</h6>

                        <p className="small text-muted mb-2">{item.brand}</p>

                        {item.id === product.id ? (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                            Current Product
                          </span>
                        ) : (
                          <Link
                            to={`/products/${item.id}`}
                            className="btn btn-outline-primary btn-sm"
                          >
                            View Product
                          </Link>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="inline-compare-label-cell">Price</td>

                  {comparisonProducts.map((item) => {
                    const discountedPrice = getDiscountedPrice(
                      item.price,
                      item.discount,
                    );

                    return (
                      <td key={`${item.id}-price`}>
                        <strong>{formatCurrency(discountedPrice)}</strong>

                        {item.discount > 0 ? (
                          <div className="small mt-1">
                            <span className="text-muted text-decoration-line-through me-2">
                              {formatCurrency(item.price)}
                            </span>

                            <span className="text-success fw-bold">
                              {item.discount}% OFF
                            </span>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="inline-compare-label-cell">Rating</td>

                  {comparisonProducts.map((item) => (
                    <td key={`${item.id}-rating`}>
                      <span className="rating-badge">
                        <i className="bi bi-star-fill text-warning me-1" />
                        {item.rating}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="inline-compare-label-cell">Brand</td>

                  {comparisonProducts.map((item) => (
                    <td key={`${item.id}-brand`}>{item.brand}</td>
                  ))}
                </tr>

                <tr>
                  <td className="inline-compare-label-cell">Category</td>

                  {comparisonProducts.map((item) => (
                    <td key={`${item.id}-category`}>{item.category}</td>
                  ))}
                </tr>

                <tr>
                  <td className="inline-compare-label-cell">Stock</td>

                  {comparisonProducts.map((item) => (
                    <td key={`${item.id}-stock`}>
                      <span
                        className={`badge ${
                          item.stock <= 0 ? "bg-danger" : "bg-success"
                        }`}
                      >
                        {item.stock <= 0
                          ? "Out of Stock"
                          : `${item.stock} available`}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="inline-compare-label-cell">Seller</td>

                  {comparisonProducts.map((item) => (
                    <td key={`${item.id}-seller`}>{item.sellerName ?? "-"}</td>
                  ))}
                </tr>

                <tr>
                  <td className="inline-compare-label-cell">Size Options</td>

                  {comparisonProducts.map((item) => (
                    <td key={`${item.id}-sizes`}>
                      {item.sizeOptions?.length
                        ? item.sizeOptions.join(", ")
                        : "-"}
                    </td>
                  ))}
                </tr>

                {allSpecificationKeys.map((specificationKey) => (
                  <tr key={specificationKey}>
                    <td className="inline-compare-label-cell">
                      {specificationKey}
                    </td>

                    {comparisonProducts.map((item) => (
                      <td key={`${item.id}-${specificationKey}`}>
                        {item.specifications?.[specificationKey] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductComparisonDetails;
