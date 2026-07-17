import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import Loader from "../common/Loader";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import { personalizationService } from "../../services/personalizationService";
import type { Product } from "../../types/product";

interface PersonalizedRecommendationsSectionProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  showViewAllLink?: boolean;
}

const PersonalizedRecommendationsSection = ({
  title = "Recommended for You",
  subtitle = "Personalized picks based on your shopping activity.",
  limit = 8,
  showViewAllLink = true
}: PersonalizedRecommendationsSectionProps) => {
  const { currentUser } = useAuth();
  const { cartItems } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadRecommendations = async (): Promise<void> => {
      try {
        setIsLoading(true);

        if (currentUser) {
          const result =
            await personalizationService.getRecommendedProductsForUser(
              currentUser.id,
              cartItems,
              limit
            );

          setProducts(result.products);
          return;
        }

        const allProducts =
          await personalizationService.getRecommendationsFromProducts([], limit);

        setProducts(allProducts);
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRecommendations();
  }, [currentUser, cartItems, limit]);

  if (isLoading) {
    return (
      <section className="personalized-recommendations-section my-5">
        <Loader message="Loading recommendations..." />
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="personalized-recommendations-section my-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">{title}</h3>
          <p className="text-muted mb-0">{subtitle}</p>
        </div>

        {showViewAllLink ? (
          <Link to="/recommended" className="btn btn-outline-primary">
            View All
          </Link>
        ) : null}
      </div>

      <div className="row g-4">
        {products.map((product) => (
          <div className="col-sm-6 col-lg-3" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PersonalizedRecommendationsSection;