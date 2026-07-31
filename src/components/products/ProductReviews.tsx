import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import { Link } from "react-router-dom";

import Button from "../common/Button";
import Loader from "../common/Loader";

import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";

import { reviewService } from "../../services/reviewService";

import type { Product } from "../../types/product";
import type { ProductReview } from "../../types/review";

/* ==========================================================================
   Types
   ========================================================================== */

interface ProductReviewsProps {
  product: Product;
}

interface ReviewFormValues {
  rating: string;
  title: string;
  comment: string;
}

interface RatingDistributionItem {
  rating: number;
  count: number;
  percentage: number;
}

/* ==========================================================================
   Constants
   ========================================================================== */

const initialFormValues: ReviewFormValues = {
  rating: "5",
  title: "",
  comment: ""
};

const ratingFilters = [0, 5, 4, 3, 2, 1];

const REVIEW_TITLE_MAX_LENGTH = 100;
const REVIEW_COMMENT_MAX_LENGTH = 1000;

/* ==========================================================================
   Helpers
   ========================================================================== */

const sortReviewsByDate = (reviews: ProductReview[]): ProductReview[] => {
  return [...reviews].sort(
    (firstReview, secondReview) =>
      new Date(secondReview.createdAt).getTime() -
      new Date(firstReview.createdAt).getTime()
  );
};

const formatReviewDate = (value: string): string => {
  const reviewDate = new Date(value);
  if (Number.isNaN(reviewDate.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium"
  }).format(reviewDate);
};

const getReviewTitle = (review: ProductReview): string => {
  const title = review.title?.trim();
  if (title) {
    return title;
  }

  return `${review.rating}-star product review`;
};

const getRatingLabel = (rating: number): string => {
  switch (rating) {
    case 5:
      return "Excellent";
    case 4:
      return "Very Good";
    case 3:
      return "Good";
    case 2:
      return "Average";
    case 1:
      return "Poor";
    default:
      return "Not Rated";
  }
};

const getRatingBadgeClass = (rating: number): string => {
  if (rating >= 4) {
    return "success";
  }

  if (rating === 3) {
    return "warning";
  }

  return "danger";
};

/* ==========================================================================
   Star Rating Component
   ========================================================================== */

interface ReviewStarsProps {
  rating: number;
  label?: string;
}

const ReviewStars = ({ rating, label }: ReviewStarsProps) => {
  const normalizedRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <span
      className="product-review-stars"
      aria-label={label ?? `${normalizedRating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const isFilled = index < normalizedRating;

        return (
          <i
            key={index}
            className={isFilled ? "bi bi-star-fill" : "bi bi-star"}
            aria-hidden="true"
          />
        );
      })}
    </span>
  );
};

/* ==========================================================================
   Product Reviews Component
   ========================================================================== */

const ProductReviews = ({ product }: ProductReviewsProps) => {
  const reviewFormRef = useRef<HTMLDivElement | null>(null);

  const { currentUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [formValues, setFormValues] =
    useState<ReviewFormValues>(initialFormValues);
  const [editingReviewId, setEditingReviewId] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string>("");
  const [loadError, setLoadError] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const userRole = currentUser?.role;
  const canWriteReview = userRole === "CUSTOMER" || userRole === "ADMIN";

  /* ==========================================================================
     Load Reviews and Reset Product-Specific State
     ========================================================================== */

  useEffect(() => {
    let isMounted = true;

    const loadReviews = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setLoadError("");

        const result = await reviewService.getReviewsByProductId(
          product.id
        );

        if (!isMounted) {
          return;
        }

        setReviews(sortReviewsByDate(result));
      } catch {
        if (!isMounted) {
          return;
        }

        setLoadError(
          "Unable to load reviews. Please make sure JSON Server is running."
        );
        setReviews([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    setReviews([]);
    setFormValues(initialFormValues);
    setEditingReviewId("");
    setRatingFilter(0);
    setFormError("");
    setSuccessMessage("");
    setDeletingReviewId("");

    void loadReviews();

    return () => {
      isMounted = false;
    };
  }, [product.id]);

  /* ==========================================================================
     Derived Review Data
     ========================================================================== */

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
    if (publishedReviews.length === 0) {
      return 0;
    }

    const totalRating = publishedReviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    return Number((totalRating / publishedReviews.length).toFixed(1));
  }, [publishedReviews]);

  const ratingDistribution = useMemo<RatingDistributionItem[]>(() => {
    return [5, 4, 3, 2, 1].map((rating) => {
      const count = publishedReviews.filter(
        (review) => review.rating === rating
      ).length;

      const percentage =
        publishedReviews.length > 0
          ? Math.round((count / publishedReviews.length) * 100)
          : 0;

      return {
        rating,
        count,
        percentage
      };
    });
  }, [publishedReviews]);

  const currentUserReview = useMemo(() => {
    if (!currentUser) {
      return null;
    }

    return (
      reviews.find((review) => review.userId === currentUser.id) ?? null
    );
  }, [currentUser, reviews]);

  const reviewCountLabel =
    publishedReviews.length === 1
      ? "1 published review"
      : `${publishedReviews.length} published reviews`;

  /* ==========================================================================
     Form Handlers
     ========================================================================== */

  const clearFormMessages = (): void => {
    setFormError("");
    setSuccessMessage("");
  };

  const handleFormChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ): void => {
    const { name, value } = event.target;

    setFormValues((previousValues) => ({
      ...previousValues,
      [name]: value
    }));

    clearFormMessages();
  };

  const validateForm = (): boolean => {
    const rating = Number(formValues.rating);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setFormError("Select a rating between 1 and 5.");
      return false;
    }

    const reviewTitle = formValues.title.trim();

    if (!reviewTitle) {
      setFormError("Review title is required.");
      return false;
    }

    if (reviewTitle.length > REVIEW_TITLE_MAX_LENGTH) {
      setFormError(
        `Review title cannot exceed ${REVIEW_TITLE_MAX_LENGTH} characters.`
      );
      return false;
    }

    const reviewComment = formValues.comment.trim();

    if (!reviewComment) {
      setFormError("Review comment is required.");
      return false;
    }

    if (reviewComment.length > REVIEW_COMMENT_MAX_LENGTH) {
      setFormError(
        `Review comment cannot exceed ${REVIEW_COMMENT_MAX_LENGTH} characters.`
      );
      return false;
    }

    return true;
  };

  const resetReviewForm = (): void => {
    setFormValues(initialFormValues);
    setEditingReviewId("");
    setFormError("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (!currentUser || !canWriteReview) {
      setFormError("Only customer and admin accounts can write reviews.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setFormError("");
      setSuccessMessage("");

      const normalizedRating = Number(formValues.rating);
      const normalizedTitle = formValues.title.trim();
      const normalizedComment = formValues.comment.trim();

      if (editingReviewId) {
        const updatedReview = await reviewService.updateReview(
          editingReviewId,
          {
            rating: normalizedRating,
            title: normalizedTitle,
            comment: normalizedComment,
            updatedAt: new Date().toISOString()
          }
        );

        setReviews((previousReviews) =>
          sortReviewsByDate(
            previousReviews.map((review) =>
              review.id === editingReviewId
                ? {
                    ...review,
                    ...updatedReview
                  }
                : review
            )
          )
        );

        setSuccessMessage("Review updated successfully.");
        showToast(
          "Review updated",
          "Your product review was updated successfully.",
          "success"
        );
      } else {
        if (currentUserReview) {
          setFormError(
            currentUserReview.status === "HIDDEN"
              ? "You already submitted a review for this product. The review is currently hidden."
              : "You have already reviewed this product."
          );
          return;
        }

        const createdReview = await reviewService.createReview({
          productId: product.id,
          userId: currentUser.id,
          userName: currentUser.name,
          rating: normalizedRating,
          title: normalizedTitle,
          comment: normalizedComment,
          status: "PUBLISHED"
        });

        setReviews((previousReviews) =>
          sortReviewsByDate([createdReview, ...previousReviews])
        );

        setSuccessMessage("Review submitted successfully.");
        showToast(
          "Review submitted",
          "Your product review was published successfully.",
          "success"
        );
      }

      resetReviewForm();
    } catch {
      setFormError(
        editingReviewId
          ? "Unable to update the review. Please try again."
          : "Unable to submit the review. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* ==========================================================================
     Edit Review
     ========================================================================== */

  const handleEdit = (review: ProductReview): void => {
    setEditingReviewId(review.id);

    setFormValues({
      rating: String(review.rating),
      title: review.title ?? "",
      comment: review.comment
    });

    clearFormMessages();

    window.requestAnimationFrame(() => {
      reviewFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    });
  };

  const handleCancelEdit = (): void => {
    resetReviewForm();
    setSuccessMessage("");
  };

  /* ==========================================================================
     Delete Review
     ========================================================================== */

  const handleDelete = async (reviewId: string): Promise<void> => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingReviewId(reviewId);

      await reviewService.deleteReview(reviewId);

      setReviews((previousReviews) =>
        previousReviews.filter((review) => review.id !== reviewId)
      );

      if (editingReviewId === reviewId) {
        resetReviewForm();
      }

      showToast(
        "Review deleted",
        "The review was deleted successfully.",
        "success"
      );
    } catch {
      showToast("Unable to delete review", "Please try again.", "danger");
    } finally {
      setDeletingReviewId("");
    }
  };

  /* ==========================================================================
     Loading State
     ========================================================================== */

  if (isLoading) {
    return <Loader message="Loading reviews..." />;
  }

  const safeProductId = product.id ?? "default";

  /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <section
      className="product-reviews-module"
      aria-labelledby={`product-reviews-title-${safeProductId}`}
    >
      <div className="product-reviews-heading">
        <div>
          <h3
            id={`product-reviews-title-${safeProductId}`}
            className="product-reviews-title"
          >
            Ratings & Reviews
          </h3>

          <p className="product-reviews-subtitle">
            Ratings and experiences shared by ShopEase customers.
          </p>
        </div>

        {publishedReviews.length > 0 ? (
          <span className="product-reviews-count">
            {publishedReviews.length}
          </span>
        ) : null}
      </div>

      {loadError ? (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
          {loadError}
        </div>
      ) : null}

      {/* Rating Summary and Review Form */}
      <div className="row g-4 mb-4">
        <div className="col-lg-4">
          <section
            className="review-summary-card h-100"
            aria-labelledby={`rating-summary-title-${safeProductId}`}
          >
            <h4
              id={`rating-summary-title-${safeProductId}`}
              className="review-summary-title"
            >
              Rating Summary
            </h4>

            <div className="review-average-row">
              <div className="review-average-rating">
                {averageRating.toFixed(1)}
              </div>

              <div className="review-average-details">
                <span className="review-average-scale">out of 5</span>

                <ReviewStars
                  rating={averageRating}
                  label={`${averageRating.toFixed(1)} out of 5 stars`}
                />
              </div>
            </div>

            <p className="review-summary-count">
              Based on {reviewCountLabel}.
            </p>

            <div className="review-distribution">
              {ratingDistribution.map((item) => (
                <div className="review-distribution-row" key={item.rating}>
                  <span className="review-distribution-label">
                    {item.rating}
                    <i className="bi bi-star-fill" aria-hidden="true" />
                  </span>

                  <div
                    className="review-distribution-track"
                    role="progressbar"
                    aria-label={`${item.rating}-star reviews`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={item.percentage}
                  >
                    <span
                      className="review-distribution-fill"
                      style={{
                        width: `${item.percentage}%`
                      }}
                    />
                  </div>

                  <span className="review-distribution-count">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-lg-8">
          <section
            ref={reviewFormRef}
            className="review-form-card h-100"
            aria-labelledby={`review-form-title-${safeProductId}`}
          >
            <div className="review-form-header">
              <div>
                <h4
                  id={`review-form-title-${safeProductId}`}
                  className="review-form-title"
                >
                  {editingReviewId ? "Edit Your Review" : "Write a Review"}
                </h4>

                <p>Share a clear and useful experience with other customers.</p>
              </div>

              <span className="review-form-icon" aria-hidden="true">
                <i className="bi bi-pencil-square" />
              </span>
            </div>

            {formError ? (
              <div className="alert alert-danger" role="alert">
                <i
                  className="bi bi-exclamation-circle me-2"
                  aria-hidden="true"
                />
                {formError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="alert alert-success" role="status">
                <i className="bi bi-check-circle me-2" aria-hidden="true" />
                {successMessage}
              </div>
            ) : null}

            {!isAuthenticated ? (
              <div className="review-auth-message">
                <i className="bi bi-person-lock" aria-hidden="true" />
                <p>
                  Please{" "}
                  <Link to="/login" className="review-login-link">
                    sign in
                  </Link>{" "}
                  to write a product review.
                </p>
              </div>
            ) : !canWriteReview ? (
              <div className="review-auth-message">
                <i className="bi bi-info-circle" aria-hidden="true" />
                <p>
                  Reviews can be written only by customer and administrator
                  accounts.
                </p>
              </div>
            ) : currentUserReview && !editingReviewId ? (
              <div className="review-existing-message">
                <span className="review-existing-icon">
                  <i className="bi bi-check2-circle text-primary" aria-hidden="true" />
                </span>

                <div>
                  <strong>You already reviewed this product</strong>
                  <p>
                    {currentUserReview.status === "HIDDEN"
                      ? "The review is currently hidden and cannot be displayed publicly."
                      : "You can update the existing review if your experience has changed."}
                  </p>

                  <Button
                    type="button"
                    variant="outline-primary"
                    onClick={() => handleEdit(currentUserReview)}
                  >
                    <i className="bi bi-pencil me-2" aria-hidden="true" />
                    Edit My Review
                  </Button>
                </div>
              </div>
            ) : (
              <form
                className="review-form"
                noValidate
                onSubmit={(event) => {
                  void handleSubmit(event);
                }}
              >
                <div className="mb-3">
                  <label
                    className="form-label fw-semibold"
                    htmlFor={`review-rating-${safeProductId}`}
                  >
                    Rating
                  </label>

                  <select
                    id={`review-rating-${safeProductId}`}
                    name="rating"
                    className="form-select"
                    value={formValues.rating}
                    disabled={isSaving}
                    onChange={handleFormChange}
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Very Good</option>
                    <option value="3">3 - Good</option>
                    <option value="2">2 - Average</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>

                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <label
                      className="form-label fw-semibold"
                      htmlFor={`review-title-${safeProductId}`}
                    >
                      Title
                    </label>

                    <span className="review-character-count">
                      {formValues.title.length}/{REVIEW_TITLE_MAX_LENGTH}
                    </span>
                  </div>

                  <input
                    id={`review-title-${safeProductId}`}
                    name="title"
                    type="text"
                    className="form-control"
                    value={formValues.title}
                    maxLength={REVIEW_TITLE_MAX_LENGTH}
                    disabled={isSaving}
                    placeholder="Summarise your experience"
                    onChange={handleFormChange}
                  />
                </div>

                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <label
                      className="form-label fw-semibold"
                      htmlFor={`review-comment-${safeProductId}`}
                    >
                      Review
                    </label>

                    <span className="review-character-count">
                      {formValues.comment.length}/{REVIEW_COMMENT_MAX_LENGTH}
                    </span>
                  </div>

                  <textarea
                    id={`review-comment-${safeProductId}`}
                    name="comment"
                    className="form-control"
                    rows={5}
                    value={formValues.comment}
                    maxLength={REVIEW_COMMENT_MAX_LENGTH}
                    disabled={isSaving}
                    placeholder="Share details about quality, fit, performance, or overall experience"
                    onChange={handleFormChange}
                  />
                </div>

                <div className="review-form-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    {editingReviewId ? "Update Review" : "Submit Review"}
                  </Button>

                  {editingReviewId ? (
                    <Button
                      type="button"
                      variant="outline-secondary"
                      disabled={isSaving}
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </form>
            )}
          </section>
        </div>
      </div>

      {/* Review List */}
      <section
        className="product-review-list-section"
        aria-labelledby={`customer-reviews-title-${safeProductId}`}
      >
        <div className="product-review-list-header">
          <div>
            <h4
              id={`customer-reviews-title-${safeProductId}`}
              className="product-review-list-title"
            >
              Customer Reviews
            </h4>

            <p>
              {ratingFilter === 0
                ? reviewCountLabel
                : `${filteredReviews.length} ${
                    filteredReviews.length === 1 ? "review" : "reviews"
                  } with ${ratingFilter} stars`}
            </p>
          </div>

          <div className="review-filter-wrapper">
            <label
              className="visually-hidden"
              htmlFor={`review-filter-${safeProductId}`}
            >
              Filter customer reviews by rating
            </label>

            <select
              id={`review-filter-${safeProductId}`}
              className="form-select review-filter-select"
              value={ratingFilter}
              onChange={(event) =>
                setRatingFilter(Number(event.target.value))
              }
            >
              {ratingFilters.map((rating) => (
                <option key={rating} value={rating}>
                  {rating === 0 ? "All Ratings" : `${rating} Star`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="product-reviews-empty">
            <span className="product-reviews-empty-icon">
              <i className="bi bi-chat-square-text" aria-hidden="true" />
            </span>

            <div>
              <strong>
                {ratingFilter === 0
                  ? "No customer reviews yet"
                  : `No ${ratingFilter}-star reviews found`}
              </strong>

              <p>
                {ratingFilter === 0
                  ? "Be the first customer to share an experience with this product."
                  : "Choose another rating filter to view available reviews."}
              </p>
            </div>
          </div>
        ) : (
          <div className="product-review-list">
            {filteredReviews.map((review) => {
              const isReviewOwner = currentUser?.id === review.userId;
              const canDeleteReview =
                isReviewOwner || currentUser?.role === "ADMIN";
              const isDeleting = deletingReviewId === review.id;

              return (
                <article key={review.id} className="product-review-card">
                  <div className="product-review-card-header">
                    <div className="product-review-heading-group">
                      <span
                        className={`product-review-rating-badge ${getRatingBadgeClass(
                          review.rating
                        )}`}
                        aria-label={`${review.rating} out of 5 stars, ${getRatingLabel(
                          review.rating
                        )}`}
                      >
                        {review.rating}
                        <i className="bi bi-star-fill" aria-hidden="true" />
                      </span>

                      <h5 className="product-review-card-title">
                        {getReviewTitle(review)}
                      </h5>
                    </div>

                    {canDeleteReview ? (
                      <div className="product-review-actions">
                        {isReviewOwner ? (
                          <Button
                            type="button"
                            variant="outline-primary"
                            className="btn-sm"
                            disabled={isDeleting}
                            onClick={() => handleEdit(review)}
                          >
                            <i
                              className="bi bi-pencil me-1"
                              aria-hidden="true"
                            />
                            Edit
                          </Button>
                        ) : null}

                        <Button
                          type="button"
                          variant="outline-danger"
                          className="btn-sm"
                          isLoading={isDeleting}
                          disabled={isDeleting}
                          onClick={() => {
                            void handleDelete(review.id);
                          }}
                        >
                          <i
                            className="bi bi-trash me-1"
                            aria-hidden="true"
                          />
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <ReviewStars rating={review.rating} />

                  <p className="product-review-comment">{review.comment}</p>

                  <footer className="product-review-meta">
                    <span className="product-review-author">
                      <i
                        className="bi bi-person-circle text-primary"
                        aria-hidden="true"
                      />
                      {review.userName}
                    </span>

                    <span
                      className="product-review-meta-separator"
                      aria-hidden="true"
                    >
                      •
                    </span>

                    <time dateTime={review.createdAt}>
                      {formatReviewDate(review.createdAt)}
                    </time>

                    {review.updatedAt !== review.createdAt ? (
                      <>
                        <span
                          className="product-review-meta-separator"
                          aria-hidden="true"
                        >
                          •
                        </span>

                        <span>Edited</span>
                      </>
                    ) : null}
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
};

export default ProductReviews;