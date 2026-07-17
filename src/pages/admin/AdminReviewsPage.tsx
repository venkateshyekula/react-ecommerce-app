import { useEffect, useMemo, useState } from "react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { reviewService } from "../../services/reviewService";
import type { ProductReview, ReviewStatus } from "../../types/review";
import { useToast } from "../../context/useToast";

const statusOptions: Array<ReviewStatus | ""> = ["", "PUBLISHED", "HIDDEN"];

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "">("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingReviewId, setUpdatingReviewId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { showToast } = useToast();

  const loadReviews = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const result = await reviewService.getReviews();

      setReviews(
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch {
      setErrorMessage(
        "Unable to load reviews. Please make sure JSON Server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesSearch =
        !query ||
        review.userName.toLowerCase().includes(query) ||
        review.title.toLowerCase().includes(query) ||
        review.comment.toLowerCase().includes(query) ||
        review.productId.toLowerCase().includes(query);

      const matchesStatus = !statusFilter || review.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reviews, searchText, statusFilter]);

  const handleStatusChange = async (
    review: ProductReview,
    status: ReviewStatus
  ): Promise<void> => {
    try {
      setUpdatingReviewId(review.id);

      const updatedReview = await reviewService.updateReviewStatus(
        review.id,
        status
      );

      setReviews((previousReviews) =>
        previousReviews.map((existingReview) =>
          existingReview.id === updatedReview.id ? updatedReview : existingReview
        )
      );
    } catch {
      setErrorMessage("Unable to update review status.");
    } finally {
      setUpdatingReviewId("");
    }
  };

  const handleDelete = async (reviewId: string): Promise<void> => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await reviewService.deleteReview(reviewId);

      setReviews((previousReviews) =>
        previousReviews.filter((review) => review.id !== reviewId)
      );

      showToast(
"Review deleted",
"Review was deleted successfully.",
"success"
      );
    } catch {
      showToast("Unable to delete review", "Please try again.", "danger");
    }
  };

  if (isLoading) {
    return <Loader message="Loading review dashboard..." />;
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Customer Feedback</h1>
          <p className="text-muted mb-0">
            Moderate customer reviews and product feedback.
          </p>
        </div>

        <Button variant="outline-primary" onClick={() => void loadReviews()}>
          <i className="bi bi-arrow-repeat me-2" />
          Refresh
        </Button>
      </div>

      {errorMessage ? (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <div className="admin-panel-card mb-4">
        <div className="row g-3">
          <div className="col-md-8">
            <input
              className="form-control"
              placeholder="Search by customer, product ID, title, or comment..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="col-md-4">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ReviewStatus | "")
              }
            >
              {statusOptions.map((status) => (
                <option key={status || "ALL"} value={status}>
                  {status || "All Statuses"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="admin-panel-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Review</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <h6 className="fw-semibold mb-1">{review.title}</h6>
                    <p className="small text-muted mb-0">{review.comment}</p>
                  </td>

                  <td>{review.userName}</td>

                  <td>{review.productId}</td>

                  <td>
                    <span className="rating-badge">
                      <i className="bi bi-star-fill text-warning me-1" />
                      {review.rating}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        review.status === "PUBLISHED"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {review.status}
                    </span>
                  </td>

                  <td>
                    <div className="d-flex gap-2">
                      <select
                        className="form-select form-select-sm admin-review-status-select"
                        value={review.status}
                        disabled={updatingReviewId === review.id}
                        onChange={(event) =>
                          void handleStatusChange(
                            review,
                            event.target.value as ReviewStatus
                          )
                        }
                      >
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="HIDDEN">HIDDEN</option>
                      </select>

                      <Button
                        variant="outline-danger"
                        className="btn-sm"
                        onClick={() => void handleDelete(review.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No reviews found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReviewsPage;