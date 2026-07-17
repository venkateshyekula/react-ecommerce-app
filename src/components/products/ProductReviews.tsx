import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ChangeEvent,
  type FormEvent
} from "react";
import { Link } from "react-router-dom";
import Button from "../common/Button";
import Loader from "../common/Loader";
import { useAuth } from "../../context/useAuth";
import { reviewService } from "../../services/reviewService";
import type { Product } from "../../types/product";
import type { ProductReview } from "../../types/review";
import { useToast } from "../../context/useToast";

interface ProductReviewsProps {
  product: Product;
}

interface ReviewFormValues {
  rating: string;
  title: string;
  comment: string;
}

const initialFormValues: ReviewFormValues = {
  rating: "5",
  title: "",
  comment: ""
};

const ratingFilters = [0, 5, 4, 3, 2, 1];

const ProductReviews = ({ product }: ProductReviewsProps) => {
  const { currentUser, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [formValues, setFormValues] = useState<ReviewFormValues>(initialFormValues);
  const [editingReviewId, setEditingReviewId] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const { showToast } = useToast();

  const userRole = currentUser?.role;
  const canWriteReview = userRole === "CUSTOMER" || userRole === "ADMIN";

  // FIX: Wrapped in useCallback to prevent reference mutation loops across renders
  const loadReviews = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const result = await reviewService.getReviewsByProductId(product.id);
      setReviews(
        result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch {
      setErrorMessage(
        "Unable to load reviews. Please make sure JSON Server is running."
      );
    } finally {
      setIsLoading(false);
    }
  }, [product.id]);

  // FIX: Reset all stale input/error text contexts when shifting between products
  useEffect(() => {
    setFormValues(initialFormValues);
    setEditingReviewId("");
    setRatingFilter(0);
    setErrorMessage("");
    setSuccessMessage("");
    
    void loadReviews();
  }, [product.id, loadReviews]);

  const publishedReviews = useMemo(() => {
    return reviews.filter((review) => review.status === "PUBLISHED");
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (ratingFilter === 0) {
      return publishedReviews;
    }
    return publishedReviews.filter((review) => review.rating === ratingFilter);
  }, [publishedReviews, ratingFilter]);

  const averageRating = useMemo(() => {
    if (publishedReviews.length === 0) return 0;

    const totalRating = publishedReviews.reduce((sum, review) => sum + review.rating, 0);
    return Number((totalRating / publishedReviews.length).toFixed(1));
  }, [publishedReviews]);

  const currentUserReview = useMemo(() => {
    if (!currentUser) return null;
    return reviews.find((review) => review.userId === currentUser.id) ?? null;
  }, [reviews, currentUser]);

  const ratingDistribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((rating) => {
      const count = publishedReviews.filter((review) => review.rating === rating).length;

      return {
        rating,
        count,
        percentage: publishedReviews.length > 0 
          ? Math.round((count / publishedReviews.length) * 100) 
          : 0
      };
    });
  }, [publishedReviews]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = event.target;

    setFormValues((previousValues) => ({
      ...previousValues,
      [name]: value
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const validateForm = (): boolean => {
    const rating = Number(formValues.rating);

    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      setErrorMessage("Rating must be between 1 and 5.");
      return false;
    }
    if (!formValues.title.trim()) {
      setErrorMessage("Review title is required.");
      return false;
    }
    if (!formValues.comment.trim()) {
      setErrorMessage("Review comment is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!currentUser || !canWriteReview) {
      setErrorMessage("Only customer and admin accounts can write reviews.");
      return;
    }

    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (editingReviewId) {
        const updatedFields = await reviewService.updateReview(
          editingReviewId,
          {
            rating: Number(formValues.rating),
            title: formValues.title.trim(),
            comment: formValues.comment.trim(),
            updatedAt: new Date().toISOString()
          }
        );

        // FIX: Deep merge old review items with new properties to guard against missing fields
        setReviews((previousReviews) =>
          previousReviews.map((review) =>
            review.id === editingReviewId ? { ...review, ...updatedFields } : review
          )
        );

        setSuccessMessage("Review updated successfully.");
      } else {
        if (currentUserReview) {
          setErrorMessage("You have already reviewed this product.");
          return;
        }

        const createdReview = await reviewService.createReview({
          productId: product.id,
          userId: currentUser.id,
          userName: currentUser.name,
          rating: Number(formValues.rating),
          title: formValues.title.trim(),
          comment: formValues.comment.trim(),
          status: "PUBLISHED"
        });

        setReviews((previousReviews) => [createdReview, ...previousReviews]);
        setSuccessMessage("Review added successfully.");
      }

      setFormValues(initialFormValues);
      setEditingReviewId("");
    } catch {
      setErrorMessage("Unable to save review. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (review: ProductReview): void => {
    setEditingReviewId(review.id);
    setFormValues({
      rating: String(review.rating),
      title: review.title,
      comment: review.comment
    });
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleDelete = async (reviewId: string): Promise<void> => {
    const shouldDelete = window.confirm("Are you sure you want to delete this review?");
    if (!shouldDelete) return;

    try {
      await reviewService.deleteReview(reviewId);
      setReviews((previousReviews) => previousReviews.filter((review) => review.id !== reviewId));
      showToast(
"Review deleted",
"Review was deleted successfully.",
"success"
);
      
      // Clear edit form if they deleted the item they were currently editing
      if (editingReviewId === reviewId) {
        setEditingReviewId("");
        setFormValues(initialFormValues);
      }
    } catch {
      showToast("Unable to delete review", "Please try again.", "danger");
    }
  };

  const handleCancelEdit = (): void => {
    setEditingReviewId("");
    setFormValues(initialFormValues);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // UX Enhancement Helper: Renders clean, repeating multi-star icons
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i 
        key={index} 
        className={`bi ${index < rating ? "bi-star-fill text-warning" : "bi-star text-muted"} me-1`} 
      />
    ));
  };

  if (isLoading) {
    return <Loader message="Loading reviews..." />;
  }

  return (
    <div className="product-reviews-module">
      {errorMessage && (
        <div className="alert alert-danger" role="alert">{errorMessage}</div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="alert">{successMessage}</div>
      )}

      <div className="row g-4 mb-4">
        <div className="col-lg-4">
          <div className="review-summary-card bg-light rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-3">Rating Summary</h5>

            <div className="d-flex align-items-end gap-2 mb-3">
              <span className="review-average-rating fs-5 fw-bold">{averageRating}</span>
              <span className="text-muted fw-bold">/ 5</span>
              <div className="ms-2 mb-2">{renderStars(Math.round(averageRating))}</div>
            </div>

            <p className="text-muted mb-4">
              Based on {publishedReviews.length} published reviews.
            </p>

            <div className="review-distribution">
              {ratingDistribution.map((item) => (
                <div className="review-distribution-row d-flex align-items-center gap-2 mb-2" key={item.rating}>
                  <span style={{ width: "30px" }}>{item.rating}★</span>
                  <div className="review-distribution-track flex-grow-1 bg-secondary-subtle rounded" style={{ height: "8px" }}>
                    <div
                      className="review-distribution-fill bg-warning rounded h-100"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <small style={{ width: "25px" }} className="text-end">{item.count}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="review-form-card bg-light rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-3">
              {editingReviewId ? "Edit Your Review" : "Write a Review"}
            </h5>

            {!isAuthenticated ? (
              <p className="text-muted mb-0">
                Please <Link to="/login" className="fw-bold">login</Link> to write a review.
              </p>
            ) : !canWriteReview ? (
              <p className="text-muted mb-0">
                Reviews can be written only by customer and admin accounts.
              </p>
            ) : currentUserReview && !editingReviewId ? (
              <div>
                <p className="text-muted mb-3">You have already reviewed this product.</p>
                <Button variant="outline-primary" onClick={() => handleEdit(currentUserReview)}>
                  Edit My Review
                </Button>
              </div>
            ) : (
              <form onSubmit={(e) => { void handleSubmit(e); }}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Rating</label>
                  <select
                    name="rating"
                    className="form-select"
                    value={formValues.rating}
                    onChange={handleChange}
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Very Good</option>
                    <option value="3">3 - Good</option>
                    <option value="2">2 - Average</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Title</label>
                  <input
                    name="title"
                    className="form-control"
                    value={formValues.title}
                    onChange={handleChange}
                    placeholder="Short review title"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Comment</label>
                  <textarea
                    name="comment"
                    className="form-control"
                    rows={4}
                    value={formValues.comment}
                    onChange={handleChange}
                    placeholder="Share your experience with this product"
                  />
                </div>

                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary" isLoading={isSaving}>
                    {editingReviewId ? "Update Review" : "Submit Review"}
                  </Button>

                  {editingReviewId && (
                    <Button type="button" variant="outline-secondary" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <h5 className="fw-bold mb-0">Customer Reviews</h5>

        <select
          className="form-select review-filter-select"
          style={{ width: "auto" }}
          value={ratingFilter}
          onChange={(event) => setRatingFilter(Number(event.target.value))}
        >
          {ratingFilters.map((rating) => (
            <option key={rating} value={rating}>
              {rating === 0 ? "All Ratings" : `${rating} Star`}
            </option>
          ))}
        </select>
      </div>

      {filteredReviews.length === 0 ? (
        <p className="text-muted mb-0">No reviews found.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredReviews.map((review) => {
            const canModifyReview = currentUser?.id === review.userId || currentUser?.role === "ADMIN";

            return (
              <div key={review.id} className="product-review-card border-bottom pb-3">
                <div className="d-flex justify-content-between gap-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="rating-badge d-flex align-items-center">
                        {renderStars(review.rating)}
                      </span>
                      <h6 className="fw-bold mb-0 ms-2">{review.title}</h6>
                    </div>

                    <p className="text-muted mb-1">{review.comment}</p>

                    <p className="small text-muted mb-0">
                      By {review.userName} on{" "}
                      {new Intl.DateTimeFormat("en-IN", {
                        dateStyle: "medium"
                      }).format(new Date(review.createdAt))}
                    </p>
                  </div>

                  {canModifyReview && (
                    <div className="d-flex gap-2 align-items-start">
                      {currentUser?.id === review.userId && (
                        <Button
                          variant="outline-primary"
                          className="btn-sm"
                          onClick={() => handleEdit(review)}
                        >
                          Edit
                        </Button>
                      )}

                      <Button
                        variant="outline-danger"
                        className="btn-sm"
                        onClick={() => void handleDelete(review.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;