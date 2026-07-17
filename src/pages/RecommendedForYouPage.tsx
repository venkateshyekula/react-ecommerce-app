import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import ProductCard from "../components/products/ProductCard";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import { personalizationService } from "../services/personalizationService";
import type {
  CustomerPreferenceProfile,
  ProductRecommendationScore
} from "../types/personalization";
import type { Product } from "../types/product";

const RecommendedForYouPage = () => {
  const { currentUser } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [scoredProducts, setScoredProducts] = useState<
    ProductRecommendationScore[]
  >([]);
  const [profile, setProfile] = useState<CustomerPreferenceProfile | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadRecommendations = async (): Promise<void> => {
      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const result =
          await personalizationService.getRecommendedProductsForUser(
            currentUser.id,
            cartItems,
            24
          );

        setProducts(result.products);
        setScoredProducts(result.scoredProducts);
        setProfile(result.profile);
      } catch {
        setErrorMessage(
          "Unable to load recommendations. Please make sure JSON Server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadRecommendations();
  }, [currentUser, cartItems, navigate]);

  const reasonMap = useMemo(() => {
    return scoredProducts.reduce<Record<string, string[]>>((map, item) => {
      return {
        ...map,
        [item.product.id]: item.reasons
      };
    }, {});
  }, [scoredProducts]);

  if (isLoading) {
    return (
      <main className="recommended-page bg-light shopease-brand-page">
        <div className="container-fluid py-5">
          <Loader message="Loading recommendations..." />
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <main className="recommended-page bg-light shopease-brand-page">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">Recommended for You</h1>
              <p className="text-muted mb-0">
                Personalized products based on your activity, categories and
                brand preferences.
              </p>
            </div>

            <Link to="/products" className="btn btn-outline-primary">
              Browse All Products
            </Link>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        {errorMessage ? (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        ) : null}

        {profile ? (
          <div className="card border shadow-sm rounded-4 mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Your Shopping Preferences</h5>

              <div className="row g-3">
                <div className="col-md-4">
                  <div className="bg-light rounded-4 p-3">
                    <p className="text-muted small mb-1">Top Categories</p>
                    <h6 className="fw-bold mb-0">
                      {profile.preferredCategories.length > 0
                        ? profile.preferredCategories.join(", ")
                        : "Not enough data"}
                    </h6>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="bg-light rounded-4 p-3">
                    <p className="text-muted small mb-1">Top Brands</p>
                    <h6 className="fw-bold mb-0">
                      {profile.preferredBrands.length > 0
                        ? profile.preferredBrands.join(", ")
                        : "Not enough data"}
                    </h6>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="bg-light rounded-4 p-3">
                    <p className="text-muted small mb-1">Price Range</p>
                    <h6 className="fw-bold mb-0">
                      ₹{profile.averagePriceRange.min} - ₹
                      {profile.averagePriceRange.max}
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {products.length === 0 ? (
          <EmptyState
            title="No recommendations yet"
            message="Start exploring products, adding favorites, or placing orders to see personalized suggestions here."
            iconClassName="bi bi-stars"
            action={
              <Link to="/products" className="btn btn-primary">
                Browse Products
              </Link>
            }
          />
        ) : (
          <div className="row g-4">
            {products.map((product) => (
              <div className="col-sm-6 col-lg-3" key={product.id}>
                <ProductCard product={product} />

                {reasonMap[product.id]?.length ? (
                  <div className="recommendation-reason-card bg-white border rounded-4 p-3 mt-2">
                    <p className="small fw-bold mb-2">
                      Why recommended?
                    </p>

                    <ul className="small text-muted mb-0 ps-3">
                      {reasonMap[product.id].slice(0, 2).map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default RecommendedForYouPage;