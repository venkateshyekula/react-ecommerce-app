import { useEffect, useMemo, useState } from "react";
import Loader from "../common/Loader";
import ProductCard from "./ProductCard";
import { productService } from "../../services/productService";
import type { Product } from "../../types/product";

interface RecommendedProductsSectionProps {
  product: Product;
}

const RecommendedProductsSection = ({
  product
}: RecommendedProductsSectionProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadProducts = async (): Promise<void> => {
      try {
        setIsLoading(true);

        const productList = await productService.getProducts();
        setProducts(productList);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProducts();
  }, []);

  const recommendedProducts = useMemo(() => {
    const sameCategoryProducts = products.filter(
      (item) => item.category === product.category && item.id !== product.id
    );

    const sameBrandProducts = products.filter(
      (item) => item.brand === product.brand && item.id !== product.id
    );

    const topRatedProducts = products.filter((item) => item.id !== product.id);

    const combinedProducts = [
      ...sameCategoryProducts,
      ...sameBrandProducts,
      ...topRatedProducts.sort(
        (firstProduct, secondProduct) =>
          secondProduct.rating - firstProduct.rating
      )
    ];

    const uniqueProducts = new Map<string, Product>();

    combinedProducts.forEach((item) => {
      if (!uniqueProducts.has(item.id)) {
        uniqueProducts.set(item.id, item);
      }
    });

    return Array.from(uniqueProducts.values()).slice(0, 4);
  }, [products, product]);

  if (isLoading) {
    return (
      <section className="recommended-products-section mt-5">
        <Loader message="Loading recommendations..." />
      </section>
    );
  }

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <section className="recommended-products-section mt-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Recommended for You</h3>
          <p className="text-muted mb-0">
            Products selected based on this product&apos;s category, brand, and
            rating.
          </p>
        </div>
      </div>

      <div className="row g-4">
        {recommendedProducts.map((recommendedProduct) => (
          <div className="col-sm-6 col-lg-3" key={recommendedProduct.id}>
            <ProductCard product={recommendedProduct} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendedProductsSection;