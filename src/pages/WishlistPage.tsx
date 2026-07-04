import { Link } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Button from "../components/common/Button";
import ProductCard from "../components/products/ProductCard";
import { useWishlist } from "../context/useWishlist";

const WishlistPage = () => {
  const {
    wishlistItems,
    wishlistCount,
    clearWishlist
  } = useWishlist();

  return (
    <main className="wishlist-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">My Wishlist</h1>
              <p className="text-muted mb-0">
                Your shortlisted products are saved here.
              </p>
            </div>

            <Link to="/products" className="btn btn-outline-primary">
              <i className="bi bi-bag me-2" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-4 py-md-5">
        {/* FIXED: Reconstructed the broken EmptyState component tags cleanly */}
        {wishlistItems.length === 0 ? (
          <EmptyState
            title="Your Wishlist is Empty"
            message="You haven't saved any products yet. Explore our marketplace to compile your favorite items!"
            action={
              <Link to="/products" className="btn btn-primary">
                Browse Products
              </Link>
            }
          />
        ) : (
          <>
            <div className="bg-white rounded-4 shadow-sm p-3 p-md-4 mb-4 wishlist-summary-card">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <h5 className="fw-bold mb-1">
                    Saved Products{" "}
                    <span className="text-muted">({wishlistCount})</span>
                  </h5>
                  <p className="text-muted mb-0">
                    Move products to cart or remove them anytime.
                  </p>
                </div>

                <Button variant="outline-danger" onClick={clearWishlist}>
                  <i className="bi bi-trash me-2" />
                  Clear Wishlist
                </Button>
              </div>
            </div>

            <div className="row g-4">
              {wishlistItems.map((product) => (
                <div className="col-sm-6 col-lg-4 col-xl-3" key={product.id}>
                  <ProductCard
                    product={product}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default WishlistPage;