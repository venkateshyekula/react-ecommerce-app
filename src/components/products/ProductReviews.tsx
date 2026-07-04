import type { Product } from "../../types/product";

interface ProductReviewsProps {
  product: Product;
}

const ProductReviews = ({ product }: ProductReviewsProps) => {
  const ratingCount = Math.max(120, Math.round(product.rating * 485));

  const reviews = [
    {
      id: "review-001",
      userName: "Verified Customer",
      rating: 5,
      title: "Excellent product",
      comment:
        "Product quality is very good and the delivery experience was smooth.",
      date: "2 days ago"
    },
    {
      id: "review-002",
      userName: "Verified Buyer",
      rating: 4,
      title: "Worth the price",
      comment:
        "Good value for money. Packaging and product condition were perfect.",
      date: "1 week ago"
    },
    {
      id: "review-003",
      userName: "ShopEase User",
      rating: 4,
      title: "Recommended",
      comment:
        "The product matches the description and specifications mentioned.",
      date: "2 weeks ago"
    }
  ];

  return (
    <div className="product-reviews-section">
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="rating-summary-card bg-light rounded-4 p-4 text-center">
            <div className="rating-summary-score mb-2">
              {product.rating}
              <i className="bi bi-star-fill ms-2" />
            </div>

            <p className="fw-bold mb-1">{ratingCount} Ratings</p>
            <p className="text-muted small mb-0">
              Based on verified customer feedback
            </p>
          </div>
        </div>

        <div className="col-lg-8">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="product-review-card border-bottom pb-3 mb-3"
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-success">
                  {review.rating}
                  <i className="bi bi-star-fill ms-1" />
                </span>

                <strong>{review.title}</strong>
              </div>

              <p className="text-muted mb-2">{review.comment}</p>

              <p className="small text-muted mb-0">
                {review.userName} • {review.date}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;