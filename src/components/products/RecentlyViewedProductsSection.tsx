import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import {
  getRecentlyViewedProducts,
  type RecentlyViewedProduct
} from "../../utils/recentlyViewedStorage";

interface RecentlyViewedProductsSectionProps {
  currentProductId?: string;
}

const RecentlyViewedProductsSection = ({
  currentProductId
}: RecentlyViewedProductsSectionProps) => {
  const [recentProducts, setRecentProducts] = useState<RecentlyViewedProduct[]>(
    []
  );

  useEffect(() => {
    const products = getRecentlyViewedProducts().filter(
      (product) => product.id !== currentProductId
    );

    setRecentProducts(products);
  }, [currentProductId]);

  if (recentProducts.length === 0) {
    return null;
  }

  return (
    <section className="recently-viewed-section mt-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Recently Viewed</h3>
          <p className="text-muted mb-0">
            Continue browsing products you recently checked.
          </p>
        </div>
      </div>

      <div className="row g-4">
        {recentProducts.slice(0, 4).map((product) => (
          <div className="col-sm-6 col-lg-3" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewedProductsSection;