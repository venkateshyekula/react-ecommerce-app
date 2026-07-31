export type ReviewStatus = "PUBLISHED" | "HIDDEN";

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewPayload {
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  status: ReviewStatus;
}

export interface UpdateReviewPayload {
  rating?: number;
  title?: string;
  comment?: string;
  status?: ReviewStatus;
  updatedAt: string;
}