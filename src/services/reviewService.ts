import { apiClient } from "./apiClient";
import type {
  CreateReviewPayload,
  ProductReview,
  ReviewStatus,
  UpdateReviewPayload
} from "../types/review";
import { assertValidDeleteId } from "../utils/deleteSafetyUtils";

const REVIEWS_ENDPOINT = "/reviews";

export const reviewService = {
  getReviews: async (): Promise<ProductReview[]> => {
    return apiClient.get<ProductReview[]>(REVIEWS_ENDPOINT);
  },

  getReviewsByProductId: async (
    productId: string
  ): Promise<ProductReview[]> => {
    return apiClient.get<ProductReview[]>(
      `${REVIEWS_ENDPOINT}?productId=${encodeURIComponent(productId)}`
    );
  },

  createReview: async (
    payload: CreateReviewPayload
  ): Promise<ProductReview> => {
    const now = new Date().toISOString();

    const review: ProductReview = {
      id: `review-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      ...payload
    };

    return apiClient.post<ProductReview, ProductReview>(
      REVIEWS_ENDPOINT,
      review
    );
  },

  updateReview: async (
    reviewId: string,
    payload: UpdateReviewPayload
  ): Promise<ProductReview> => {
    return apiClient.patch<ProductReview, UpdateReviewPayload>(
      `${REVIEWS_ENDPOINT}/${reviewId}`,
      payload
    );
  },

  updateReviewStatus: async (
    reviewId: string,
    status: ReviewStatus
  ): Promise<ProductReview> => {
    return reviewService.updateReview(reviewId, {
      status,
      updatedAt: new Date().toISOString()
    });
  },

  /*deleteReview: async (reviewId: string): Promise<void> => {
    await apiClient.delete<void>(`${REVIEWS_ENDPOINT}/${reviewId}`);
  }*/
 deleteReview: async (reviewId: string): Promise<void> => {
  assertValidDeleteId({
    entityType: "review",
    id: reviewId
  });

  await apiClient.delete<void>(
    `${REVIEWS_ENDPOINT}/${encodeURIComponent(reviewId)}`
  );
},
};